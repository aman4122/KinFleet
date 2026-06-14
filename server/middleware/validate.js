const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator validation results
 * If there are validation errors, returns 400 with an array of error messages
 * Otherwise, passes to the next middleware
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors,
    });
  }

  next();
};

module.exports = { validateRequest };
