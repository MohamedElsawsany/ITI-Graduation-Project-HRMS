// src/components/notifications/NotificationDashboardWidget.jsx
import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';

const NotificationDashboardWidget = () => {
  const { unreadCount, loadNotifications, notifications } = useNotifications();
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    high_priority: 0,
    urgent: 0
  });

  useEffect(() => {
    loadRecentData();
  }, []);

  const loadRecentData = async () => {
    try {
      await loadNotifications(1, { limit: 5 });
      const recent = notifications.slice(0, 5);
      setRecentNotifications(recent);
      
      // Calculate stats
      const total = notifications.length;
      const unread = notifications.filter(n => !n.is_read).length;
      const high_priority = notifications.filter(n => n.priority === 'High').length;
      const urgent = notifications.filter(n => n.priority === 'Urgent').length;
      
      setStats({ total, unread, high_priority, urgent });
    } catch (error) {
      console.error('Failed to load notification data:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMs = now - notificationDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    return notificationDate.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave_request': return 'fas fa-calendar-alt text-warning';
      case 'leave_approved': return 'fas fa-calendar-check text-success';
      case 'leave_rejected': return 'fas fa-calendar-times text-danger';
      case 'payroll_processed': return 'fas fa-money-bill-wave text-success';
      case 'attendance_alert': return 'fas fa-clock text-warning';
      case 'birthday': return 'fas fa-birthday-cake text-info';
      case 'work_anniversary': return 'fas fa-award text-primary';
      case 'system': return 'fas fa-cog text-secondary';
      case 'reminder': return 'fas fa-bell text-warning';
      case 'general': return 'fas fa-info-circle text-info';
      default: return 'fas fa-bell text-secondary';
    }
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="fas fa-bell me-2"></i>
          Notifications
        </h5>
        <Link to="/notifications" className="btn btn-sm btn-outline-primary">
          View All
        </Link>
      </div>
      <div className="card-body">
        {/* Stats Row */}
        <div className="row mb-3">
          <div className="col-3 text-center">
            <div className="text-primary">
              <i className="fas fa-bell fa-lg"></i>
            </div>
            <div className="fw-bold">{stats.total}</div>
            <small className="text-muted">Total</small>
          </div>
          <div className="col-3 text-center">
            <div className="text-info">
              <i className="fas fa-envelope fa-lg"></i>
            </div>
            <div className="fw-bold">{stats.unread}</div>
            <small className="text-muted">Unread</small>
          </div>
          <div className="col-3 text-center">
            <div className="text-warning">
              <i className="fas fa-exclamation-triangle fa-lg"></i>
            </div>
            <div className="fw-bold">{stats.high_priority}</div>
            <small className="text-muted">High</small>
          </div>
          <div className="col-3 text-center">
            <div className="text-danger">
              <i className="fas fa-exclamation fa-lg"></i>
            </div>
            <div className="fw-bold">{stats.urgent}</div>
            <small className="text-muted">Urgent</small>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="notification-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notification) => (
              <div key={notification.id} className="d-flex align-items-start mb-3 pb-2 border-bottom">
                <div className="me-3">
                  <i className={`${getNotificationIcon(notification.notification_type)} fa-lg`}></i>
                </div>
                <div className="flex-fill">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className={`mb-0 ${!notification.is_read ? 'fw-bold' : ''}`} style={{ fontSize: '0.9rem' }}>
                      {notification.title}
                    </h6>
                    <small className="text-muted ms-2">
                      {formatTimeAgo(notification.created_at)}
                    </small>
                  </div>
                  <p className="mb-1 text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>
                    {notification.message.length > 60 
                      ? `${notification.message.substring(0, 60)}...` 
                      : notification.message
                    }
                  </p>
                  <div className="d-flex align-items-center justify-content-between">
                    <small className="text-muted">
                      {notification.notification_type.replace('_', ' ').toUpperCase()}
                    </small>
                    {!notification.is_read && (
                      <span className="badge bg-primary" style={{ fontSize: '0.7rem' }}>
                        NEW
                      </span>
                    )}
                    {notification.priority === 'Urgent' && (
                      <span className="badge bg-danger" style={{ fontSize: '0.7rem' }}>
                        URGENT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted py-3">
              <i className="fas fa-bell-slash fa-2x mb-2"></i>
              <br />
              <small>No recent notifications</small>
            </div>
          )}
        </div>

        {recentNotifications.length > 0 && (
          <div className="text-center mt-2">
            <Link to="/notifications" className="text-decoration-none">
              <small>View all notifications <i className="fas fa-arrow-right"></i></small>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDashboardWidget;