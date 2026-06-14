/**
 * Validation utilities for Indian vehicle and user data
 */

// VIN: 17 alphanumeric characters excluding I, O, Q
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

// Indian RTO registration: MH 12 AB 1234 or BH series (Bharat series)
const INDIAN_RTO_REGEX = /^([A-Z]{2}[\s-]?[0-9]{1,2}[\s-]?[A-Z]{1,3}[\s-]?[0-9]{4}|\d{2}[\s-]?BH[\s-]?\d{4}[\s-]?[A-Z]{2})$/;

// Indian phone: +91 followed by 6-9 and 9 more digits
const INDIAN_PHONE_REGEX = /^\+91[6-9]\d{9}$/;

// Standard email validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate a Vehicle Identification Number (VIN)
 * @param {string} vin - VIN to validate
 * @returns {{ valid: boolean, message: string }}
 */
const validateVIN = (vin) => {
  if (!vin || typeof vin !== 'string') {
    return { valid: false, message: 'VIN is required and must be a string' };
  }

  const cleanVIN = vin.trim().toUpperCase();

  if (cleanVIN.length !== 17) {
    return { valid: false, message: 'VIN must be exactly 17 characters long' };
  }

  if (!VIN_REGEX.test(cleanVIN)) {
    return { valid: false, message: 'VIN contains invalid characters. Letters I, O, Q are not allowed' };
  }

  return { valid: true, message: 'Valid VIN' };
};

/**
 * Validate an Indian RTO registration number
 * @param {string} registration - Registration number to validate
 * @returns {{ valid: boolean, message: string }}
 */
const validateRegistration = (registration) => {
  if (!registration || typeof registration !== 'string') {
    return { valid: false, message: 'Registration number is required and must be a string' };
  }

  const cleanReg = registration.trim().toUpperCase();

  if (!INDIAN_RTO_REGEX.test(cleanReg)) {
    return { valid: false, message: 'Invalid Indian RTO registration number format. Expected format: XX 00 XXX 0000 or 00 BH 0000 XX' };
  }

  return { valid: true, message: 'Valid registration number' };
};

/**
 * Validate an Indian phone number
 * @param {string} phone - Phone number to validate (+91XXXXXXXXXX)
 * @returns {{ valid: boolean, message: string }}
 */
const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: 'Phone number is required and must be a string' };
  }

  const cleanPhone = phone.trim();

  if (!INDIAN_PHONE_REGEX.test(cleanPhone)) {
    return { valid: false, message: 'Invalid Indian phone number. Expected format: +91XXXXXXXXXX (starting with 6-9)' };
  }

  return { valid: true, message: 'Valid phone number' };
};

/**
 * Validate an email address
 * @param {string} email - Email address to validate
 * @returns {{ valid: boolean, message: string }}
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required and must be a string' };
  }

  const cleanEmail = email.trim().toLowerCase();

  if (cleanEmail.length > 254) {
    return { valid: false, message: 'Email address is too long' };
  }

  if (!EMAIL_REGEX.test(cleanEmail)) {
    return { valid: false, message: 'Invalid email address format' };
  }

  return { valid: true, message: 'Valid email address' };
};

module.exports = {
  VIN_REGEX,
  INDIAN_RTO_REGEX,
  INDIAN_PHONE_REGEX,
  EMAIL_REGEX,
  validateVIN,
  validateRegistration,
  validatePhone,
  validateEmail,
};
