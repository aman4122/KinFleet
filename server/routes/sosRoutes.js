const express = require('express');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { triggerSOS } = require('../controllers/sosController');

const router = express.Router();

// All SOS routes require authentication
router.use(protect);

// POST /api/sos/trigger
router.post(
  '/trigger',
  [
    body('lat')
      .notEmpty().withMessage('Latitude is required')
      .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('lng')
      .notEmpty().withMessage('Longitude is required')
      .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('vehicleId')
      .optional()
      .isMongoId().withMessage('Invalid vehicle ID'),
    validateRequest,
  ],
  triggerSOS
);

module.exports = router;
