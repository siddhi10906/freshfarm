import axios from 'axios';

const API = axios.create({
  // Keep same-origin routing for local development; set VITE_API_BASE_URL
  // to the deployed backend API URL when the frontend and backend use separate hosts.
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
});

// Request Interceptor: Attach JWT Token to headers
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('freshfarm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
