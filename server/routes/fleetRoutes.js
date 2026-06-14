const express = require('express');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const {
  getFleetInfo,
  joinFleet,
  leaveFleet,
  getFleetVehicles,
} = require('../controllers/fleetController');

const router = express.Router();

// All fleet routes require authentication
router.use(protect);

// GET /api/fleet — get fleet info and members
router.get('/', getFleetInfo);

// POST /api/fleet/join — join a fleet with fleetId code
router.post(
  '/join',
  [
    body('fleetId')
      .trim()
      .notEmpty().withMessage('Fleet ID is required')
      .isUUID().withMessage('Fleet ID must be a valid UUID'),
    validateRequest,
  ],
  joinFleet
);

// POST /api/fleet/leave — leave fleet
router.post('/leave', leaveFleet);

// GET /api/fleet/vehicles — get all vehicles across fleet members
router.get('/vehicles', getFleetVehicles);

module.exports = router;
