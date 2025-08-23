// src/components/attendance/AttendanceList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendance';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';

const AttendanceList = () => {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: '',
    employee: '',
    department: ''
  });

  useEffect(() => {
    fetchAttendances();
  }, [currentPage, filters]);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      const response = await attendanceService.getAttendances(currentPage, cleanFilters);
      setAttendances(response.results || []);
      setTotalPages(Math.ceil(response.count / 10));
      setTotalCount(response.count);
    } catch (err) {
      setError('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      status: '',
      employee: '',
      department: ''
    });
    setCurrentPage(1);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
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

  const handleDeleteAttendance = async (id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await attendanceService.deleteAttendance(id);
        fetchAttendances(); // Refresh the list
      } catch (err) {
        setError('Failed to delete attendance record');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Attendance Records</h1>
        {(user?.role === 'admin' || user?.role === 'hr') && (
          <div>
            <Link to="/attendance/create" className="btn btn-primary me-2">
              <i className="fas fa-plus me-2"></i>
              Add Attendance
            </Link>
            <Link to="/attendance/bulk-create" className="btn btn-outline-primary">
              <i className="fas fa-upload me-2"></i>
              Bulk Import
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Status</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="Half Day">Half Day</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Filter By</label>
              <select
                className="form-select"
                name="checked_in"
                value={filters.checked_in || ''}
                onChange={handleFilterChange}
              >
                <option value="">All Records</option>
                <option value="true">Currently Checked In</option>
                <option value="false">Completed Day</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button 
                type="button" 
                className="btn btn-outline-secondary w-100"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <div className="card-body">
          {attendances.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No attendance records found</h5>
              <p className="text-muted">Try adjusting your filters or add new attendance records.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>Total Hours</th>
                      <th>Overtime</th>
                      {(user?.role === 'admin' || user?.role === 'hr') && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.map((attendance) => (
                      <tr key={attendance.id}>
                        <td>
                          <div>
                            <div className="fw-bold">
                              {attendance.employee_details?.full_name}
                            </div>
                            <small className="text-muted">
                              {attendance.employee_details?.department_name}
                            </small>
                          </div>
                        </td>
                        <td>{formatDate(attendance.date)}</td>
                        <td>
                          <span className={attendance.check_in_time ? 'text-success fw-bold' : 'text-muted'}>
                            {formatTime(attendance.check_in_time)}
                          </span>
                        </td>
                        <td>
                          <span className={attendance.check_out_time ? 'text-danger fw-bold' : 'text-muted'}>
                            {formatTime(attendance.check_out_time)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(attendance.status)}`}>
                            {attendance.status}
                          </span>
                        </td>
                        <td>
                          {attendance.total_hours ? `${attendance.total_hours} hrs` : '--'}
                        </td>
                        <td>
                          {attendance.overtime_hours > 0 ? (
                            <span className="text-warning fw-bold">
                              {attendance.overtime_hours} hrs
                            </span>
                          ) : (
                            '--'
                          )}
                        </td>
                        {(user?.role === 'admin' || user?.role === 'hr') && (
                          <td>
                            <div className="btn-group btn-group-sm">
                              <Link
                                to={`/attendance/${attendance.id}`}
                                className="btn btn-outline-primary"
                                title="View Details"
                              >
                                <i className="fas fa-eye"></i>
                              </Link>
                              <Link
                                to={`/attendance/${attendance.id}/edit`}
                                className="btn btn-outline-warning"
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </Link>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteAttendance(attendance.id)}
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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

export default AttendanceList;