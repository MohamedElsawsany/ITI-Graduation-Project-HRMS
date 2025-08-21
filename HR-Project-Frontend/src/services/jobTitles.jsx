import api from './api';

export const jobTitleService = {
  async getJobTitles(page = 1) {
    const response = await api.get(`/job-titles/?page=${page}`);
    return response.data;
  },

  async getJobTitle(id) {
    const response = await api.get(`/job-titles/${id}/`);
    return response.data;
  },

  async createJobTitle(data) {
    const response = await api.post('/job-titles/', data);
    return response.data;
  },

  async updateJobTitle(id, data) {
    const response = await api.patch(`/job-titles/${id}/`, data);
    return response.data;
  },

  async deleteJobTitle(id) {
    const response = await api.delete(`/job-titles/${id}/`);
    return response.data;
  }
};