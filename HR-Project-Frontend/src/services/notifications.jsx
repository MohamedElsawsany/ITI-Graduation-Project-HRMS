// src/services/notifications.jsx
import api from './api';

export const notificationService = {
  // Get user's notifications
  async getMyNotifications(page = 1, filters = {}) {
    try {
      const params = new URLSearchParams({ page: page.toString() });
      
      // Add filters to params
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      });

      const response = await api.get(`/notifications/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get all notifications (Admin/HR only)
  async getAllNotifications(page = 1, filters = {}) {
    try {
      const params = new URLSearchParams({ page: page.toString() });
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      });

      const response = await api.get(`/notifications/all/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      throw error;
    }
  },

  // Get specific notification
  async getNotification(id) {
    try {
      const response = await api.get(`/notifications/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification:', error);
      throw error;
    }
  },

  // Create notification (Admin/HR only)
  async createNotification(data) {
    try {
      const response = await api.post('/notifications/create/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Create bulk notifications (Admin/HR only)
  async createBulkNotifications(data) {
    try {
      const response = await api.post('/notifications/bulk-create/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  },

  // Update notification (Admin/HR only)
  async updateNotification(id, data) {
    try {
      const response = await api.patch(`/notifications/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  },

  // Delete notification
  async deleteNotification(id) {
    try {
      const response = await api.delete(`/notifications/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Mark notifications as read
  async markAsRead(notificationIds) {
    try {
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new Error('notification_ids must be a non-empty array');
      }

      const response = await api.post('/notifications/mark-as-read/', {
        notification_ids: notificationIds
      });
      return response.data;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await api.post('/notifications/mark-all-as-read/');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Delete read notifications
  async deleteReadNotifications() {
    try {
      const response = await api.delete('/notifications/delete-read/');
      return response.data;
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      throw error;
    }
  },

  // Get notification statistics
  async getNotificationStats() {
    try {
      const response = await api.get('/notifications/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  },

  // Get system notification statistics (Admin/HR only)
  async getSystemNotificationStats() {
    try {
      const response = await api.get('/notifications/system-stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching system notification stats:', error);
      throw error;
    }
  },

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count/');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      // Return default value instead of throwing
      return { unread_count: 0 };
    }
  },

  // Get recent notifications
  async getRecentNotifications(limit = 5) {
    try {
      const response = await api.get(`/notifications/recent/?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
      throw error;
    }
  },

  // Get user preferences
  async getNotificationPreferences() {
    try {
      const response = await api.get('/notifications/preferences/');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  },

  // Update user preferences
  async updateNotificationPreferences(data) {
    try {
      const response = await api.patch('/notifications/preferences/', data);
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  },

  // Send test notification (Admin/HR only)
  async sendTestNotification(recipientId) {
    try {
      const response = await api.post('/notifications/send-test/', {
        recipient_id: recipientId
      });
      return response.data;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  },

  // Cleanup old notifications (Admin/HR only)
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const response = await api.post('/notifications/cleanup/', {
        days_old: daysOld
      });
      return response.data;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  },

  // Get notification templates (Admin only)
  async getNotificationTemplates() {
    try {
      const response = await api.get('/notifications/templates/');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      throw error;
    }
  },

  // Create notification template (Admin only)
  async createNotificationTemplate(data) {
    try {
      const response = await api.post('/notifications/templates/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating notification template:', error);
      throw error;
    }
  },

  // Get notification types (Admin only)
  async getNotificationTypes() {
    try {
      const response = await api.get('/notifications/types/');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification types:', error);
      throw error;
    }
  },

  // Get notification logs (Admin/HR only)
  async getNotificationLogs(page = 1, filters = {}) {
    try {
      const params = new URLSearchParams({ page: page.toString() });
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      });

      const response = await api.get(`/notifications/logs/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      throw error;
    }
  }
};