const mongoose = require('mongoose');
const { REMINDER_TYPES, REMINDER_STATUS } = require('../utils/constants');

const reminderSchema = new mongoose.Schema(
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
      default: null,
    },
    type: {
      type: String,
      required: [true, 'Reminder type is required'],
      enum: {
        values: REMINDER_TYPES,
        message: `Type must be one of: ${REMINDER_TYPES.join(', ')}`,
      },
    },
    title: {
      type: String,
      required: [true, 'Reminder title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringDays: {
      type: Number,
      min: [1, 'Recurring interval must be at least 1 day'],
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: REMINDER_STATUS,
        message: `Status must be one of: ${REMINDER_STATUS.join(', ')}`,
      },
      default: 'Pending',
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for scheduler queries
reminderSchema.index({ status: 1, dueDate: 1 });
reminderSchema.index({ userId: 1, status: 1 });
reminderSchema.index({ vehicleId: 1, type: 1 });

// Virtual: check if reminder is overdue
reminderSchema.virtual('isOverdue').get(function () {
  if (this.status === 'Completed') return false;
  return new Date() > this.dueDate;
});

// Virtual: days until due
reminderSchema.virtual('daysUntilDue').get(function () {
  const now = new Date();
  const diffMs = this.dueDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
});

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;
