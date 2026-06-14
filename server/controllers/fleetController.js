const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/fleet
 * Get fleet info and members
 */
const getFleetInfo = async (req, res, next) => {
  try {
    const user = req.user;

    // Determine the fleet ID to look up
    let fleetId = null;

    if (user.familyRole === 'owner' && user.familyFleetId) {
      fleetId = user.familyFleetId;
    } else if (user.familyRole === 'member' && user.linkedFleetId) {
      fleetId = user.linkedFleetId;
    }

    if (!fleetId) {
      return res.status(200).json({
        success: true,
        data: {
          fleet: null,
          message: 'You are not part of any fleet',
        },
      });
    }

    // Find fleet owner
    const owner = await User.findOne({ familyFleetId: fleetId }).select('-password');

    if (!owner) {
      throw new AppError('Fleet owner not found', 404);
    }

    // Find all members linked to this fleet
    const members = await User.find({ linkedFleetId: fleetId }).select('-password');

    // Total members = owner + linked members
    const allMembers = [
      { ...owner.toSafeObject(), role: 'owner' },
      ...members.map((m) => ({ ...m.toSafeObject(), role: 'member' })),
    ];

    res.status(200).json({
      success: true,
      data: {
        fleet: {
          fleetId,
          totalMembers: allMembers.length,
          members: allMembers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/fleet/join
 * Join a fleet using a fleet ID code
 */
const joinFleet = async (req, res, next) => {
  try {
    const { fleetId } = req.body;
    const user = req.user;

    if (!fleetId) {
      throw new AppError('Fleet ID is required', 400);
    }

    // Cannot join if already an owner with a fleet
    if (user.familyRole === 'owner' && user.familyFleetId) {
      throw new AppError(
        'You are a fleet owner. Transfer ownership or delete your fleet before joining another.',
        400
      );
    }

    // Cannot join if already a member
    if (user.linkedFleetId) {
      throw new AppError('You are already a member of a fleet. Leave current fleet first.', 400);
    }

    // Verify fleet exists
    const fleetOwner = await User.findOne({ familyFleetId: fleetId });

    if (!fleetOwner) {
      throw new AppError('Invalid fleet ID. No fleet found with this code.', 404);
    }

    // Cannot join own fleet
    if (fleetOwner._id.toString() === user._id.toString()) {
      throw new AppError('You cannot join your own fleet', 400);
    }

    // Update user to become a member
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        familyRole: 'member',
        linkedFleetId: fleetId,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Successfully joined fleet owned by ${fleetOwner.name}`,
      data: { user: updatedUser.toSafeObject() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/fleet/leave
 * Leave current fleet
 */
const leaveFleet = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.familyRole === 'owner') {
      throw new AppError(
        'Fleet owners cannot leave their own fleet. Transfer ownership or delete the fleet.',
        400
      );
    }

    if (!user.linkedFleetId) {
      throw new AppError('You are not a member of any fleet', 400);
    }

    // Update user — restore to owner role with a new fleet ID
    const { v4: uuidv4 } = require('uuid');
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        familyRole: 'owner',
        linkedFleetId: null,
        familyFleetId: uuidv4(),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Successfully left the fleet. You are now a fleet owner.',
      data: { user: updatedUser.toSafeObject() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/fleet/vehicles
 * Get all vehicles across fleet members
 */
const getFleetVehicles = async (req, res, next) => {
  try {
    const user = req.user;

    let fleetId = null;

    if (user.familyRole === 'owner' && user.familyFleetId) {
      fleetId = user.familyFleetId;
    } else if (user.familyRole === 'member' && user.linkedFleetId) {
      fleetId = user.linkedFleetId;
    }

    if (!fleetId) {
      // No fleet — return only user's own vehicles
      const vehicles = await Vehicle.find({ userId: user._id, isActive: true })
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: {
          vehicles,
          totalVehicles: vehicles.length,
          isFleet: false,
        },
      });
    }

    // Get all fleet member IDs
    const owner = await User.findOne({ familyFleetId: fleetId });
    const members = await User.find({ linkedFleetId: fleetId });

    const allUserIds = [owner._id, ...members.map((m) => m._id)];

    // Fetch all vehicles for fleet members
    const vehicles = await Vehicle.find({
      userId: { $in: allUserIds },
      isActive: true,
    })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        vehicles,
        totalVehicles: vehicles.length,
        isFleet: true,
        fleetId,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFleetInfo,
  joinFleet,
  leaveFleet,
  getFleetVehicles,
};
