// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notifications';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Failed to load unread count:', error);
      setUnreadCount(0);
    }
  }, [user]);

  // Load notifications
  const loadNotifications = useCallback(async (page = 1, filters = {}) => {
    if (!user) return { results: [], count: 0 };
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationService.getMyNotifications(page, {
        limit: filters.limit || 10,
        ...filters
      });
      
      // Handle both paginated and simple array responses
      if (response.results) {
        setNotifications(response.results);
        return response;
      } else if (Array.isArray(response)) {
        setNotifications(response);
        return { results: response, count: response.length };
      } else {
        setNotifications([]);
        return { results: [], count: 0 };
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setError(error.response?.data?.detail || 'Failed to load notifications');
      setNotifications([]);
      return { results: [], count: 0 };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await notificationService.getNotificationPreferences();
      setPreferences(response);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Set default preferences if loading fails
      setPreferences({
        email_notifications: true,
        email_leave_requests: true,
        email_payroll_updates: true,
        email_attendance_alerts: true,
        email_general_announcements: true,
        in_app_notifications: true,
        push_notifications: false,
        quiet_hours_enabled: false,
        quiet_hours_start: '',
        quiet_hours_end: ''
      });
    }
  }, [user]);

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds) => {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return;
    }

    try {
      await notificationService.markAsRead(notificationIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      // Update unread count
      const newUnreadCount = Math.max(0, unreadCount - notificationIds.length);
      setUnreadCount(newUnreadCount);
      
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      throw error;
    }
  }, [unreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );
      
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }, []);

  // Create notification (Admin/HR only)
  const createNotification = useCallback(async (notificationData) => {
    try {
      const response = await notificationService.createNotification(notificationData);
      return response;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      // Update unread count if it was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }, [notifications]);

  // Delete read notifications
  const deleteReadNotifications = useCallback(async () => {
    try {
      await notificationService.deleteReadNotifications();
      
      // Update local state - remove read notifications
      setNotifications(prev => prev.filter(notification => !notification.is_read));
      
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
      throw error;
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (preferencesData) => {
    try {
      const response = await notificationService.updateNotificationPreferences(preferencesData);
      setPreferences(response);
      return response;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }, []);

  // Get notification statistics
  const getNotificationStats = useCallback(async () => {
    if (!user) return null;
    
    try {
      const response = await notificationService.getNotificationStats();
      return response;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return null;
    }
  }, [user]);

  // Initialize data when user changes
  useEffect(() => {
    if (user) {
      loadUnreadCount();
      loadPreferences();
    } else {
      // Reset state when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
      setError(null);
    }
  }, [user, loadUnreadCount, loadPreferences]);

  // Auto-refresh unread count every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, loadUnreadCount]);

  const contextValue = {
    // State
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    
    // Actions
    loadNotifications,
    loadUnreadCount,
    loadPreferences,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    deleteReadNotifications,
    updatePreferences,
    getNotificationStats,
    
    // Utilities
    setError,
    setLoading
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};