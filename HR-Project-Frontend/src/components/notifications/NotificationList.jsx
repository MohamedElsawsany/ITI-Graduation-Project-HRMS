// src/components/notifications/NotificationList.jsx
import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../common/Pagination';
import LoadingSpinner from '../common/LoadingSpinner';

const NotificationList = () => {
  const { user } = useAuth();
  const { 
    notifications, 
    loading, 
    error, 
    loadNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications
  } = useNotifications();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    notification_type: '',
    priority: '',
    is_read: ''
  });
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, filters]);

  const fetchNotifications = async () => {
    try {
      const response = await loadNotifications(currentPage, {
        ...filters,
        limit: 10
      });
      
      if (response?.results) {
        setTotalPages(Math.ceil(response.count / 10));
        setTotalItems(response.count);
      } else {
        // Handle simple array response
        setTotalPages(1);
        setTotalItems(notifications?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
    setSelectedNotifications([]);
  };

  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev => {
      if (prev.includes(id)) {
        return prev.filter(nId => nId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    
    setActionLoading(true);
    try {
      await markAsRead(selectedNotifications);
      setSelectedNotifications([]);
      await fetchNotifications(); // Refresh the list
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) return;
    
    if (!window.confirm('Are you sure you want to delete selected notifications?')) {
      return;
    }

    setActionLoading(true);
    try {
      for (const id of selectedNotifications) {
        await deleteNotification(id);
      }
      setSelectedNotifications([]);
      await fetchNotifications(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await markAllAsRead();
      await fetchNotifications(); // Refresh the list
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReadNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete all read notifications?')) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteReadNotifications();
      await fetchNotifications(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await markAsRead([notification.id]);
        await fetchNotifications(); // Refresh to show updated state
      }
      // If there's an action URL, you could open it
      if (notification.action_url) {
        window.open(notification.action_url, '_blank');
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Unknown date';
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

  const getPriorityBadge = (priority) => {
    const colorMap = {
      'Urgent': 'bg-danger',
      'High': 'bg-warning text-dark',
      'Medium': 'bg-info',
      'Low': 'bg-secondary'
    };
    return `badge ${colorMap[priority] || 'bg-secondary'}`;
  };

  if (loading && notifications.length === 0) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Notifications</h1>
          <p className="text-muted mb-0">Manage your notifications and alerts</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="fas fa-filter me-1"></i>
            Filters
          </button>
          {selectedNotifications.length > 0 && (
            <div className="btn-group" role="group">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={handleMarkSelectedAsRead}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                ) : (
                  <i className="fas fa-check me-1"></i>
                )}
                Mark Read ({selectedNotifications.length})
              </button>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={handleDeleteSelected}
                disabled={actionLoading}
              >
                <i className="fas fa-trash me-1"></i>
                Delete ({selectedNotifications.length})
              </button>
            </div>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <span className="spinner-border spinner-border-sm me-1" role="status"></span>
            ) : (
              <i className="fas fa-check-double me-1"></i>
            )}
            Mark All Read
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <label htmlFor="notification_type" className="form-label">Type</label>
                <select
                  id="notification_type"
                  name="notification_type"
                  className="form-select"
                  value={filters.notification_type}
                  onChange={handleFilterChange}
                >
                  <option value="">All Types</option>
                  <option value="leave_request">Leave Request</option>
                  <option value="leave_approved">Leave Approved</option>
                  <option value="leave_rejected">Leave Rejected</option>
                  <option value="payroll_processed">Payroll Processed</option>
                  <option value="attendance_alert">Attendance Alert</option>
                  <option value="birthday">Birthday</option>
                  <option value="work_anniversary">Work Anniversary</option>
                  <option value="system">System</option>
                  <option value="reminder">Reminder</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="priority" className="form-label">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  className="form-select"
                  value={filters.priority}
                  onChange={handleFilterChange}
                >
                  <option value="">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="is_read" className="form-label">Status</label>
                <select
                  id="is_read"
                  name="is_read"
                  className="form-select"
                  value={filters.is_read}
                  onChange={handleFilterChange}
                >
                  <option value="">All</option>
                  <option value="false">Unread</option>
                  <option value="true">Read</option>
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleDeleteReadNotifications}
                  disabled={actionLoading}
                >
                  <i className="fas fa-trash me-1"></i>
                  Delete Read
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="card">
        <div className="card-body p-0">
          {notifications && notifications.length > 0 ? (
            <>
              {/* Select all header */}
              <div className="p-3 border-bottom bg-light">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={notifications.length > 0 && selectedNotifications.length === notifications.length}
                    onChange={handleSelectAll}
                  />
                  <label className="form-check-label">
                    Select all notifications
                  </label>
                </div>
              </div>
              
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item p-3 border-bottom ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-start">
                      <div className="form-check me-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectNotification(notification.id);
                          }}
                        />
                      </div>
                      
                      <div className="me-3">
                        <i className={`${getNotificationIcon(notification.notification_type)} fa-lg`}></i>
                      </div>
                      
                      <div className="flex-fill">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className={`mb-0 ${!notification.is_read ? 'fw-bold' : ''}`}>
                            {notification.title || 'No Title'}
                          </h6>
                          <div className="d-flex align-items-center gap-2">
                            <span className={getPriorityBadge(notification.priority)}>
                              {notification.priority}
                            </span>
                            <small className="text-muted">
                              {formatDate(notification.created_at)}
                            </small>
                          </div>
                        </div>
                        
                        <p className="mb-2 text-muted">
                          {notification.message || 'No message'}
                        </p>
                        
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            {notification.sender_full_name && (
                              <small className="text-muted">
                                <i className="fas fa-user me-1"></i>
                                From: {notification.sender_full_name}
                              </small>
                            )}
                            <small className="text-muted">
                              <i className="fas fa-tag me-1"></i>
                              {notification.notification_type?.replace('_', ' ').toUpperCase()}
                            </small>
                          </div>
                          
                          <div className="d-flex align-items-center gap-2">
                            {!notification.is_read && (
                              <span className="badge bg-primary">New</span>
                            )}
                            {notification.action_url && (
                              <small className="text-primary">
                                <i className="fas fa-external-link-alt"></i>
                              </small>
                            )}
                          </div>
                        </div>

                        {/* Related object details */}
                        {notification.related_leave_details && (
                          <div className="mt-2 p-2 bg-light rounded">
                            <small>
                              <strong>Leave Request:</strong> {notification.related_leave_details.leave_type} 
                              ({notification.related_leave_details.start_date} to {notification.related_leave_details.end_date})
                              - Status: {notification.related_leave_details.status}
                            </small>
                          </div>
                        )}

                        {notification.related_payroll_details && (
                          <div className="mt-2 p-2 bg-light rounded">
                            <small>
                              <strong>Payroll:</strong> Period {notification.related_payroll_details.pay_period_start} to {notification.related_payroll_details.pay_period_end}
                              - Net Pay: ${notification.related_payroll_details.net_pay}
                            </small>
                          </div>
                        )}

                        {notification.related_attendance_details && (
                          <div className="mt-2 p-2 bg-light rounded">
                            <small>
                              <strong>Attendance:</strong> {notification.related_attendance_details.date}
                              - Status: {notification.related_attendance_details.status}
                            </small>
                          </div>
                        )}
                      </div>

                      <div className="ms-3">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this notification?')) {
                              deleteNotification(notification.id);
                            }
                          }}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No notifications found</h5>
              <p className="text-muted">
                {Object.values(filters).some(f => f) ? 'Try adjusting your filters' : "You're all caught up!"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={10}
        />
      )}

      <style jsx>{`
        .notification-item {
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }

        .notification-item:hover {
          background-color: #f8f9fa;
        }

        .notification-item.unread {
          background-color: #f0f8ff;
          border-left-color: #007bff;
        }

        .notification-item:last-child {
          border-bottom: none !important;
        }
      `}</style>
    </div>
  );
};

export default NotificationList;