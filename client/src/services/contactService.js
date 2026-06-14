import api from './api';

const contactService = {
  getContacts: () => api.get('/contacts'),
  createContact: (data) => api.post('/contacts', data),
  updateContact: (id, data) => api.put(`/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/contacts/${id}`),
};

export default contactService;
