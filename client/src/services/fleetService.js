import api from './api';

const fleetService = {
  getFleet: () => api.get('/fleet'),
  joinFleet: (fleetId) => api.post('/fleet/join', { fleetId }),
  leaveFleet: () => api.post('/fleet/leave'),
  getFleetVehicles: () => api.get('/fleet/vehicles'),
};

export default fleetService;
