const mongoose = require('mongoose');
const { PAYMENT_MODES } = require('../utils/constants');

const tollExpenseSchema = new mongoose.Schema(
  {
    tollName: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Toll amount is required'],
      min: [0, 'Toll amount cannot be negative'],
    },
    paymentMode: {
      type: String,
      enum: {
        values: PAYMENT_MODES,
        message: `Payment mode must be one of: ${PAYMENT_MODES.join(', ')}`,
      },
      default: 'FASTag',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const locationSchema = new mongoose.Schema(
  {
    placeId: {
      type: String,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
      index: true,
    },
    startLocation: {
      type: locationSchema,
      required: [true, 'Start location is required'],
    },
    endLocation: {
      type: locationSchema,
      required: [true, 'End location is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    distanceKm: {
      type: Number,
      min: [0, 'Distance cannot be negative'],
    },
    isInterState: {
      type: Boolean,
      default: false,
    },
    tollExpenses: [tollExpenseSchema],
    totalTollCost: {
      type: Number,
      default: 0,
      min: [0, 'Total toll cost cannot be negative'],
    },
    fuelExpense: {
      type: Number,
      default: 0,
      min: [0, 'Fuel expense cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
tripSchema.index({ userId: 1, startDate: -1 });
tripSchema.index({ vehicleId: 1, startDate: -1 });
tripSchema.index({ userId: 1, vehicleId: 1, startDate: -1 });

// Virtual: total expense (tolls + fuel)
tripSchema.virtual('totalExpense').get(function () {
  return (this.totalTollCost || 0) + (this.fuelExpense || 0);
});

// Pre-save hook: auto-set isInterState and calculate totalTollCost
tripSchema.pre('save', function (next) {
  // Auto-detect inter-state trip
  if (
    this.startLocation &&
    this.endLocation &&
    this.startLocation.state &&
    this.endLocation.state
  ) {
    this.isInterState =
      this.startLocation.state.toLowerCase() !== this.endLocation.state.toLowerCase();
  }

  // Auto-calculate total toll cost from toll expenses
  if (this.tollExpenses && this.tollExpenses.length > 0) {
    this.totalTollCost = this.tollExpenses.reduce((sum, toll) => sum + (toll.amount || 0), 0);
  } else {
    this.totalTollCost = 0;
  }

  next();
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
