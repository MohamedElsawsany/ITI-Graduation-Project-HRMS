import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaves';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';

const LeaveRequestList = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLeaveRequests();
  }, [currentPage, filter]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      let response;

      switch (filter) {
        case 'pending':
          response = await leaveService.getPendingLeaveRequests(currentPage);
          break;
        case 'approved':
          response = await leaveService.getApprovedLeaveRequests(currentPage);
          break;
        case 'rejected':
          response = await leaveService.getRejectedLeaveRequests(currentPage);
          break;
        default:
          response = await leaveService.getAllLeaveRequests(currentPage);
      }

      setLeaveRequests(response.results || response.data);
      setTotalPages(Math.ceil(response.count / 10));
      setTotalCount(response.count);
    } catch (err) {
      setError('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (id, status) => {
    if (window.confirm(`Are you sure you want to ${status.toLowerCase()} this leave request?`)) {
      try {
        await leaveService.approveRejectLeaveRequest(id, status);
        fetchLeaveRequests();
      } catch (err) {
        setError(`Failed to ${status.toLowerCase()} leave request`);
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

  if (loading && leaveRequests.length === 0) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Leave Requests</h1>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => {
                setFilter('all');
                setCurrentPage(1);
              }}
            >
              All Requests
            </button>
            <button
              type="button"
              className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => {
                setFilter('pending');
                setCurrentPage(1);
              }}
            >
              Pending
            </button>
            <button
              type="button"
              className={`btn ${filter === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => {
                setFilter('approved');
                setCurrentPage(1);
              }}
            >
              Approved
            </button>
            <button
              type="button"
              className={`btn ${filter === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => {
                setFilter('rejected');
                setCurrentPage(1);
              }}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

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
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Status</th>
                      <th>Request Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <div>
                            <div className="fw-medium">{request.employee_details?.full_name}</div>
                            <small className="text-muted">
                              Balance: {request.employee_details?.annual_leave_balance} days
                            </small>
                          </div>
                        </td>
                        <td>{request.employee_details?.department_name}</td>
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
                          <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td>{new Date(request.request_date).toLocaleDateString()}</td>
                        <td>
                          {request.status === 'Pending' && (
                            <div className="btn-group btn-group-sm">
                              <button
                                onClick={() => handleApproveReject(request.id, 'Approved')}
                                className="btn btn-outline-success"
                                title="Approve"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                onClick={() => handleApproveReject(request.id, 'Rejected')}
                                className="btn btn-outline-danger"
                                title="Reject"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
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
                  <i className="fas fa-calendar-alt fa-3x text-muted mb-3"></i>
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
    </div>
  );
};

export default LeaveRequestList;