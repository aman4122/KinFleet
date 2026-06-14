/**
 * Formatting utilities for Indian locale
 */

/**
 * Format an amount in paise/rupees to Indian currency notation
 * Amounts >= 1,00,00,000 shown as Crores, >= 1,00,000 shown as Lakhs
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted currency string
 */
const formatIndianCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  const num = Number(amount);

  if (num >= 10000000) {
    // Crores: >= 1,00,00,000
    const crores = num / 10000000;
    return `₹${crores.toFixed(2)} Crores`;
  }

  if (num >= 100000) {
    // Lakhs: >= 1,00,000
    const lakhs = num / 100000;
    return `₹${lakhs.toFixed(2)} Lakhs`;
  }

  // Standard Indian number formatting
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format a date to DD/MM/YYYY in IST timezone
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string DD/MM/YYYY
 */
const formatDate = (date) => {
  if (!date) return '';

  const d = new Date(date);

  if (isNaN(d.getTime())) return '';

  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  };

  // toLocaleDateString returns MM/DD/YYYY for en-US, so use en-GB for DD/MM/YYYY
  return d.toLocaleDateString('en-GB', options);
};

/**
 * Format a phone number for WhatsApp via Twilio
 * Ensures the output is in whatsapp:+91XXXXXXXXXX format
 * @param {string} phone - Phone number (various formats accepted)
 * @returns {string} WhatsApp-formatted phone number
 */
const formatPhoneForWhatsApp = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all whitespace and dashes
  let cleaned = phone.replace(/[\s-]/g, '');

  // Remove existing whatsapp: prefix if present
  cleaned = cleaned.replace(/^whatsapp:/i, '');

  // If starts with 0, replace with +91
  if (cleaned.startsWith('0')) {
    cleaned = '+91' + cleaned.substring(1);
  }

  // If starts with 91 but not +91, add +
  if (cleaned.startsWith('91') && !cleaned.startsWith('+91')) {
    cleaned = '+' + cleaned;
  }

  // If no country code, add +91
  if (!cleaned.startsWith('+')) {
    cleaned = '+91' + cleaned;
  }

  return `whatsapp:${cleaned}`;
};

/**
 * Format a date to a readable datetime string in IST
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted datetime string
 */
const formatDateTime = (date) => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

module.exports = {
  formatIndianCurrency,
  formatDate,
  formatPhoneForWhatsApp,
  formatDateTime,
};
