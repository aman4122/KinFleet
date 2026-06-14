import api from './api';

const vehicleService = {
  getVehicles: () => api.get('/vehicles'),
  getVehicle: (id) => api.get(`/vehicles/${id}`),
  createVehicle: (data) => api.post('/vehicles', data),
  updateVehicle: (id, data) => api.put(`/vehicles/${id}`, data),
  updateMileage: (id, mileage) => api.patch(`/vehicles/${id}/mileage`, { currentMileage: mileage }),
  deleteVehicle: (id) => api.delete(`/vehicles/${id}`),
  getCompliance: (id) => api.get(`/vehicles/${id}/compliance`),
};

export default vehicleService;
