// src/components/leaves/LeaveRequestCreate.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveService } from '../../services/leaves';
import { LEAVE_TYPES } from '../../utils/constants';

const LeaveRequestCreate = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

  // Calculate number of days between dates
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
    return daysDiff > 0 ? daysDiff : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Basic validation
    const days = calculateDays(formData.start_date, formData.end_date);
    if (days <= 0) {
      setError('End date must be after start date');
      setSubmitting(false);
      return;
    }

    if (days > 21) {
      setError('Maximum 21 days per request');
      setSubmitting(false);
      return;
    }

    // Check if start date is in the past (except today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.start_date);
    
    if (startDate < today) {
      setError('Start date cannot be in the past');
      setSubmitting(false);
      return;
    }

    try {
      await leaveService.createLeaveRequest(formData);
      navigate('/my-leave-requests');
    } catch (err) {
      if (err.response?.data) {
        const errorMessages = Object.values(err.response.data).flat().join(', ');
        setError(errorMessages);
      } else {
        setError('Failed to create leave request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const requestedDays = calculateDays(formData.start_date, formData.end_date);

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <button
          onClick={() => navigate('/my-leave-requests')}
          className="btn btn-outline-secondary me-3"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Request Leave</h1>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Leave Type *</label>
                  <select
                    name="leave_type"
                    className="form-select"
                    value={formData.leave_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {LEAVE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Choose the type of leave you want to request
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      name="start_date"
                      className="form-control"
                      value={formData.start_date}
                      onChange={handleChange}
                      min={getTodayDate()}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">End Date *</label>
                    <input
                      type="date"
                      name="end_date"
                      className="form-control"
                      value={formData.end_date}
                      onChange={handleChange}
                      min={formData.start_date || getTodayDate()}
                      required
                    />
                  </div>
                </div>

                {requestedDays > 0 && (
                  <div className="alert alert-info mb-3">
                    <i className="fas fa-calendar-alt me-2"></i>
                    <strong>Duration:</strong> {requestedDays} day{requestedDays !== 1 ? 's' : ''}
                    {requestedDays > 21 && (
                      <div className="text-danger mt-1">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Exceeds maximum of 21 days per request
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-4">
                  <label className="form-label">Reason *</label>
                  <textarea
                    name="reason"
                    className="form-control"
                    rows="4"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    placeholder="Please provide a detailed reason for your leave request..."
                    maxLength={500}
                  />
                  <div className="form-text">
                    {formData.reason.length}/500 characters
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || requestedDays > 21 || requestedDays <= 0}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Submit Request
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/my-leave-requests')}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h6 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Leave Request Guidelines
              </h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Maximum 21 days per request
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Requests cannot exceed your annual leave balance
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Start date cannot be in the past
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Provide detailed reason for your request
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Manager approval required
                </li>
              </ul>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header">
              <h6 className="card-title mb-0">
                <i className="fas fa-calendar-check me-2"></i>
                Leave Types
              </h6>
            </div>
            <div className="card-body">
              <div className="row g-2">
                <div className="col-6">
                  <span className="badge bg-info w-100">Annual</span>
                </div>
                <div className="col-6">
                  <span className="badge bg-warning w-100">Sick</span>
                </div>
                <div className="col-6">
                  <span className="badge bg-success w-100">Maternity</span>
                </div>
                <div className="col-6">
                  <span className="badge bg-secondary w-100">Emergency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestCreate;