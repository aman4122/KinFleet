const Vehicle = require('../models/Vehicle');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { sendSOSAlert } = require('./notificationService');

/**
 * Build an SOS message string
 * @param {object} user - User document
 * @param {object|null} vehicle - Vehicle document (optional)
 * @param {string} locationText - Location coordinates text
 * @returns {string} Formatted SOS message
 */
const buildSOSMessage = (user, vehicle, locationText) => {
  let vehicleInfo = 'Vehicle details not available';
  if (vehicle) {
    vehicleInfo = `${vehicle.make} ${vehicle.model} ${vehicle.year}\nReg: ${vehicle.registrationNumber}\nColor: ${vehicle.color || 'N/A'}`;
  }

  return (
    `🚨🚨🚨 *EMERGENCY SOS* 🚨🚨🚨\n\n` +
    `*${user.name}* has triggered an emergency alert!\n\n` +
    `👤 *Contact Information*\n` +
    `Name: ${user.name}\n` +
    `Phone: ${user.phone}\n` +
    `Email: ${user.email}\n\n` +
    `🚗 *Vehicle Information*\n` +
    `${vehicleInfo}\n\n` +
    `📍 *Location*\n` +
    `${locationText}\n\n` +
    `⏰ *Time*: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `⚡ Please respond immediately!\n` +
    `📞 Emergency Services: 112\n` +
    `🚑 Ambulance: 108\n` +
    `━━━━━━━━━━━━━━━━━━`
  );
};

/**
 * Handle the full SOS trigger flow
 * @param {string} userId - User's MongoDB ObjectId
 * @param {number} lat - Latitude of the emergency
 * @param {number} lng - Longitude of the emergency
 * @param {string|null} vehicleId - Optional vehicle ObjectId
 * @returns {Promise<object>} Result with sent/failed counts
 */
const handleSOSTrigger = async (userId, lat, lng, vehicleId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  let vehicle = null;
  if (vehicleId) {
    vehicle = await Vehicle.findOne({ _id: vehicleId, userId, isActive: true });
  }

  const contacts = await Contact.find({
    userId,
    isSosContact: true,
  });

  if (contacts.length === 0) {
    return {
      success: true,
      message: 'No SOS contacts configured. Please add emergency contacts.',
      sent: 0,
      failed: 0,
      totalContacts: 0,
    };
  }

  const locationText = `Coordinates: ${lat}, ${lng}`;

  const sosMessage = buildSOSMessage(user, vehicle, locationText);
  console.log('🚨 SOS Triggered by:', user.name, 'at', locationText);

  const result = await sendSOSAlert(user, vehicle, { lat, lng }, contacts);

  return {
    success: true,
    message: `SOS alert broadcast to ${contacts.length} contact(s)`,
    sent: result.sent,
    failed: result.failed,
    totalContacts: contacts.length,
    location: { lat, lng },
    results: result.results,
  };
};

module.exports = {
  handleSOSTrigger,
  buildSOSMessage,
};
