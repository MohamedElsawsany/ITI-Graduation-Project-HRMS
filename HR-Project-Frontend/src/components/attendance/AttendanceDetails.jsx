// src/components/attendance/AttendanceDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendance';
import LoadingSpinner from '../common/LoadingSpinner';

const AttendanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, [id]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getAttendance(id);
      setAttendance(response);
    } catch (err) {
      setError('Failed to fetch attendance details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await attendanceService.deleteAttendance(id);
        navigate('/attendance/list', { 
          state: { message: 'Attendance record deleted successfully' }
        });
      } catch (err) {
        setError('Failed to delete attendance record');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '--';
    const dateTime = new Date(dateTimeString);
    return dateTime.toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'Present': 'bg-success',
      'Late': 'bg-warning',
      'Absent': 'bg-danger',
      'Half Day': 'bg-info',
      'On Leave': 'bg-secondary'
    };
    return statusClasses[status] || 'bg-secondary';
  };

  const calculateWorkDuration = () => {
    if (!attendance?.check_in_time || !attendance?.check_out_time) return null;
    
    const checkIn = new Date(`2000-01-01T${attendance.check_in_time}`);
    const checkOut = new Date(`2000-01-01T${attendance.check_out_time}`);
    const diffMs = checkOut - checkIn;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    const hours = Math.floor(diffHours);
    const minutes = Math.floor((diffHours - hours) * 60);
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="alert alert-warning">
        Attendance record not found.
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Attendance Details</h1>
        <div className="d-flex gap-2">
          <button 
            type="button" 
            className="btn btn-outline-secondary"
            onClick={() => navigate('/attendance/list')}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to List
          </button>
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <>
              <Link
                to={`/attendance/${id}/edit`}
                className="btn btn-warning"
              >
                <i className="fas fa-edit me-2"></i>
                Edit
              </Link>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
              >
                <i className="fas fa-trash me-2"></i>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Attendance Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-4">
                  <h6 className="text-muted mb-2">Employee Information</h6>
                  <div className="border rounded p-3">
                    <h5 className="mb-1">{attendance.employee_details?.full_name}</h5>
                    <p className="text-muted mb-1">
                      <i className="fas fa-building me-2"></i>
                      {attendance.employee_details?.department_name}
                    </p>
                    <p className="text-muted mb-0">
                      <i className="fas fa-briefcase me-2"></i>
                      {attendance.employee_details?.job_title_name}
                    </p>
                  </div>
                </div>

                <div className="col-md-6 mb-4">
                  <h6 className="text-muted mb-2">Date & Status</h6>
                  <div className="border rounded p-3">
                    <h5 className="mb-2">{formatDate(attendance.date)}</h5>
                    <span className={`badge ${getStatusBadgeClass(attendance.status)} fs-6`}>
                      {attendance.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-3 mb-4">
                  <h6 className="text-muted mb-2">Check In Time</h6>
                  <div className="border rounded p-3 text-center">
                    <h4 className={attendance.check_in_time ? 'text-success' : 'text-muted'}>
                      {formatTime(attendance.check_in_time)}
                    </h4>
                    <small className="text-muted">
                      {attendance.check_in_time ? 'Checked In' : 'Not Checked In'}
                    </small>
                  </div>
                </div>

                <div className="col-md-3 mb-4">
                  <h6 className="text-muted mb-2">Check Out Time</h6>
                  <div className="border rounded p-3 text-center">
                    <h4 className={attendance.check_out_time ? 'text-danger' : 'text-muted'}>
                      {formatTime(attendance.check_out_time)}
                    </h4>
                    <small className="text-muted">
                      {attendance.check_out_time ? 'Checked Out' : 'Not Checked Out'}
                    </small>
                  </div>
                </div>

                <div className="col-md-3 mb-4">
                  <h6 className="text-muted mb-2">Total Work Hours</h6>
                  <div className="border rounded p-3 text-center">
                    <h4 className="text-primary">
                      {attendance.total_hours || '0'} hrs
                    </h4>
                    <small className="text-muted">
                      {attendance.duration_text || calculateWorkDuration() || 'Not calculated'}
                    </small>
                  </div>
                </div>

                <div className="col-md-3 mb-4">
                  <h6 className="text-muted mb-2">Overtime Hours</h6>
                  <div className="border rounded p-3 text-center">
                    <h4 className={attendance.overtime_hours > 0 ? 'text-warning' : 'text-muted'}>
                      {attendance.overtime_hours || '0'} hrs
                    </h4>
                    <small className="text-muted">
                      {attendance.overtime_hours > 0 ? 'Overtime Earned' : 'No Overtime'}
                    </small>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <h6 className="text-muted mb-2">Break Duration</h6>
                  <div className="border rounded p-3">
                    <span className="fs-5">{attendance.break_duration || '0'} hours</span>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <h6 className="text-muted mb-2">Record Type</h6>
                  <div className="border rounded p-3">
                    <span className={`badge ${attendance.is_manual_entry ? 'bg-warning' : 'bg-info'} fs-6`}>
                      {attendance.is_manual_entry ? 'Manual Entry' : 'System Entry'}
                    </span>
                  </div>
                </div>
              </div>

              {attendance.notes && (
                <div className="row">
                  <div className="col-12 mb-3">
                    <h6 className="text-muted mb-2">Notes</h6>
                    <div className="border rounded p-3">
                      <p className="mb-0">{attendance.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Record Metadata</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label text-muted">Record Status</label>
                <div>
                  {attendance.is_checked_in ? (
                    <span className="badge bg-success">Currently Checked In</span>
                  ) : attendance.is_completed ? (
                    <span className="badge bg-info">Day Completed</span>
                  ) : (
                    <span className="badge bg-secondary">Incomplete</span>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted">Created At</label>
                <div className="fw-bold">
                  {formatDateTime(attendance.created_at)}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted">Last Updated</label>
                <div className="fw-bold">
                  {formatDateTime(attendance.updated_at)}
                </div>
              </div>

              {attendance.created_by_name && (
                <div className="mb-3">
                  <label className="form-label text-muted">Created By</label>
                  <div className="fw-bold">
                    {attendance.created_by_name}
                  </div>
                </div>
              )}

              <div className="alert alert-info">
                <h6 className="alert-heading">Quick Info</h6>
                <ul className="mb-0 small">
                  <li>Total hours include break deductions</li>
                  <li>Overtime calculated if hours 8</li>
                  <li>Status may be auto-determined</li>
                  <li>All times are in local timezone</li>
                </ul>
              </div>
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'hr') && (
            <div className="card mt-3">
              <div className="card-header">
                <h6 className="mb-0">Quick Actions</h6>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <Link
                    to={`/attendance/${id}/edit`}
                    className="btn btn-outline-warning btn-sm"
                  >
                    <i className="fas fa-edit me-2"></i>
                    Edit Record
                  </Link>
                  <Link
                    to="/attendance/create"
                    className="btn btn-outline-success btn-sm"
                  >
                    <i className="fas fa-plus me-2"></i>
                    Create New Record
                  </Link>
                  <Link
                    to="/attendance/list"
                    className="btn btn-outline-primary btn-sm"
                  >
                    <i className="fas fa-list me-2"></i>
                    View All Records
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetails;