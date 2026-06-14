const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const config = require('../config/env');
const { AppError } = require('../middleware/errorHandler');

/**
 * Generate access token and set it as an HttpOnly cookie
 * @param {object} res - Express response object
 * @param {string} userId - MongoDB user ID
 * @returns {{ accessToken: string }}
 */
const generateTokens = (res, userId) => {
  const accessToken = jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRY,
  });

  // Set access token cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: config.COOKIE_SAME_SITE,
    domain: config.COOKIE_DOMAIN,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  return { accessToken };
};

/**
 * POST /api/auth/register
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'phone';
      throw new AppError(`User with this ${field} already exists`, 409);
    }

    // Create user (password hashed in pre-save hook, familyFleetId generated)
    const user = await User.create({
      name,
      email,
      phone,
      password,
      familyRole: 'owner',
    });

    // Generate tokens and set cookies
    generateTokens(res, user._id);

    // Return user without password
    const userResponse = user.toSafeObject();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: userResponse },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and issue tokens
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens and set cookies
    generateTokens(res, user._id);

    const userResponse = user.toSafeObject();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: userResponse },
    });
  } catch (error) {
    next(error);
  }
};


/**
 * GET /api/auth/me
 * Get current authenticated user
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { user: user.toSafeObject() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Clear authentication cookies
 */
const logout = async (req, res, next) => {
  try {
    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: config.COOKIE_SAME_SITE,
      domain: config.COOKIE_DOMAIN,
      expires: new Date(0),
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/profile
 * Update current user's profile (name, phone, email)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const userId = req.user._id;

    // Check for duplicate email/phone if changed
    if (email && email.toLowerCase() !== req.user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
      if (existingEmail) {
        throw new AppError('Email is already in use by another account', 409);
      }
    }

    if (phone && phone !== req.user.phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
      if (existingPhone) {
        throw new AppError('Phone number is already in use by another account', 409);
      }
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (email) updateFields.email = email.toLowerCase();

    const user = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: user.toSafeObject() },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateProfile,
};
