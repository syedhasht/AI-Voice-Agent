import axios from 'axios';
import { API_BASE } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please try again.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('Server unavailable. Please check your connection.'));
    }
    const detail = error.response.data?.detail;
    if (detail) {
      return Promise.reject(new Error(Array.isArray(detail) ? detail.map((d) => d.msg).join(', ') : detail));
    }
    return Promise.reject(error);
  }
);

export default api;
