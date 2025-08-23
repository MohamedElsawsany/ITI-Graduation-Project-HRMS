// src/components/attendance/AttendanceReports.jsx
import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendance';
import LoadingSpinner from '../common/LoadingSpinner';

const AttendanceReports = () => {
  const [statistics, setStatistics] = useState(null);
  const [monthlySummaries, setMonthlySummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    start_date: (() => {
      const date = new Date();
      date.setDate(1); // First day of current month
      return date.toISOString().split('T')[0];
    })(),
    end_date: new Date().toISOString().split('T')[0]
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchStatistics();
    fetchMonthlySummaries();
  }, [dateRange, selectedMonth]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getAttendanceStatistics(
        dateRange.start_date, 
        dateRange.end_date
      );
      setStatistics(response);
    } catch (err) {
      setError('Failed to fetch attendance statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySummaries = async () => {
    try {
      const response = await attendanceService.getMonthlyAttendanceSummary(selectedMonth);
      setMonthlySummaries(response.results || []);
    } catch (err) {
      console.error('Failed to fetch monthly summaries:', err);
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleExportData = async () => {
    try {
      setExportLoading(true);
      const response = await attendanceService.exportAttendanceData(
        dateRange.start_date,
        dateRange.end_date
      );
      
      // Convert to CSV and download
      const csvContent = convertToCSV(response.data);
      downloadCSV(csvContent, `attendance-report-${dateRange.start_date}-to-${dateRange.end_date}.csv`);
    } catch (err) {
      setError('Failed to export attendance data');
    } finally {
      setExportLoading(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in CSV
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(','))
    ].join('\n');
    
    return csvContent;
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
        <h1>Attendance Reports</h1>
        <button 
          className="btn btn-primary"
          onClick={handleExportData}
          disabled={exportLoading}
        >
          {exportLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Exporting...
            </>
          ) : (
            <>
              <i className="fas fa-download me-2"></i>
              Export Data
            </>
          )}
        </button>
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

      {/* Date Range Filter */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Statistics Date Range</h5>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                name="start_date"
                value={dateRange.start_date}
                onChange={handleDateRangeChange}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                name="end_date"
                value={dateRange.end_date}
                onChange={handleDateRangeChange}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Monthly Summary</label>
              <select
                className="form-select"
                value={selectedMonth}
                onChange={handleMonthChange}
              >
                {generateMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      {statistics && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              Overall Statistics 
              <small className="text-muted ms-2">
                ({formatDate(statistics.date_range.start_date)} - {formatDate(statistics.date_range.end_date)})
              </small>
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-2 mb-3">
                <div className="card dashboard-card bg-primary text-white">
                  <div className="card-body text-center">
                    <h3 className="mb-1">{statistics.overall_statistics.total_days}</h3>
                    <small>Total Days</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="card dashboard-card bg-success text-white">
                  <div className="card-body text-center">
                    <h3 className="mb-1">{statistics.overall_statistics.total_present}</h3>
                    <small>Total Present</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="card dashboard-card bg-danger text-white">
                  <div className="card-body text-center">
                    <h3 className="mb-1">{statistics.overall_statistics.total_absent}</h3>
                    <small>Total Absent</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="card dashboard-card bg-warning text-white">
                  <div className="card-body text-center">
                    <h3 className="mb-1">{statistics.overall_statistics.total_late}</h3>
                    <small>Total Late</small>
                  </div>
                </div>
              </div>
              <div className="col-md-2 mb-3">
                <div className="card dashboard-card bg-info text-white">
                  <div className="card-body text-center">
                    <h3 className="mb-1">{statistics.overall_statistics.average_attendance_rate}%</h3>
                    <small>Avg Attendance</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Statistics */}
      {statistics && statistics.daily_statistics && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Daily Statistics</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Employees</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>On Leave</th>
                    <th>Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.daily_statistics.map((day, index) => (
                    <tr key={index}>
                      <td>
                        <div className="fw-bold">
                          {formatDate(day.date)}
                        </div>
                        <small className="text-muted">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </small>
                      </td>
                      <td>{day.total_employees}</td>
                      <td>
                        <span className="badge bg-success">
                          {day.present_count}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-danger">
                          {day.absent_count}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-warning">
                          {day.late_count}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {day.on_leave_count}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="progress me-2" style={{ width: '80px', height: '20px' }}>
                            <div 
                              className="progress-bar bg-success" 
                              role="progressbar" 
                              style={{ width: `${day.attendance_rate}%` }}
                            ></div>
                          </div>
                          <span className="fw-bold">{day.attendance_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Summary by Employee */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Monthly Summary by Employee
            <small className="text-muted ms-2">
              ({selectedMonth})
            </small>
          </h5>
        </div>
        <div className="card-body">
          {monthlySummaries.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-chart-bar fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">No monthly summary data</h5>
              <p className="text-muted">No summary data available for the selected month.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Total Days</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Total Hours</th>
                    <th>Overtime</th>
                    <th>Attendance %</th>
                    <th>Punctuality %</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummaries.map((summary) => (
                    <tr key={summary.id}>
                      <td>
                        <div className="fw-bold">
                          {summary.employee_details?.full_name}
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">
                          {summary.employee_details?.department_name}
                        </small>
                      </td>
                      <td>{summary.total_days}</td>
                      <td>
                        <span className="badge bg-success">
                          {summary.present_days}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-danger">
                          {summary.absent_days}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-warning">
                          {summary.late_days}
                        </span>
                      </td>
                      <td>{summary.total_work_hours} hrs</td>
                      <td>
                        {summary.total_overtime_hours > 0 ? (
                          <span className="text-warning fw-bold">
                            {summary.total_overtime_hours} hrs
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="progress me-2" style={{ width: '60px', height: '15px' }}>
                            <div 
                              className="progress-bar bg-success" 
                              role="progressbar" 
                              style={{ width: `${summary.attendance_percentage}%` }}
                            ></div>
                          </div>
                          <span className="small">{summary.attendance_percentage}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="progress me-2" style={{ width: '60px', height: '15px' }}>
                            <div 
                              className="progress-bar bg-primary" 
                              role="progressbar" 
                              style={{ width: `${summary.punctuality_percentage}%` }}
                            ></div>
                          </div>
                          <span className="small">{summary.punctuality_percentage}%</span>
                        </div>
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

export default AttendanceReports;