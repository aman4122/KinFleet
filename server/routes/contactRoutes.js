const express = require('express');
const { body, param } = require('express-validator');
const { validateRequest } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { RELATIONSHIP_TYPES } = require('../utils/constants');
const {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} = require('../controllers/contactController');

const router = express.Router();

// All contact routes require authentication
router.use(protect);

// GET /api/contacts
router.get('/', getContacts);

// POST /api/contacts
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Contact name is required')
      .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone is required')
      .matches(/^\+91[6-9]\d{9}$/).withMessage('Phone must be in +91XXXXXXXXXX format'),
    body('relationship')
      .optional()
      .isIn(RELATIONSHIP_TYPES).withMessage(`Relationship must be one of: ${RELATIONSHIP_TYPES.join(', ')}`),
    body('isSosContact').optional().isBoolean().withMessage('isSosContact must be boolean'),
    body('whatsappEnabled').optional().isBoolean().withMessage('whatsappEnabled must be boolean'),
    validateRequest,
  ],
  createContact
);

// PUT /api/contacts/:id
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid contact ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }),
    body('phone').optional().trim().matches(/^\+91[6-9]\d{9}$/).withMessage('Invalid phone format'),
    body('relationship').optional().isIn(RELATIONSHIP_TYPES).withMessage('Invalid relationship type'),
    body('isSosContact').optional().isBoolean(),
    body('whatsappEnabled').optional().isBoolean(),
    validateRequest,
  ],
  updateContact
);

// DELETE /api/contacts/:id
router.delete(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid contact ID'),
    validateRequest,
  ],
  deleteContact
);

module.exports = router;
