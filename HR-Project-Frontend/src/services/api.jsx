import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { getToken, getRefreshToken, setTokens, removeTokens, isTokenExpired } from '../utils/token';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken && !isTokenExpired(refreshToken)) {
        try {
          const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          setTokens(access, refreshToken);
          originalRequest.headers.Authorization = `Bearer ${access}`;

          return api(originalRequest);
        } catch (refreshError) {
          removeTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        removeTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
