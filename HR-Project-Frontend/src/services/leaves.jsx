import api from './api';

export const leaveService = {
  async getAllLeaveRequests(page = 1) {
    const response = await api.get(`/leaves/?page=${page}`);
    return response.data;
  },

  async getMyLeaveRequests(page = 1) {
    const response = await api.get(`/leaves/my-requests/?page=${page}`);
    return response.data;
  },

  async getPendingLeaveRequests(page = 1) {
    const response = await api.get(`/leaves/pending/?page=${page}`);
    return response.data;
  },

  async getApprovedLeaveRequests(page = 1) {
    const response = await api.get(`/leaves/approved/?page=${page}`);
    return response.data;
  },

  async getRejectedLeaveRequests(page = 1) {
    const response = await api.get(`/leaves/rejected/?page=${page}`);
    return response.data;
  },

  async createLeaveRequest(data) {
    const response = await api.post('/leaves/create/', data);
    return response.data;
  },

  async updateLeaveRequest(id, data) {
    const response = await api.patch(`/leaves/${id}/update/`, data);
    return response.data;
  },

  async deleteLeaveRequest(id) {
    const response = await api.delete(`/leaves/${id}/delete/`);
    return response.data;
  },

  async approveRejectLeaveRequest(id, status) {
    const response = await api.patch(`/leaves/${id}/approve-reject/`, {
      status
    });
    return response.data;
  }
};
