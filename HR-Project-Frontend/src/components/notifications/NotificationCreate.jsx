// src/components/notifications/NotificationCreate.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { employeeService } from '../../services/employees';
import { departmentService } from '../../services/departments';
import { useNavigate } from 'react-router-dom';

const NotificationCreate = () => {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    notification_type: 'general',
    priority: 'Medium',
    recipient_type: 'individual', // individual, department, global
    recipient: '',
    recipient_department: '',
    is_global: false,
    scheduled_for: '',
    action_url: '',
    expires_at: ''
  });

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // All hooks must be called before any conditional returns
  useEffect(() => {
    // Only fetch data if user has permission
    if (user && (user.role === 'admin' || user.role === 'hr')) {
      fetchEmployees();
      fetchDepartments();
    }
  }, [user]);

  // Check if user has permission to create notifications AFTER hooks
  if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
    return (
      <div className="alert alert-warning">
        <i className="fas fa-exclamation-triangle me-2"></i>
        You don't have permission to create notifications.
      </div>
    );
  }

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getEmployees(1, { limit: 1000 });
      setEmployees(response.results || response);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments(1);
      setDepartments(response.results || response);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRecipientTypeChange = (e) => {
    const recipientType = e.target.value;
    setFormData(prev => ({
      ...prev,
      recipient_type: recipientType,
      recipient: '',
      recipient_department: '',
      is_global: recipientType === 'global'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const notificationData = {
        title: formData.title,
        message: formData.message,
        notification_type: formData.notification_type,
        priority: formData.priority,
        action_url: formData.action_url || undefined,
        scheduled_for: formData.scheduled_for || undefined,
        expires_at: formData.expires_at || undefined
      };

      // Set recipient based on type
      if (formData.recipient_type === 'individual') {
        notificationData.recipient = parseInt(formData.recipient);
      } else if (formData.recipient_type === 'department') {
        notificationData.recipient_department = parseInt(formData.recipient_department);
      } else if (formData.recipient_type === 'global') {
        notificationData.is_global = true;
      }

      await createNotification(notificationData);
      navigate('/notifications');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Create Notification</h1>
          <p className="text-muted mb-0">Send a notification to users</p>
        </div>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate('/notifications')}
        >
          <i className="fas fa-arrow-left me-1"></i>
          Back to Notifications
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-8">
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    maxLength={200}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="message" className="form-label">Message *</label>
                  <textarea
                    className="form-control"
                    id="message"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="notification_type" className="form-label">Type</label>
                    <select
                      className="form-select"
                      id="notification_type"
                      name="notification_type"
                      value={formData.notification_type}
                      onChange={handleChange}
                    >
                      <option value="general">General Announcement</option>
                      <option value="leave_request">Leave Request</option>
                      <option value="leave_approved">Leave Approved</option>
                      <option value="leave_rejected">Leave Rejected</option>
                      <option value="payroll_processed">Payroll Processed</option>
                      <option value="attendance_alert">Attendance Alert</option>
                      <option value="birthday">Birthday Reminder</option>
                      <option value="work_anniversary">Work Anniversary</option>
                      <option value="system">System Notification</option>
                      <option value="reminder">Reminder</option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="priority" className="form-label">Priority</label>
                    <select
                      className="form-select"
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card bg-light">
                  <div className="card-header">
                    <h6 className="mb-0">Recipients</h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Send To</label>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="recipient_type"
                          id="individual"
                          value="individual"
                          checked={formData.recipient_type === 'individual'}
                          onChange={handleRecipientTypeChange}
                        />
                        <label className="form-check-label" htmlFor="individual">
                          Individual Employee
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="recipient_type"
                          id="department"
                          value="department"
                          checked={formData.recipient_type === 'department'}
                          onChange={handleRecipientTypeChange}
                        />
                        <label className="form-check-label" htmlFor="department">
                          Department
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="recipient_type"
                          id="global"
                          value="global"
                          checked={formData.recipient_type === 'global'}
                          onChange={handleRecipientTypeChange}
                        />
                        <label className="form-check-label" htmlFor="global">
                          All Employees
                        </label>
                      </div>
                    </div>

                    {formData.recipient_type === 'individual' && (
                      <div className="mb-3">
                        <label htmlFor="recipient" className="form-label">Select Employee</label>
                        <select
                          className="form-select"
                          id="recipient"
                          name="recipient"
                          value={formData.recipient}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Choose employee...</option>
                          {employees.map(employee => (
                            <option key={employee.id} value={employee.user}>
                              {employee.first_name} {employee.last_name} - {employee.employee_id}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {formData.recipient_type === 'department' && (
                      <div className="mb-3">
                        <label htmlFor="recipient_department" className="form-label">Select Department</label>
                        <select
                          className="form-select"
                          id="recipient_department"
                          name="recipient_department"
                          value={formData.recipient_department}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Choose department...</option>
                          {departments.map(department => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {formData.recipient_type === 'global' && (
                      <div className="alert alert-info">
                        <small>
                          <i className="fas fa-info-circle me-1"></i>
                          This notification will be sent to all employees.
                        </small>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card bg-light mt-3">
                  <div className="card-header">
                    <h6 className="mb-0">Schedule & Settings</h6>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label htmlFor="scheduled_for" className="form-label">Schedule For</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        id="scheduled_for"
                        name="scheduled_for"
                        value={formData.scheduled_for}
                        onChange={handleChange}
                      />
                      <small className="form-text text-muted">
                        Leave empty to send immediately
                      </small>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="expires_at" className="form-label">Expires At</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        id="expires_at"
                        name="expires_at"
                        value={formData.expires_at}
                        onChange={handleChange}
                      />
                      <small className="form-text text-muted">
                        Optional expiration date
                      </small>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="action_url" className="form-label">Action URL</label>
                      <input
                        type="url"
                        className="form-control"
                        id="action_url"
                        name="action_url"
                        value={formData.action_url}
                        onChange={handleChange}
                        placeholder="https://example.com/action"
                      />
                      <small className="form-text text-muted">
                        Optional link for user action
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/notifications')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-1"></i>
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NotificationCreate;