const mongoose = require('mongoose');
const { FUEL_TYPES } = require('../utils/constants');
const { VIN_REGEX, INDIAN_RTO_REGEX } = require('../utils/validators');

const vehicleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    vin: {
      type: String,
      required: [true, 'VIN is required'],
      unique: true,
      uppercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return VIN_REGEX.test(v);
        },
        message: 'Invalid VIN format. Must be 17 alphanumeric characters (I, O, Q excluded)',
      },
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return INDIAN_RTO_REGEX.test(v);
        },
        message: 'Invalid Indian RTO registration number format',
      },
    },
    make: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Manufacturing year is required'],
      min: [1990, 'Year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, `Year cannot exceed ${new Date().getFullYear() + 1}`],
    },
    fuelType: {
      type: String,
      required: [true, 'Fuel type is required'],
      enum: {
        values: FUEL_TYPES,
        message: `Fuel type must be one of: ${FUEL_TYPES.join(', ')}`,
      },
    },
    color: {
      type: String,
      trim: true,
    },
    registrationDate: {
      type: Date,
      required: [true, 'Registration date is required'],
    },
    insuranceExpiry: {
      type: Date,
      required: [true, 'Insurance expiry date is required'],
    },
    pucExpiry: {
      type: Date,
      required: [true, 'PUC expiry date is required'],
    },
    lastServiceDate: {
      type: Date,
      default: null,
    },
    lastServiceMileage: {
      type: Number,
      default: 0,
      min: [0, 'Mileage cannot be negative'],
    },
    currentMileage: {
      type: Number,
      default: 0,
      min: [0, 'Mileage cannot be negative'],
    },
    serviceIntervalKm: {
      type: Number,
      default: 10000,
      min: [500, 'Service interval must be at least 500 km'],
    },
    serviceIntervalDays: {
      type: Number,
      default: 180,
      min: [30, 'Service interval must be at least 30 days'],
    },
    nextServiceDate: {
      type: Date,
    },
    nextServiceMileage: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
vehicleSchema.index({ userId: 1, isActive: 1 });
vehicleSchema.index({ insuranceExpiry: 1 });
vehicleSchema.index({ pucExpiry: 1 });
vehicleSchema.index({ nextServiceDate: 1 });

// Pre-save hook: auto-calculate nextServiceDate and nextServiceMileage
vehicleSchema.pre('save', function (next) {
  // Calculate next service mileage
  if (this.isModified('lastServiceMileage') || this.isModified('serviceIntervalKm') || this.isNew) {
    this.nextServiceMileage = this.lastServiceMileage + this.serviceIntervalKm;
  }

  // Calculate next service date
  if (this.isModified('lastServiceDate') || this.isModified('serviceIntervalDays') || this.isNew) {
    if (this.lastServiceDate) {
      const nextDate = new Date(this.lastServiceDate);
      nextDate.setDate(nextDate.getDate() + this.serviceIntervalDays);
      this.nextServiceDate = nextDate;
    } else {
      // If no last service date, use registration date as baseline
      const nextDate = new Date(this.registrationDate);
      nextDate.setDate(nextDate.getDate() + this.serviceIntervalDays);
      this.nextServiceDate = nextDate;
    }
  }

  next();
});

/**
 * Get compliance status for insurance, PUC, and service
 * @returns {{ insurance: object, puc: object, service: object }}
 */
vehicleSchema.methods.getComplianceStatus = function () {
  const now = new Date();
  const warningThresholdDays = 7;
  const warningThresholdMs = warningThresholdDays * 24 * 60 * 60 * 1000;

  const getStatus = (expiryDate, label) => {
    if (!expiryDate) {
      return { status: 'unknown', label, message: `${label} date not set`, daysRemaining: null };
    }

    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

    if (diffMs < 0) {
      return { status: 'expired', label, message: `${label} expired ${Math.abs(daysRemaining)} days ago`, daysRemaining };
    }

    if (diffMs < warningThresholdMs) {
      return { status: 'warning', label, message: `${label} expires in ${daysRemaining} days`, daysRemaining };
    }

    return { status: 'ok', label, message: `${label} valid for ${daysRemaining} days`, daysRemaining };
  };

  const insurance = getStatus(this.insuranceExpiry, 'Insurance');
  const puc = getStatus(this.pucExpiry, 'PUC');

  // Service status: check both date-based and mileage-based
  const serviceByDate = getStatus(this.nextServiceDate, 'Service');

  let serviceByMileage = { status: 'ok', label: 'Service (Mileage)', message: 'Service mileage OK', kmRemaining: null };
  if (this.nextServiceMileage && this.currentMileage) {
    const kmRemaining = this.nextServiceMileage - this.currentMileage;
    if (kmRemaining <= 0) {
      serviceByMileage = { status: 'expired', label: 'Service (Mileage)', message: `Service overdue by ${Math.abs(kmRemaining)} km`, kmRemaining };
    } else if (kmRemaining <= 500) {
      serviceByMileage = { status: 'warning', label: 'Service (Mileage)', message: `Service due in ${kmRemaining} km`, kmRemaining };
    } else {
      serviceByMileage = { status: 'ok', label: 'Service (Mileage)', message: `Next service in ${kmRemaining} km`, kmRemaining };
    }
  }

  // Overall service status is the worst of date-based and mileage-based
  const statusPriority = { expired: 3, warning: 2, ok: 1, unknown: 0 };
  const overallServiceStatus =
    statusPriority[serviceByDate.status] >= statusPriority[serviceByMileage.status]
      ? serviceByDate
      : serviceByMileage;

  return {
    insurance,
    puc,
    service: {
      ...overallServiceStatus,
      byDate: serviceByDate,
      byMileage: serviceByMileage,
    },
  };
};

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
