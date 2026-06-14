import api from './api';

const sosService = {
  triggerSOS: (lat, lng, vehicleId) =>
    api.post('/sos/trigger', { latitude: lat, longitude: lng, vehicleId }),
};

export default sosService;
