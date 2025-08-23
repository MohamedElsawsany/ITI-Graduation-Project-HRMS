// src/components/attendance/AttendanceDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendance';
import LoadingSpinner from '../common/LoadingSpinner';

const AttendanceDashboard = () => {
  const { user } = useAuth();
  const [todayOverview, setTodayOverview] = useState(null);
  const [myTodayAttendance, setMyTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const promises = [];

      // Get my today attendance for all users
      promises.push(attendanceService.getMyTodayAttendance());

      // Get today overview for admin/hr
      if (user?.role === 'admin' || user?.role === 'hr') {
        promises.push(attendanceService.getTodayAttendanceOverview());
      }

      const results = await Promise.allSettled(promises);
      
      setMyTodayAttendance(results[0].status === 'fulfilled' ? results[0].value : null);
      
      if (results.length > 1 && results[1].status === 'fulfilled') {
        setTodayOverview(results[1].value);
      }
    } catch (err) {
      setError('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setCheckInLoading(true);
      await attendanceService.checkIn();
      await fetchDashboardData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckOutLoading(true);
      await attendanceService.checkOut();
      await fetchDashboardData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check out');
    } finally {
      setCheckOutLoading(false);
    }
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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Attendance Dashboard</h1>
        <div className="text-muted">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
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

      {/* My Today's Attendance */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-clock me-2"></i>
                My Today's Attendance
              </h5>
            </div>
            <div className="card-body">
              {myTodayAttendance && myTodayAttendance.id ? (
                <div className="row">
                  <div className="col-md-3">
                    <div className="text-center p-3 border rounded">
                      <h6 className="text-muted mb-1">Check In</h6>
                      <h4 className={myTodayAttendance.check_in_time ? 'text-success' : 'text-muted'}>
                        {formatTime(myTodayAttendance.check_in_time)}
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3 border rounded">
                      <h6 className="text-muted mb-1">Check Out</h6>
                      <h4 className={myTodayAttendance.check_out_time ? 'text-danger' : 'text-muted'}>
                        {formatTime(myTodayAttendance.check_out_time)}
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="text-center p-3 border rounded">
                      <h6 className="text-muted mb-1">Status</h6>
                      <span className={`badge ${getStatusBadgeClass(myTodayAttendance.status)}`}>
                        {myTodayAttendance.status}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="text-center p-3 border rounded">
                      <h6 className="text-muted mb-1">Hours</h6>
                      <h6 className="mb-0">
                        {myTodayAttendance.current_work_hours || myTodayAttendance.total_hours || '0'} hrs
                      </h6>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="text-center p-3">
                      {!myTodayAttendance.check_in_time ? (
                        <button 
                          className="btn btn-success w-100"
                          onClick={handleCheckIn}
                          disabled={checkInLoading}
                        >
                          {checkInLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Checking In...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-sign-in-alt me-2"></i>
                              Check In
                            </>
                          )}
                        </button>
                      ) : !myTodayAttendance.check_out_time ? (
                        <button 
                          className="btn btn-danger w-100"
                          onClick={handleCheckOut}
                          disabled={checkOutLoading}
                        >
                          {checkOutLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Checking Out...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-sign-out-alt me-2"></i>
                              Check Out
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="badge bg-success">Day Complete</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">You haven't checked in yet today</p>
                  <button 
                    className="btn btn-success btn-lg"
                    onClick={handleCheckIn}
                    disabled={checkInLoading}
                  >
                    {checkInLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Checking In...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Check In Now
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Overview (Admin/HR Only) */}
      {(user?.role === 'admin' || user?.role === 'hr') && todayOverview && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  Today's Attendance Overview
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-2 mb-3">
                    <div className="card dashboard-card bg-primary text-white">
                      <div className="card-body text-center">
                        <h3 className="mb-1">{todayOverview.total_employees}</h3>
                        <small>Total Employees</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="card dashboard-card bg-success text-white">
                      <div className="card-body text-center">
                        <h3 className="mb-1">{todayOverview.present_count}</h3>
                        <small>Present</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="card dashboard-card bg-warning text-white">
                      <div className="card-body text-center">
                        <h3 className="mb-1">{todayOverview.late_count}</h3>
                        <small>Late</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="card dashboard-card bg-danger text-white">
                      <div className="card-body text-center">
                        <h3 className="mb-1">{todayOverview.absent_count}</h3>
                        <small>Absent</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="card dashboard-card bg-info text-white">
                      <div className="card-body text-center">
                        <h3 className="mb-1">{todayOverview.currently_checked_in}</h3>
                        <small>Checked In</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-2 mb-3">
                    <div className="card dashboard-card bg-secondary text-white">
                      <div className="card-body text-center">
                        <h3 className="mb-1">{todayOverview.attendance_rate}%</h3>
                        <small>Attendance Rate</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3 mb-3">
                  <a href="/attendance/list" className="btn btn-outline-primary w-100">
                    <i className="fas fa-list me-2"></i>
                    View Attendance Records
                  </a>
                </div>
                <div className="col-md-3 mb-3">
                  <a href="/attendance/my-summary" className="btn btn-outline-info w-100">
                    <i className="fas fa-chart-line me-2"></i>
                    My Monthly Summary
                  </a>
                </div>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                  <>
                    <div className="col-md-3 mb-3">
                      <a href="/attendance/create" className="btn btn-outline-success w-100">
                        <i className="fas fa-plus me-2"></i>
                        Add Attendance
                      </a>
                    </div>
                    <div className="col-md-3 mb-3">
                      <a href="/attendance/reports" className="btn btn-outline-warning w-100">
                        <i className="fas fa-chart-bar me-2"></i>
                        Reports
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;