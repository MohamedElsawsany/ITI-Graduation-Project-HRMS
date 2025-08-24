// src/context/NotificationContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { notificationService } from '../services/notifications';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  preferences: null
};

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload, loading: false };
    
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id ? action.payload : notification
        )
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    
    case 'MARK_AS_READ':
      const updatedNotifications = state.notifications.map(notification =>
        action.payload.includes(notification.id)
          ? { ...notification, is_read: true, read_at: new Date().toISOString() }
          : notification
      );
      const newUnreadCount = updatedNotifications.filter(n => !n.is_read).length;
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: newUnreadCount
      };
    
    case 'MARK_ALL_AS_READ':
      const allReadNotifications = state.notifications.map(notification => ({
        ...notification,
        is_read: true,
        read_at: new Date().toISOString()
      }));
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0
      };
    
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [], unreadCount: 0 };
    
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user } = useAuth();

  // Load initial notifications and unread count
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
      loadPreferences();
    } else {
      dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    }
  }, [user]);

  // Auto-refresh unread count every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = async (page = 1, filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await notificationService.getMyNotifications(page, filters);
      dispatch({ type: 'SET_NOTIFICATIONS', payload: response.results || response });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      dispatch({ type: 'SET_UNREAD_COUNT', payload: response.unread_count });
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const preferences = await notificationService.getNotificationPreferences();
      dispatch({ type: 'SET_PREFERENCES', payload: preferences });
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const markAsRead = async (notificationIds) => {
    try {
      await notificationService.markAsRead(notificationIds);
      dispatch({ type: 'MARK_AS_READ', payload: notificationIds });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const createNotification = async (notificationData) => {
    try {
      const newNotification = await notificationService.createNotification(notificationData);
      dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
      return newNotification;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const deleteReadNotifications = async () => {
    try {
      await notificationService.deleteReadNotifications();
      const unreadNotifications = state.notifications.filter(n => !n.is_read);
      dispatch({ type: 'SET_NOTIFICATIONS', payload: unreadNotifications });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const updatePreferences = async (preferencesData) => {
    try {
      const updatedPreferences = await notificationService.updateNotificationPreferences(preferencesData);
      dispatch({ type: 'SET_PREFERENCES', payload: updatedPreferences });
      return updatedPreferences;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const value = {
    ...state,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    deleteReadNotifications,
    updatePreferences,
    loadPreferences
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};