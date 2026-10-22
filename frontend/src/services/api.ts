import axios, { type InternalAxiosRequestConfig } from 'axios';

// Base URL for API requests.
// In production or when VITE_API_URL is specified, use that base URL.
// In development without VITE_API_URL, fallback to http://localhost:8000.
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000')
).replace(/\/+$/, '');

export const API_BASE = `${API_BASE_URL}/api/v1`;

// Ensure default axios requests also support credentials
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HTTP-only cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization header if a token is in localStorage (as a fallback/backup)
const attachAuthToken = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('masticare_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachAuthToken);
axios.interceptors.request.use(attachAuthToken);

export default api;

