/**
 * Send SOS alert to all contacts (Mocked - Twilio Removed)
 * @param {object} user - User document
 * @param {object|null} vehicle - Vehicle document (optional)
 * @param {{ lat: number, lng: number }} location - GPS coordinates
 * @param {Array} contacts - Array of Contact documents
 * @returns {Promise<{ sent: number, failed: number, results: Array }>}
 */
const sendSOSAlert = async (user, vehicle, location, contacts) => {
  let vehicleInfo = '';
  if (vehicle) {
    vehicleInfo = `\nVehicle: ${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})`;
  }

  const message =
    `🚨 *SOS EMERGENCY ALERT* 🚨\n\n` +
    `*${user.name}* needs immediate help!\n` +
    `📞 Phone: ${user.phone}\n` +
    `${vehicleInfo}\n` +
    `📍 Location Coordinates: ${location.lat}, ${location.lng}\n\n` +
    `⏰ Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\n` +
    `Please respond immediately or call emergency services (112).`;

  let sent = 0;
  const results = [];

  for (const contact of contacts) {
    console.log(`[MOCK ALERT] Sending SOS to ${contact.name} (${contact.phone}):\n${message}`);
    sent++;
    results.push({ contact: contact.name, status: 'sent', sid: 'mock_sid' });
  }

  console.log(`🚨 SOS Alert broadcast: ${sent} sent, 0 failed out of ${contacts.length} contacts`);
  return { sent, failed: 0, results };
};

/**
 * Send compliance alert to user (Mocked - Twilio Removed)
 * @param {object} user - User document
 * @param {object} vehicle - Vehicle document
 * @param {string} alertType - Type of alert (Insurance/PUC/Service)
 * @param {Date} dueDate - Expiry or due date
 * @returns {Promise<object|null>}
 */
const sendComplianceAlert = async (user, vehicle, alertType, dueDate) => {
  const { formatDate } = require('../utils/formatters');

  const formattedDate = formatDate(dueDate);
  const daysRemaining = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  let urgency = '📋';
  if (daysRemaining <= 0) urgency = '🔴';
  else if (daysRemaining <= 3) urgency = '🟠';
  else if (daysRemaining <= 7) urgency = '🟡';

  const message =
    `${urgency} *VahanTrack Compliance Alert*\n\n` +
    `Vehicle: *${vehicle.make} ${vehicle.model}*\n` +
    `Reg: ${vehicle.registrationNumber}\n\n` +
    `⚠️ *${alertType}* ${daysRemaining <= 0 ? 'has EXPIRED' : `expires on ${formattedDate}`}\n` +
    `${daysRemaining > 0 ? `📅 ${daysRemaining} day(s) remaining` : `❗ Overdue by ${Math.abs(daysRemaining)} day(s)`}\n\n` +
    `Please take immediate action to stay compliant.`;

  console.log(`[MOCK ALERT] Sending Compliance Alert to ${user.name} (${user.phone}):\n${message}`);
  return { sid: 'mock_sid' };
};

module.exports = {
  sendSOSAlert,
  sendComplianceAlert,
};
