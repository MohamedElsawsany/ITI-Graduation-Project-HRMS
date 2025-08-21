import { jwtDecode } from 'jwt-decode';

export const getToken = () => localStorage.getItem('access_token');

export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const removeTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch (error) {
    return true;
  }
};

export const getTokenPayload = (token) => {
  if (!token) return null;
  
  try {
    return jwtDecode(token);
  } catch (error) {
    return null;
  }
};
