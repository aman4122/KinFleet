import api from './api';

const tripService = {
  getTrips: (params) => api.get('/trips', { params }),
  getTrip: (id) => api.get(`/trips/${id}`),
  createTrip: (data) => api.post('/trips', data),
  updateTrip: (id, data) => api.put(`/trips/${id}`, data),
  deleteTrip: (id) => api.delete(`/trips/${id}`),
  getTripStats: () => api.get('/trips/stats'),
};

export default tripService;
