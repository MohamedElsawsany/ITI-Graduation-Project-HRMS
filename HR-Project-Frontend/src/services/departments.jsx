import api from './api';

export const departmentService = {
  async getDepartments(page = 1) {
    const response = await api.get(`/departments/?page=${page}`);
    return response.data;
  },

  async getDepartment(id) {
    const response = await api.get(`/departments/${id}/`);
    return response.data;
  },

  async createDepartment(data) {
    const response = await api.post('/departments/', data);
    return response.data;
  },

  async updateDepartment(id, data) {
    const response = await api.patch(`/departments/${id}/`, data);
    return response.data;
  },

  async deleteDepartment(id) {
    const response = await api.delete(`/departments/${id}/`);
    return response.data;
  },

  async getDepartmentEmployees(id, page = 1) {
    const response = await api.get(`/departments/${id}/employees/?page=${page}`);
    return response.data;
  }
};