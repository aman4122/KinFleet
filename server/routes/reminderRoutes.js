const express = require('express');
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { REMINDER_TYPES, REMINDER_STATUS } = require('../utils/constants');
const {
  getReminders,
  createReminder,
  updateReminder,
  completeReminder,
  deleteReminder,
} = require('../controllers/reminderController');

const router = express.Router();

// All reminder routes require authentication
router.use(protect);

// GET /api/reminders
router.get(
  '/',
  [
    query('status').optional().isIn(REMINDER_STATUS).withMessage(`Status must be one of: ${REMINDER_STATUS.join(', ')}`),
    query('type').optional().isIn(REMINDER_TYPES).withMessage(`Type must be one of: ${REMINDER_TYPES.join(', ')}`),
    query('vehicleId').optional().isMongoId().withMessage('Invalid vehicle ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    validateRequest,
  ],
  getReminders
);

// POST /api/reminders
router.post(
  '/',
  [
    body('type')
      .notEmpty().withMessage('Reminder type is required')
      .isIn(REMINDER_TYPES).withMessage(`Type must be one of: ${REMINDER_TYPES.join(', ')}`),
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('dueDate')
      .notEmpty().withMessage('Due date is required')
      .isISO8601().withMessage('Due date must be a valid date'),
    body('vehicleId').optional().isMongoId().withMessage('Invalid vehicle ID'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
    body('isRecurring').optional().isBoolean().withMessage('isRecurring must be boolean'),
    body('recurringDays').optional().isInt({ min: 1 }).withMessage('Recurring days must be at least 1'),
    validateRequest,
  ],
  createReminder
);

// PUT /api/reminders/:id
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid reminder ID'),
    body('type').optional().isIn(REMINDER_TYPES).withMessage('Invalid type'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }),
    body('dueDate').optional().isISO8601().withMessage('Invalid date'),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('status').optional().isIn(REMINDER_STATUS).withMessage('Invalid status'),
    body('isRecurring').optional().isBoolean(),
    body('recurringDays').optional().isInt({ min: 1 }),
    validateRequest,
  ],
  updateReminder
);

// PUT /api/reminders/:id/complete
router.put(
  '/:id/complete',
  [
    param('id').isMongoId().withMessage('Invalid reminder ID'),
    validateRequest,
  ],
  completeReminder
);

// DELETE /api/reminders/:id
router.delete(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid reminder ID'),
    validateRequest,
  ],
  deleteReminder
);

module.exports = router;
