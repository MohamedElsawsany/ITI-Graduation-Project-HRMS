// src/services/notifications.jsx
import api from './api';

export const notificationService = {
  // Get user's notifications
  async getMyNotifications(page = 1, filters = {}) {
    const params = new URLSearchParams({ page, ...filters });
    const response = await api.get(`/notifications/?${params}`);
    return response.data;
  },

  // Get all notifications (Admin/HR only)
  async getAllNotifications(page = 1, filters = {}) {
    const params = new URLSearchParams({ page, ...filters });
    const response = await api.get(`/notifications/all/?${params}`);
    return response.data;
  },

  // Get specific notification
  async getNotification(id) {
    const response = await api.get(`/notifications/${id}/`);
    return response.data;
  },

  // Create notification (Admin/HR only)
  async createNotification(data) {
    const response = await api.post('/notifications/create/', data);
    return response.data;
  },

  // Create bulk notifications (Admin/HR only)
  async createBulkNotifications(data) {
    const response = await api.post('/notifications/bulk-create/', data);
    return response.data;
  },

  // Update notification (Admin/HR only)
  async updateNotification(id, data) {
    const response = await api.patch(`/notifications/${id}/`, data);
    return response.data;
  },

  // Delete notification (Admin/HR only)
  async deleteNotification(id) {
    const response = await api.delete(`/notifications/${id}/`);
    return response.data;
  },

  // Mark notifications as read
  async markAsRead(notificationIds) {
    const response = await api.post('/notifications/mark-as-read/', {
      notification_ids: notificationIds
    });
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await api.post('/notifications/mark-all-as-read/');
    return response.data;
  },

  // Delete read notifications
  async deleteReadNotifications() {
    const response = await api.delete('/notifications/delete-read/');
    return response.data;
  },

  // Get notification statistics
  async getNotificationStats() {
    const response = await api.get('/notifications/stats/');
    return response.data;
  },

  // Get system notification statistics (Admin/HR only)
  async getSystemNotificationStats() {
    const response = await api.get('/notifications/system-stats/');
    return response.data;
  },

  // Get unread count
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count/');
    return response.data;
  },

  // Get recent notifications
  async getRecentNotifications(limit = 5) {
    const response = await api.get(`/notifications/recent/?limit=${limit}`);
    return response.data;
  },

  // Get user preferences
  async getNotificationPreferences() {
    const response = await api.get('/notifications/preferences/');
    return response.data;
  },

  // Update user preferences
  async updateNotificationPreferences(data) {
    const response = await api.patch('/notifications/preferences/', data);
    return response.data;
  },

  // Send test notification (Admin/HR only)
  async sendTestNotification(recipientId) {
    const response = await api.post('/notifications/send-test/', {
      recipient_id: recipientId
    });
    return response.data;
  },

  // Cleanup old notifications (Admin/HR only)
  async cleanupOldNotifications(daysOld = 30) {
    const response = await api.post('/notifications/cleanup/', {
      days_old: daysOld
    });
    return response.data;
  },

  // Get notification templates (Admin only)
  async getNotificationTemplates() {
    const response = await api.get('/notifications/templates/');
    return response.data;
  },

  // Create notification template (Admin only)
  async createNotificationTemplate(data) {
    const response = await api.post('/notifications/templates/', data);
    return response.data;
  },

  // Get notification types (Admin only)
  async getNotificationTypes() {
    const response = await api.get('/notifications/types/');
    return response.data;
  },

  // Get notification logs (Admin/HR only)
  async getNotificationLogs(page = 1, filters = {}) {
    const params = new URLSearchParams({ page, ...filters });
    const response = await api.get(`/notifications/logs/?${params}`);
    return response.data;
  }
};