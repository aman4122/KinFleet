const express = require('express');
const { body, param } = require('express-validator');
const { validateRequest } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { FUEL_TYPES } = require('../utils/constants');
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  updateMileage,
  deleteVehicle,
  getComplianceStatus,
} = require('../controllers/vehicleController');

const router = express.Router();

// All vehicle routes require authentication
router.use(protect);

// GET /api/vehicles
router.get('/', getVehicles);

// GET /api/vehicles/:id
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid vehicle ID'),
    validateRequest,
  ],
  getVehicle
);

// POST /api/vehicles
router.post(
  '/',
  [
    body('vin')
      .trim()
      .notEmpty().withMessage('VIN is required')
      .isLength({ min: 17, max: 17 }).withMessage('VIN must be exactly 17 characters')
      .matches(/^[A-HJ-NPR-Z0-9]{17}$/i).withMessage('Invalid VIN format'),
    body('registrationNumber')
      .trim()
      .notEmpty().withMessage('Registration number is required'),
    body('make')
      .trim()
      .notEmpty().withMessage('Vehicle make is required'),
    body('model')
      .trim()
      .notEmpty().withMessage('Vehicle model is required'),
    body('year')
      .notEmpty().withMessage('Year is required')
      .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
      .withMessage(`Year must be between 1990 and ${new Date().getFullYear() + 1}`),
    body('fuelType')
      .notEmpty().withMessage('Fuel type is required')
      .isIn(FUEL_TYPES).withMessage(`Fuel type must be one of: ${FUEL_TYPES.join(', ')}`),
    body('registrationDate')
      .notEmpty().withMessage('Registration date is required')
      .isISO8601().withMessage('Registration date must be a valid date'),
    body('insuranceExpiry')
      .notEmpty().withMessage('Insurance expiry date is required')
      .isISO8601().withMessage('Insurance expiry must be a valid date'),
    body('pucExpiry')
      .notEmpty().withMessage('PUC expiry date is required')
      .isISO8601().withMessage('PUC expiry must be a valid date'),
    body('color').optional().trim(),
    body('lastServiceDate').optional().isISO8601().withMessage('Last service date must be a valid date'),
    body('lastServiceMileage').optional().isInt({ min: 0 }).withMessage('Last service mileage must be non-negative'),
    body('currentMileage').optional().isInt({ min: 0 }).withMessage('Current mileage must be non-negative'),
    body('serviceIntervalKm').optional().isInt({ min: 500 }).withMessage('Service interval must be at least 500 km'),
    body('serviceIntervalDays').optional().isInt({ min: 30 }).withMessage('Service interval must be at least 30 days'),
    validateRequest,
  ],
  createVehicle
);

// PUT /api/vehicles/:id
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid vehicle ID'),
    body('make').optional().trim().notEmpty().withMessage('Make cannot be empty'),
    body('model').optional().trim().notEmpty().withMessage('Model cannot be empty'),
    body('year').optional().isInt({ min: 1990, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
    body('fuelType').optional().isIn(FUEL_TYPES).withMessage(`Invalid fuel type`),
    body('registrationDate').optional().isISO8601().withMessage('Invalid registration date'),
    body('insuranceExpiry').optional().isISO8601().withMessage('Invalid insurance expiry date'),
    body('pucExpiry').optional().isISO8601().withMessage('Invalid PUC expiry date'),
    body('lastServiceDate').optional().isISO8601().withMessage('Invalid last service date'),
    body('lastServiceMileage').optional().isInt({ min: 0 }).withMessage('Invalid mileage'),
    body('currentMileage').optional().isInt({ min: 0 }).withMessage('Invalid mileage'),
    body('serviceIntervalKm').optional().isInt({ min: 500 }).withMessage('Min 500 km'),
    body('serviceIntervalDays').optional().isInt({ min: 30 }).withMessage('Min 30 days'),
    validateRequest,
  ],
  updateVehicle
);

// PUT /api/vehicles/:id/mileage
router.put(
  '/:id/mileage',
  [
    param('id').isMongoId().withMessage('Invalid vehicle ID'),
    body('currentMileage')
      .notEmpty().withMessage('Current mileage is required')
      .isInt({ min: 0 }).withMessage('Mileage must be non-negative'),
    validateRequest,
  ],
  updateMileage
);

// DELETE /api/vehicles/:id
router.delete(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid vehicle ID'),
    validateRequest,
  ],
  deleteVehicle
);

// GET /api/vehicles/:id/compliance
router.get(
  '/:id/compliance',
  [
    param('id').isMongoId().withMessage('Invalid vehicle ID'),
    validateRequest,
  ],
  getComplianceStatus
);

module.exports = router;
