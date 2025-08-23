// src/services/attendance.jsx
import api from './api';

export const attendanceService = {
  // Get all attendance records (Admin/HR see all, employees see their own)
  async getAttendances(page = 1, filters = {}) {
    const params = new URLSearchParams({ page, ...filters });
    const response = await api.get(`/attendances/?${params}`);
    return response.data;
  },

  // Get specific attendance record
  async getAttendance(id) {
    const response = await api.get(`/attendances/${id}/`);
    return response.data;
  },

  // Create attendance record manually (Admin/HR only)
  async createAttendance(data) {
    const response = await api.post('/attendances/create/', data);
    return response.data;
  },

  // Update attendance record (Admin/HR only)
  async updateAttendance(id, data) {
    const response = await api.patch(`/attendances/${id}/update/`, data);
    return response.data;
  },

  // Delete attendance record (Admin/HR only)
  async deleteAttendance(id) {
    const response = await api.delete(`/attendances/${id}/delete/`);
    return response.data;
  },

  // Check-in for employee
  async checkIn(notes = '') {
    const response = await api.post('/attendance/check-in/', { notes });
    return response.data;
  },

  // Check-out for employee
  async checkOut(notes = '') {
    const response = await api.post('/attendance/check-out/', { notes });
    return response.data;
  },

  // Get current user's today attendance
  async getMyTodayAttendance() {
    const response = await api.get('/attendance/my-today/');
    return response.data;
  },

  // Get today's attendance overview (Admin/HR only)
  async getTodayAttendanceOverview() {
    const response = await api.get('/attendance/today-overview/');
    return response.data;
  },

  // Get attendance statistics for date range (Admin/HR only)
  async getAttendanceStatistics(startDate, endDate) {
    const response = await api.get(`/attendance/statistics/?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  },

  // Get monthly attendance summary (Admin/HR only)
  async getMonthlyAttendanceSummary(month, page = 1) {
    const params = new URLSearchParams({ page });
    if (month) params.append('month', month);
    const response = await api.get(`/attendance/monthly-summary/?${params}`);
    return response.data;
  },

  // Get current user's monthly summary
  async getMyMonthlySummary(month) {
    const params = month ? `?month=${month}` : '';
    const response = await api.get(`/attendance/my-monthly-summary/${params}`);
    return response.data;
  },

  // Get attendance settings
  async getAttendanceSettings() {
    const response = await api.get('/attendance/settings/');
    return response.data;
  },

  // Update attendance settings (Admin only)
  async updateAttendanceSettings(data) {
    const response = await api.patch('/attendance/settings/', data);
    return response.data;
  },

  // Bulk create attendance records (Admin/HR only)
  async bulkCreateAttendance(data) {
    const response = await api.post('/attendance/bulk-create/', data);
    return response.data;
  },

  // Search employees for attendance (Admin/HR only)
  async searchEmployeesForAttendance(query) {
    const response = await api.get(`/attendance/search-employees/?q=${query}`);
    return response.data;
  },

  // Export attendance data (Admin/HR only)
  async exportAttendanceData(startDate, endDate) {
    const response = await api.get(`/attendance/export/?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  }
};