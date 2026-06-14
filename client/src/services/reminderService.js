import api from './api';

const reminderService = {
  getReminders: (params) => api.get('/reminders', { params }),
  createReminder: (data) => api.post('/reminders', data),
  updateReminder: (id, data) => api.put(`/reminders/${id}`, data),
  completeReminder: (id) => api.patch(`/reminders/${id}/complete`),
  deleteReminder: (id) => api.delete(`/reminders/${id}`),
};

export default reminderService;
