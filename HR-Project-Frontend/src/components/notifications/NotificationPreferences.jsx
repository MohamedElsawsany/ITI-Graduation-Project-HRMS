// src/components/notifications/NotificationPreferences.jsx
import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';

const NotificationPreferences = () => {
  const { preferences, loadPreferences, updatePreferences } = useNotifications();
  const [formData, setFormData] = useState({
    email_notifications: true,
    email_leave_requests: true,
    email_payroll_updates: true,
    email_attendance_alerts: true,
    email_general_announcements: true,
    in_app_notifications: true,
    push_notifications: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '',
    quiet_hours_end: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUserPreferences();
  }, []);

  useEffect(() => {
    if (preferences) {
      setFormData({
        email_notifications: preferences.email_notifications,
        email_leave_requests: preferences.email_leave_requests,
        email_payroll_updates: preferences.email_payroll_updates,
        email_attendance_alerts: preferences.email_attendance_alerts,
        email_general_announcements: preferences.email_general_announcements,
        in_app_notifications: preferences.in_app_notifications,
        push_notifications: preferences.push_notifications,
        quiet_hours_enabled: preferences.quiet_hours_enabled,
        quiet_hours_start: preferences.quiet_hours_start || '',
        quiet_hours_end: preferences.quiet_hours_end || ''
      });
    }
  }, [preferences]);

  const loadUserPreferences = async () => {
    setLoading(true);
    try {
      await loadPreferences();
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await updatePreferences(formData);
      setMessage('Preferences updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Notification Preferences</h1>
          <p className="text-muted mb-0">Customize how you receive notifications</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'}`} role="alert">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-envelope me-2"></i>
                  Email Notifications
                </h5>
              </div>
              <div className="card-body">
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="email_notifications"
                    name="email_notifications"
                    checked={formData.email_notifications}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="email_notifications">
                    <strong>Enable Email Notifications</strong>
                    <br />
                    <small className="text-muted">Receive notifications via email</small>
                  </label>
                </div>

                <div className="ms-4">
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="email_leave_requests"
                      name="email_leave_requests"
                      checked={formData.email_leave_requests}
                      onChange={handleChange}
                      disabled={!formData.email_notifications}
                    />
                    <label className="form-check-label" htmlFor="email_leave_requests">
                      Leave Request Updates
                    </label>
                  </div>

                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="email_payroll_updates"
                      name="email_payroll_updates"
                      checked={formData.email_payroll_updates}
                      onChange={handleChange}
                      disabled={!formData.email_notifications}
                    />
                    <label className="form-check-label" htmlFor="email_payroll_updates">
                      Payroll Updates
                    </label>
                  </div>

                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="email_attendance_alerts"
                      name="email_attendance_alerts"
                      checked={formData.email_attendance_alerts}
                      onChange={handleChange}
                      disabled={!formData.email_notifications}
                    />
                    <label className="form-check-label" htmlFor="email_attendance_alerts">
                      Attendance Alerts
                    </label>
                  </div>

                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="email_general_announcements"
                      name="email_general_announcements"
                      checked={formData.email_general_announcements}
                      onChange={handleChange}
                      disabled={!formData.email_notifications}
                    />
                    <label className="form-check-label" htmlFor="email_general_announcements">
                      General Announcements
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-mobile-alt me-2"></i>
                  App Notifications
                </h5>
              </div>
              <div className="card-body">
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="in_app_notifications"
                    name="in_app_notifications"
                    checked={formData.in_app_notifications}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="in_app_notifications">
                    <strong>In-App Notifications</strong>
                    <br />
                    <small className="text-muted">Show notifications in the application</small>
                  </label>
                </div>

                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="push_notifications"
                    name="push_notifications"
                    checked={formData.push_notifications}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="push_notifications">
                    <strong>Push Notifications</strong>
                    <br />
                    <small className="text-muted">Browser push notifications</small>
                  </label>
                </div>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-moon me-2"></i>
                  Quiet Hours
                </h5>
              </div>
              <div className="card-body">
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="quiet_hours_enabled"
                    name="quiet_hours_enabled"
                    checked={formData.quiet_hours_enabled}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="quiet_hours_enabled">
                    <strong>Enable Quiet Hours</strong>
                    <br />
                    <small className="text-muted">Reduce notifications during specified hours</small>
                  </label>
                </div>

                {formData.quiet_hours_enabled && (
                  <div className="row">
                    <div className="col-6">
                      <label htmlFor="quiet_hours_start" className="form-label">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        id="quiet_hours_start"
                        name="quiet_hours_start"
                        value={formData.quiet_hours_start}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="quiet_hours_end" className="form-label">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        id="quiet_hours_end"
                        name="quiet_hours_end"
                        value={formData.quiet_hours_end}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationPreferences;