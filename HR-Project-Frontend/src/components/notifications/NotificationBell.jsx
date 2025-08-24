// src/components/notifications/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
  const { unreadCount, loadUnreadCount, notifications, loadNotifications, markAsRead } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (dropdownOpen && recentNotifications.length === 0) {
      loadRecentNotifications();
    }
  }, [dropdownOpen]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadRecentNotifications = async () => {
    try {
      await loadNotifications(1, { limit: 5 });
      setRecentNotifications(notifications.slice(0, 5));
    } catch (error) {
      console.error('Failed to load recent notifications:', error);
    }
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    setDropdownOpen(!dropdownOpen);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }
    setDropdownOpen(false);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMs = now - notificationDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return notificationDate.toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'text-danger';
      case 'High': return 'text-warning';
      case 'Medium': return 'text-info';
      case 'Low': return 'text-secondary';
      default: return 'text-secondary';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave_request': return 'fas fa-calendar-alt';
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
    <div className="nav-item dropdown" ref={dropdownRef}>
      <button
        className="btn btn-outline-light position-relative"
        onClick={toggleDropdown}
        aria-expanded={dropdownOpen}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <div className={`dropdown-menu dropdown-menu-end notification-dropdown ${dropdownOpen ? 'show' : ''}`}>
        <div className="dropdown-header d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Notifications</h6>
          {unreadCount > 0 && (
            <small className="text-muted">{unreadCount} unread</small>
          )}
        </div>

        <div className="notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`dropdown-item notification-item ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
                style={{ cursor: 'pointer', borderLeft: notification.is_read ? 'none' : '3px solid #007bff' }}
              >
                <div className="d-flex align-items-start">
                  <div className="me-3">
                    <i className={`${getNotificationIcon(notification.notification_type)} ${getPriorityColor(notification.priority)}`}></i>
                  </div>
                  <div className="flex-fill">
                    <div className="d-flex justify-content-between align-items-start">
                      <h6 className="mb-1 text-truncate" style={{ fontSize: '0.9rem' }}>
                        {notification.title}
                      </h6>
                      <small className="text-muted ms-2">
                        {formatTimeAgo(notification.created_at)}
                      </small>
                    </div>
                    <p className="mb-1 text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>
                      {notification.message.length > 80 
                        ? `${notification.message.substring(0, 80)}...` 
                        : notification.message
                      }
                    </p>
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
            <div className="dropdown-item-text text-center text-muted py-3">
              <i className="fas fa-bell-slash mb-2"></i>
              <br />
              No notifications
            </div>
          )}
        </div>

        {recentNotifications.length > 0 && (
          <>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item-text text-center">
              <Link 
                to="/notifications" 
                className="btn btn-sm btn-outline-primary"
                onClick={() => setDropdownOpen(false)}
              >
                View All Notifications
              </Link>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .notification-dropdown {
          width: 350px;
          max-width: 90vw;
        }

        .notification-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s ease;
        }

        .notification-item:hover {
          background-color: #f8f9fa;
        }

        .notification-item.unread {
          background-color: #f0f8ff;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        @media (max-width: 768px) {
          .notification-dropdown {
            width: 300px;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;