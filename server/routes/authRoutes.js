const express = require('express');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
} = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone is required')
      .matches(/^\+91[6-9]\d{9}$/).withMessage('Phone must be in +91XXXXXXXXXX format'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validateRequest,
  ],
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  login
);


// GET /api/auth/me
router.get('/me', protect, getMe);

// POST /api/auth/logout
router.post('/logout', protect, logout);

// PUT /api/auth/profile
router.put(
  '/profile',
  protect,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('phone')
      .optional()
      .trim()
      .matches(/^\+91[6-9]\d{9}$/).withMessage('Phone must be in +91XXXXXXXXXX format'),
    validateRequest,
  ],
  updateProfile
);

module.exports = router;
