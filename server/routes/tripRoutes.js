const express = require('express');
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { PAYMENT_MODES } = require('../utils/constants');
const {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripStats,
} = require('../controllers/tripController');

const router = express.Router();

// All trip routes require authentication
router.use(protect);

// GET /api/trips/stats/summary — MUST be before /:id to avoid route conflict
router.get('/stats/summary', getTripStats);

// GET /api/trips
router.get(
  '/',
  [
    query('vehicleId').optional().isMongoId().withMessage('Invalid vehicle ID'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    validateRequest,
  ],
  getTrips
);

// GET /api/trips/:id
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid trip ID'),
    validateRequest,
  ],
  getTrip
);

// POST /api/trips
router.post(
  '/',
  [
    body('vehicleId')
      .notEmpty().withMessage('Vehicle ID is required')
      .isMongoId().withMessage('Invalid vehicle ID'),
    body('startLocation.address')
      .trim()
      .notEmpty().withMessage('Start location address is required'),
    body('endLocation.address')
      .trim()
      .notEmpty().withMessage('End location address is required'),
    body('startDate')
      .notEmpty().withMessage('Start date is required')
      .isISO8601().withMessage('Start date must be a valid date'),
    body('endDate')
      .optional()
      .isISO8601().withMessage('End date must be a valid date'),
    body('distanceKm')
      .optional()
      .isFloat({ min: 0 }).withMessage('Distance must be non-negative'),
    body('tollExpenses').optional().isArray().withMessage('Toll expenses must be an array'),
    body('tollExpenses.*.amount')
      .optional()
      .isFloat({ min: 0 }).withMessage('Toll amount must be non-negative'),
    body('tollExpenses.*.paymentMode')
      .optional()
      .isIn(PAYMENT_MODES).withMessage(`Payment mode must be one of: ${PAYMENT_MODES.join(', ')}`),
    body('fuelExpense')
      .optional()
      .isFloat({ min: 0 }).withMessage('Fuel expense must be non-negative'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
    validateRequest,
  ],
  createTrip
);

// PUT /api/trips/:id
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid trip ID'),
    body('startLocation.address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
    body('endLocation.address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
    body('startDate').optional().isISO8601().withMessage('Invalid date'),
    body('endDate').optional().isISO8601().withMessage('Invalid date'),
    body('distanceKm').optional().isFloat({ min: 0 }).withMessage('Distance must be non-negative'),
    body('fuelExpense').optional().isFloat({ min: 0 }).withMessage('Fuel expense must be non-negative'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes too long'),
    validateRequest,
  ],
  updateTrip
);

// DELETE /api/trips/:id
router.delete(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid trip ID'),
    validateRequest,
  ],
  deleteTrip
);

module.exports = router;
