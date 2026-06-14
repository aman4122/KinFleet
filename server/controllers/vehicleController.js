const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

/**
 * Helper: get all user IDs for a user's fleet
 */
const getFleetUserIds = async (user) => {
  let fleetId = null;

  if (user.familyRole === 'owner' && user.familyFleetId) {
    fleetId = user.familyFleetId;
  } else if (user.familyRole === 'member' && user.linkedFleetId) {
    fleetId = user.linkedFleetId;
  }

  if (!fleetId) return [user._id];

  const owner = await User.findOne({ familyFleetId: fleetId });
  const members = await User.find({ linkedFleetId: fleetId });

  return [owner._id, ...members.map((m) => m._id)];
};

/**
 * GET /api/vehicles
 * Get user's vehicles (+ fleet vehicles if in a fleet)
 */
const getVehicles = async (req, res, next) => {
  try {
    const fleetUserIds = await getFleetUserIds(req.user);

    const vehicles = await Vehicle.find({
      userId: { $in: fleetUserIds },
      isActive: true,
    })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        vehicles,
        totalVehicles: vehicles.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/vehicles/:id
 * Get a single vehicle with compliance status
 */
const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('userId', 'name email phone');

    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    // Check access: must be owner or fleet member
    const fleetUserIds = await getFleetUserIds(req.user);
    const hasAccess = fleetUserIds.some((id) => id.toString() === vehicle.userId._id.toString());

    if (!hasAccess) {
      throw new AppError('Not authorized to access this vehicle', 403);
    }

    const complianceStatus = vehicle.getComplianceStatus();

    res.status(200).json({
      success: true,
      data: {
        vehicle,
        compliance: complianceStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/vehicles
 * Create a new vehicle
 */
const createVehicle = async (req, res, next) => {
  try {
    const {
      vin,
      registrationNumber,
      make,
      model,
      year,
      fuelType,
      color,
      registrationDate,
      insuranceExpiry,
      pucExpiry,
      lastServiceDate,
      lastServiceMileage,
      currentMileage,
      serviceIntervalKm,
      serviceIntervalDays,
    } = req.body;

    const vehicle = await Vehicle.create({
      userId: req.user._id,
      vin,
      registrationNumber,
      make,
      model,
      year,
      fuelType,
      color,
      registrationDate,
      insuranceExpiry,
      pucExpiry,
      lastServiceDate,
      lastServiceMileage,
      currentMileage,
      serviceIntervalKm,
      serviceIntervalDays,
    });

    const populatedVehicle = await Vehicle.findById(vehicle._id).populate('userId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: { vehicle: populatedVehicle },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/vehicles/:id
 * Update a vehicle (check ownership)
 */
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    // Only the owner can update
    if (vehicle.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this vehicle', 403);
    }

    // Fields that can be updated
    const allowedUpdates = [
      'make', 'model', 'year', 'fuelType', 'color',
      'registrationDate', 'insuranceExpiry', 'pucExpiry',
      'lastServiceDate', 'lastServiceMileage', 'currentMileage',
      'serviceIntervalKm', 'serviceIntervalDays',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        vehicle[field] = req.body[field];
      }
    });

    await vehicle.save();

    const updatedVehicle = await Vehicle.findById(vehicle._id).populate('userId', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: { vehicle: updatedVehicle },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/vehicles/:id/mileage
 * Update mileage (recalculates next service)
 */
const updateMileage = async (req, res, next) => {
  try {
    const { currentMileage } = req.body;

    if (currentMileage === undefined || currentMileage === null) {
      throw new AppError('Current mileage is required', 400);
    }

    if (typeof currentMileage !== 'number' || currentMileage < 0) {
      throw new AppError('Mileage must be a non-negative number', 400);
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    if (vehicle.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this vehicle', 403);
    }

    if (currentMileage < vehicle.currentMileage) {
      throw new AppError(
        `New mileage (${currentMileage}) cannot be less than current mileage (${vehicle.currentMileage})`,
        400
      );
    }

    vehicle.currentMileage = currentMileage;
    await vehicle.save(); // triggers pre-save recalculation

    const complianceStatus = vehicle.getComplianceStatus();

    res.status(200).json({
      success: true,
      message: 'Mileage updated successfully',
      data: {
        vehicle,
        compliance: complianceStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/vehicles/:id
 * Soft delete (set isActive: false)
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    if (vehicle.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to delete this vehicle', 403);
    }

    vehicle.isActive = false;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/vehicles/:id/compliance
 * Get detailed compliance status
 */
const getComplianceStatus = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('userId', 'name email phone');

    if (!vehicle) {
      throw new AppError('Vehicle not found', 404);
    }

    const fleetUserIds = await getFleetUserIds(req.user);
    const hasAccess = fleetUserIds.some((id) => id.toString() === vehicle.userId._id.toString());

    if (!hasAccess) {
      throw new AppError('Not authorized to access this vehicle', 403);
    }

    const compliance = vehicle.getComplianceStatus();

    // Determine overall status
    const statuses = [compliance.insurance.status, compliance.puc.status, compliance.service.status];
    let overallStatus = 'ok';
    if (statuses.includes('expired')) overallStatus = 'expired';
    else if (statuses.includes('warning')) overallStatus = 'warning';

    res.status(200).json({
      success: true,
      data: {
        vehicle: {
          _id: vehicle._id,
          make: vehicle.make,
          model: vehicle.model,
          registrationNumber: vehicle.registrationNumber,
        },
        compliance,
        overallStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  updateMileage,
  deleteVehicle,
  getComplianceStatus,
};
