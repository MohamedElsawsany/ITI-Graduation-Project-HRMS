import api from './api';
import { setTokens, getTokenPayload } from '../utils/token';

export const authService = {
  async login(username, password) {
    const response = await api.post('/accounts/token/', {
      username,
      password,
    });

    const { access, refresh } = response.data;
    setTokens(access, refresh);

    const payload = getTokenPayload(access);
    return {
      tokens: { access, refresh },
      user: {
        id: payload.user_id,
        username: payload.username,
        email: payload.email,
        role: payload.role
      }
    };
  },

  async getUsers() {
    const response = await api.get('/accounts/users/');
    return response.data;
  }
};