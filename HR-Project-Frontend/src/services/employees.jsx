import api from './api';

export const employeeService = {
  async getEmployees(page = 1, filters = {}) {
    const params = new URLSearchParams({ page, ...filters });
    const response = await api.get(`/employees/?${params}`);
    return response.data;
  },

  async getEmployee(id) {
    const response = await api.get(`/employees/${id}/`);
    return response.data;
  },

  async createEmployee(data) {
    const response = await api.post('/employees/create/', data);
    return response.data;
  },

  async updateEmployee(id, data) {
    const response = await api.patch(`/employees/${id}/update/`, data);
    return response.data;
  },

  async deleteEmployee(id) {
    const response = await api.delete(`/employees/${id}/delete/`);
    return response.data;
  },

  async searchEmployees(query, page = 1) {
    const response = await api.get(`/employees/search/?q=${query}&page=${page}`);
    return response.data;
  },

  async updateEmployeeStatus(id, isActive) {
    const response = await api.patch(`/employees/${id}/status/`, {
      is_active: isActive
    });
    return response.data;
  }
};
