// API configuration and wrapper
const API_URL = '/api';

export const api = {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
};

export const authService = {
  login(email, password) {
    return api.post('/auth/login', { email, password });
  },
  
  register(name, email, phone, password) {
    return api.post('/auth/register', { name, email, phone, password });
  },
  
  logout() {
    return api.post('/auth/logout');
  },
  
  async checkAuth() {
    try {
      const responseData = await api.get('/auth/me');
      return responseData.data?.user || responseData.user || null;
    } catch {
      return null;
    }
  }
};
