import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaves';
import { LEAVE_TYPES } from '../../utils/constants';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';

const MyLeaveRequests = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    fetchMyLeaveRequests();
  }, [currentPage]);

  const fetchMyLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getMyLeaveRequests(currentPage);
      setLeaveRequests(response.results || response.data);
      setTotalPages(Math.ceil(response.count / 10));
      setTotalCount(response.count);
    } catch (err) {
      setError('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await leaveService.createLeaveRequest(formData);
      setShowModal(false);
      setFormData({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
      });
      fetchMyLeaveRequests();
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await leaveService.deleteLeaveRequest(id);
        fetchMyLeaveRequests();
      } catch (err) {
        setError('Failed to delete leave request');
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-success';
      case 'Rejected':
        return 'bg-danger';
      case 'Pending':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Leave Requests</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <i className="fas fa-plus me-2"></i>
          Request Leave
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Request Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <span className={`badge ${
                            request.leave_type === 'Annual' ? 'bg-info' :
                            request.leave_type === 'Sick' ? 'bg-warning' :
                            request.leave_type === 'Maternity' ? 'bg-success' : 'bg-secondary'
                          }`}>
                            {request.leave_type}
                          </span>
                        </td>
                        <td>{new Date(request.start_date).toLocaleDateString()}</td>
                        <td>{new Date(request.end_date).toLocaleDateString()}</td>
                        <td>{request.days_requested}</td>
                        <td>
                          <div style={{ maxWidth: '200px' }}>
                            {request.reason.length > 50 
                              ? `${request.reason.substring(0, 50)}...` 
                              : request.reason
                            }
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td>{new Date(request.request_date).toLocaleDateString()}</td>
                        <td>
                          {request.status === 'Pending' && (
                            <button
                              onClick={() => handleDelete(request.id)}
                              className="btn btn-outline-danger btn-sm"
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                          {request.status !== 'Pending' && request.approved_by_name && (
                            <small className="text-muted">
                              by {request.approved_by_name}
                            </small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {leaveRequests.length === 0 && (
                <div className="text-center py-4">
                  <i className="fas fa-calendar-check fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No leave requests found.</p>
                </div>
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalCount}
                itemsPerPage={10}
              />
            </>
          )}
        </div>
      </div>

      {/* Create Leave Request Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Request Leave</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Leave Type *</label>
                    <select
                      className="form-select"
                      value={formData.leave_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, leave_type: e.target.value }))}
                      required
                    >
                      <option value="">Select Leave Type</option>
                      {LEAVE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">End Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="alert alert-info">
                    <small>
                      <i className="fas fa-info-circle me-1"></i>
                      Maximum 21 days per request. Leave requests cannot exceed your annual leave balance.
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeaveRequests;