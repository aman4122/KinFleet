const Reminder = require('../models/Reminder');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/reminders
 * Get reminders with optional filters: status, type, vehicleId
 */
const getReminders = async (req, res, next) => {
  try {
    const { status, type, vehicleId, page = 1, limit = 20 } = req.query;

    const filter = { userId: req.user._id };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (vehicleId) filter.vehicleId = vehicleId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = parseInt(limit, 10);

    const [reminders, total] = await Promise.all([
      Reminder.find(filter)
        .populate('vehicleId', 'make model registrationNumber')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limitNum),
      Reminder.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        reminders,
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
 * POST /api/reminders
 * Create a new reminder
 */
const createReminder = async (req, res, next) => {
  try {
    const { vehicleId, type, title, description, dueDate, isRecurring, recurringDays } = req.body;

    const reminder = await Reminder.create({
      userId: req.user._id,
      vehicleId: vehicleId || null,
      type,
      title,
      description,
      dueDate,
      isRecurring: isRecurring || false,
      recurringDays: recurringDays || null,
    });

    const populatedReminder = await Reminder.findById(reminder._id)
      .populate('vehicleId', 'make model registrationNumber');

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: { reminder: populatedReminder },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/reminders/:id
 * Update a reminder
 */
const updateReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }

    if (reminder.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this reminder', 403);
    }

    const allowedUpdates = [
      'type', 'title', 'description', 'dueDate',
      'isRecurring', 'recurringDays', 'status',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        reminder[field] = req.body[field];
      }
    });

    await reminder.save();

    const updatedReminder = await Reminder.findById(reminder._id)
      .populate('vehicleId', 'make model registrationNumber');

    res.status(200).json({
      success: true,
      message: 'Reminder updated successfully',
      data: { reminder: updatedReminder },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/reminders/:id/complete
 * Mark a reminder as completed. If recurring, create the next occurrence.
 */
const completeReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }

    if (reminder.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this reminder', 403);
    }

    if (reminder.status === 'Completed') {
      throw new AppError('Reminder is already completed', 400);
    }

    reminder.status = 'Completed';
    reminder.completedAt = new Date();
    await reminder.save();

    let nextReminder = null;

    // If recurring, create the next occurrence
    if (reminder.isRecurring && reminder.recurringDays) {
      const nextDueDate = new Date(reminder.dueDate);
      nextDueDate.setDate(nextDueDate.getDate() + reminder.recurringDays);

      nextReminder = await Reminder.create({
        userId: reminder.userId,
        vehicleId: reminder.vehicleId,
        type: reminder.type,
        title: reminder.title,
        description: reminder.description,
        dueDate: nextDueDate,
        isRecurring: true,
        recurringDays: reminder.recurringDays,
        status: 'Pending',
      });
    }

    const completedReminder = await Reminder.findById(reminder._id)
      .populate('vehicleId', 'make model registrationNumber');

    res.status(200).json({
      success: true,
      message: 'Reminder marked as completed',
      data: {
        reminder: completedReminder,
        ...(nextReminder && { nextReminder }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/reminders/:id
 * Delete a reminder
 */
const deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      throw new AppError('Reminder not found', 404);
    }

    if (reminder.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to delete this reminder', 403);
    }

    await Reminder.findByIdAndDelete(reminder._id);

    res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  completeReminder,
  deleteReminder,
};
