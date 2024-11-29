import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  timeout: 30000, // 30 second timeout
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.error || 'Server error occurred');
    } else if (error.request) {
      // No response received
      throw new Error('No response from server. Please check if the API is running.');
    } else {
      // Request setup error
      throw new Error('Error setting up the request');
    }
  }
);

export default api;