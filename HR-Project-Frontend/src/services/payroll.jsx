import api from './api';

// Make sure the API path matches your backend URL structure

export const payrollService = {
  // Get all payrolls (Admin/HR only)
  async getPayrolls(page = 1, filters = {}) {
    const params = new URLSearchParams({ page, ...filters });
    const response = await api.get(`/payrolls/?${params}`);
    return response.data;
  },

  // Get current user's payrolls
  async getMyPayrolls(page = 1, filters = {}) {
    const params = new URLSearchParams({ page, ...filters });
    const response = await api.get(`/payrolls/my-payrolls/?${params}`);
    return response.data;
  },

  // Get specific payroll details
  async getPayroll(id) {
    const response = await api.get(`/payrolls/${id}/`);
    return response.data;
  },

  // Create new payroll (Admin/HR only)
  async createPayroll(data) {
    const response = await api.post('/payrolls/create/', data);
    return response.data;
  },

  // Update payroll (Admin/HR only)
  async updatePayroll(id, data) {
    const response = await api.patch(`/payrolls/${id}/update/`, data);
    return response.data;
  },

  // Delete payroll (Admin/HR only)
  async deletePayroll(id) {
    const response = await api.delete(`/payrolls/${id}/delete/`);
    return response.data;
  },

  // Update payroll status (Admin/HR only)
  async updatePayrollStatus(id, status) {
    const response = await api.patch(`/payrolls/${id}/status/`, { status });
    return response.data;
  },

  // Get payroll history (Admin/HR only)
  async getPayrollHistory(id, page = 1) {
    const response = await api.get(`/payrolls/${id}/history/?page=${page}`);
    return response.data;
  },

  // Get payroll summary statistics (Admin/HR only)
  async getPayrollSummary(month) {
    const params = month ? `?month=${month}` : '';
    const response = await api.get(`/payrolls/summary/${params}`);
    return response.data;
  },

  // Bulk create payrolls (Admin/HR only)
  async bulkCreatePayrolls(payrollsData) {
    const response = await api.post('/payrolls/bulk-create/', {
      payrolls: payrollsData
    });
    return response.data;
  }
};