import axios from 'axios';

// Base URL for API requests.
// When running in development, we can use relative path '/api' through Vite proxy,
// or direct URL if VITE_API_URL is specified.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HTTP-only cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization header if a token is in localStorage (as a fallback/backup)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('masticare_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
