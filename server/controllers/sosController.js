const { handleSOSTrigger } = require('../services/sosService');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/sos/trigger
 * Trigger an SOS emergency alert
 * Receives location and optional vehicleId, broadcasts to all SOS contacts
 */
const triggerSOS = async (req, res, next) => {
  try {
    const { lat, lng, vehicleId } = req.body;

    if (lat === undefined || lng === undefined) {
      throw new AppError('Location coordinates (lat, lng) are required', 400);
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new AppError('Latitude and longitude must be numbers', 400);
    }

    if (lat < -90 || lat > 90) {
      throw new AppError('Latitude must be between -90 and 90', 400);
    }

    if (lng < -180 || lng > 180) {
      throw new AppError('Longitude must be between -180 and 180', 400);
    }

    const result = await handleSOSTrigger(req.user._id, lat, lng, vehicleId || null);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerSOS,
};
