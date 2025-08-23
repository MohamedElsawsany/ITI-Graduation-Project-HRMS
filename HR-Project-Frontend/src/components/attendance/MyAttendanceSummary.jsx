// src/components/attendance/MyAttendanceSummary.jsx
import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendance';
import LoadingSpinner from '../common/LoadingSpinner';

const MyAttendanceSummary = () => {
  const [summary, setSummary] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchMonthlySummary();
    fetchMonthlyAttendances();
  }, [selectedMonth]);

  const fetchMonthlySummary = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getMyMonthlySummary(selectedMonth);
      setSummary(response);
    } catch (err) {
      setError('Failed to fetch monthly summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyAttendances = async () => {
    try {
      const [year, month] = selectedMonth.split('-');
      const response = await attendanceService.getAttendances(1, { month: selectedMonth });
      setAttendances(response.results || []);
    } catch (err) {
      console.error('Failed to fetch monthly attendances:', err);
    }
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    // Generate options for current and previous 11 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Attendance Summary</h1>
        <div className="d-flex align-items-center gap-3">
          <label className="form-label mb-0">Select Month:</label>
          <select
            className="form-select"
            value={selectedMonth}
            onChange={handleMonthChange}
            style={{ width: 'auto' }}
          >
            {generateMonthOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
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

      {summary && (
        <>
          {/* Summary Statistics */}
          <div className="row mb-4">
            <div className="col-md-2 mb-3">
              <div className="card dashboard-card bg-primary text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{summary.total_days}</h3>
                  <small>Total Days</small>
                </div>
              </div>
            </div>
            <div className="col-md-2 mb-3">
              <div className="card dashboard-card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{summary.present_days}</h3>
                  <small>Present</small>
                </div>
              </div>
            </div>
            <div className="col-md-2 mb-3">
              <div className="card dashboard-card bg-warning text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{summary.late_days}</h3>
                  <small>Late</small>
                </div>
              </div>
            </div>
            <div className="col-md-2 mb-3">
              <div className="card dashboard-card bg-danger text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{summary.absent_days}</h3>
                  <small>Absent</small>
                </div>
              </div>
            </div>
            <div className="col-md-2 mb-3">
              <div className="card dashboard-card bg-info text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{summary.half_days}</h3>
                  <small>Half Days</small>
                </div>
              </div>
            </div>
            <div className="col-md-2 mb-3">
              <div className="card dashboard-card bg-secondary text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{summary.leave_days}</h3>
                  <small>Leave Days</small>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Work Hours Summary</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <h4 className="text-primary mb-1">{summary.total_work_hours}</h4>
                        <small className="text-muted">Total Work Hours</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <h4 className="text-warning mb-1">{summary.total_overtime_hours}</h4>
                        <small className="text-muted">Overtime Hours</small>
                      </div>
                    </div>
                  </div>
                  <div className="row mt-3">
                    <div className="col-12">
                      <div className="text-center p-3 border rounded">
                        <h4 className="text-info mb-1">{summary.average_hours_per_day}</h4>
                        <small className="text-muted">Average Hours/Day</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Performance Metrics</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <h4 className="text-success mb-1">{summary.attendance_percentage}%</h4>
                        <small className="text-muted">Attendance Rate</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <h4 className="text-primary mb-1">{summary.punctuality_percentage}%</h4>
                        <small className="text-muted">Punctuality Rate</small>
                      </div>
                    </div>
                  </div>
                  <div className="row mt-3">
                    <div className="col-12">
                      <div className="progress" style={{ height: '20px' }}>
                        <div 
                          className="progress-bar bg-success" 
                          role="progressbar" 
                          style={{ width: `${summary.attendance_percentage}%` }}
                          aria-valuenow={summary.attendance_percentage}
                          aria-valuemin="0" 
                          aria-valuemax="100"
                        >
                          {summary.attendance_percentage}%
                        </div>
                      </div>
                      <small className="text-muted">Overall Performance</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Monthly Attendance Records */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Monthly Attendance Records</h5>
        </div>
        <div className="card-body">
          {attendances.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No attendance records found</h5>
              <p className="text-muted">No records found for the selected month.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                    <th>Total Hours</th>
                    <th>Overtime</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((attendance) => (
                    <tr key={attendance.id}>
                      <td>
                        <div className="fw-bold">
                          {formatDate(attendance.date)}
                        </div>
                        <small className="text-muted">
                          {new Date(attendance.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </small>
                      </td>
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
                      <td>
                        {attendance.notes ? (
                          <span 
                            className="text-truncate d-inline-block" 
                            style={{ maxWidth: '150px' }}
                            title={attendance.notes}
                          >
                            {attendance.notes}
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAttendanceSummary;