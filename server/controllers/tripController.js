const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/trips
 * Get trips with optional filters: vehicleId, startDate, endDate
 */
const getTrips = async (req, res, next) => {
  try {
    const { vehicleId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = { userId: req.user._id };

    if (vehicleId) {
      filter.vehicleId = vehicleId;
    }

    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = parseInt(limit, 10);

    const [trips, total] = await Promise.all([
      Trip.find(filter)
        .populate('vehicleId', 'make model registrationNumber')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Trip.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        trips,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:id
 * Get a single trip
 */
const getTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicleId', 'make model registrationNumber fuelType')
      .populate('userId', 'name email');

    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    if (trip.userId._id.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to access this trip', 403);
    }

    res.status(200).json({
      success: true,
      data: { trip },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/trips
 * Create a new trip
 */
const createTrip = async (req, res, next) => {
  try {
    const {
      vehicleId,
      startLocation,
      endLocation,
      startDate,
      endDate,
      distanceKm,
      tollExpenses,
      fuelExpense,
      notes,
    } = req.body;

    // Verify vehicle ownership
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      userId: req.user._id,
      isActive: true,
    });

    if (!vehicle) {
      throw new AppError('Vehicle not found or you do not own this vehicle', 404);
    }

    const trip = await Trip.create({
      userId: req.user._id,
      vehicleId,
      startLocation,
      endLocation,
      startDate,
      endDate,
      distanceKm,
      tollExpenses,
      fuelExpense,
      notes,
    });

    // Update vehicle mileage if distance is provided
    if (distanceKm && distanceKm > 0) {
      vehicle.currentMileage = (vehicle.currentMileage || 0) + distanceKm;
      await vehicle.save();
    }

    const populatedTrip = await Trip.findById(trip._id)
      .populate('vehicleId', 'make model registrationNumber');

    res.status(201).json({
      success: true,
      message: 'Trip recorded successfully',
      data: { trip: populatedTrip },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/trips/:id
 * Update a trip
 */
const updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    if (trip.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this trip', 403);
    }

    const allowedUpdates = [
      'startLocation', 'endLocation', 'startDate', 'endDate',
      'distanceKm', 'tollExpenses', 'fuelExpense', 'notes',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        trip[field] = req.body[field];
      }
    });

    await trip.save(); // triggers pre-save hooks

    const updatedTrip = await Trip.findById(trip._id)
      .populate('vehicleId', 'make model registrationNumber');

    res.status(200).json({
      success: true,
      message: 'Trip updated successfully',
      data: { trip: updatedTrip },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/trips/:id
 * Delete a trip
 */
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    if (trip.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to delete this trip', 403);
    }

    await Trip.findByIdAndDelete(trip._id);

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/stats/summary
 * Aggregate trip statistics
 */
const getTripStats = async (req, res, next) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;

    const matchStage = { userId: req.user._id };

    if (vehicleId) {
      const mongoose = require('mongoose');
      matchStage.vehicleId = new mongoose.Types.ObjectId(vehicleId);
    }

    if (startDate || endDate) {
      matchStage.startDate = {};
      if (startDate) matchStage.startDate.$gte = new Date(startDate);
      if (endDate) matchStage.startDate.$lte = new Date(endDate);
    }

    const stats = await Trip.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTrips: { $sum: 1 },
          totalDistanceKm: { $sum: { $ifNull: ['$distanceKm', 0] } },
          totalTollCost: { $sum: { $ifNull: ['$totalTollCost', 0] } },
          totalFuelExpense: { $sum: { $ifNull: ['$fuelExpense', 0] } },
          avgDistanceKm: { $avg: { $ifNull: ['$distanceKm', 0] } },
          interStateTrips: {
            $sum: { $cond: ['$isInterState', 1, 0] },
          },
          longestTripKm: { $max: '$distanceKm' },
        },
      },
      {
        $project: {
          _id: 0,
          totalTrips: 1,
          totalDistanceKm: { $round: ['$totalDistanceKm', 2] },
          totalTollCost: { $round: ['$totalTollCost', 2] },
          totalFuelExpense: { $round: ['$totalFuelExpense', 2] },
          totalExpense: { $round: [{ $add: ['$totalTollCost', '$totalFuelExpense'] }, 2] },
          avgDistanceKm: { $round: ['$avgDistanceKm', 2] },
          interStateTrips: 1,
          longestTripKm: 1,
        },
      },
    ]);

    const summary = stats[0] || {
      totalTrips: 0,
      totalDistanceKm: 0,
      totalTollCost: 0,
      totalFuelExpense: 0,
      totalExpense: 0,
      avgDistanceKm: 0,
      interStateTrips: 0,
      longestTripKm: 0,
    };

    res.status(200).json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripStats,
};
