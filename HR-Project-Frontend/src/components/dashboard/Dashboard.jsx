import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import LoadingSpinner from "../common/LoadingSpinner";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [leaveStats, setLeaveStats] = useState(null);
  const [payrollStats, setPayrollStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(""); // Clear any previous errors

      // Only fetch basic stats for admin/HR users
      if (user?.role === "admin" || user?.role === "hr") {
        try {
          // Fetch basic stats
          const statsResponse = await api.get("/dashboard/stats/");
          setStats(statsResponse.data);
        } catch (err) {
          console.error("Stats error:", err);
          // Don't set error for regular employees, just log it
        }

        // Fetch additional stats for admin/HR
        // Attendance stats
        try {
          const attendanceResponse = await api.get(
            "/attendance/today-overview/"
          );
          setAttendanceStats(attendanceResponse.data);
        } catch (err) {
          console.log("Attendance stats not available");
        }

        // Leave stats
        try {
          const leaveResponse = await api.get("/leaves/stats/");
          setLeaveStats(leaveResponse.data);
        } catch (err) {
          console.log("Leave stats not available");
        }

        // Payroll stats
        try {
          const payrollResponse = await api.get("/payrolls/summary/");
          setPayrollStats(payrollResponse.data);
        } catch (err) {
          console.log("Payroll stats not available");
        }

        // Recent activities
        try {
          const activitiesResponse = await api.get(
            "/dashboard/recent-activities/"
          );
          setRecentActivities(activitiesResponse.data);
        } catch (err) {
          console.log("Recent activities not available");
        }
      }
    } catch (err) {
      // Only show error for admin/HR users who should have access to dashboard stats
      if (user?.role === "admin" || user?.role === "hr") {
        setError("Failed to fetch dashboard data");
      }
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted mb-0">Welcome back, {user?.username}!</p>
        </div>
        <div className="text-end">
          <small className="text-muted">
            Last updated: {new Date().toLocaleString()}
          </small>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Main Statistics Cards - Only for Admin/HR */}
      {(user?.role === "admin" || user?.role === "hr") && stats && (
        <>
          {/* Primary Stats Row */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card dashboard-card bg-primary text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h2 className="mb-0">{stats.total_employees}</h2>
                      <p className="mb-1">Total Employees</p>
                      <small className="opacity-75">
                        {stats.active_employees} active
                      </small>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-users fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card dashboard-card bg-success text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h2 className="mb-0">
                        {attendanceStats?.present_today || 0}
                      </h2>
                      <p className="mb-1">Present Today</p>
                      <small className="opacity-75">
                        {formatPercentage(attendanceStats?.attendance_rate)}{" "}
                        rate
                      </small>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-user-check fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card dashboard-card bg-warning text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h2 className="mb-0">
                        {leaveStats?.pending_requests || 0}
                      </h2>
                      <p className="mb-1">Pending Leaves</p>
                      <small className="opacity-75">
                        {leaveStats?.total_requests || 0} total requests
                      </small>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-calendar-times fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card dashboard-card bg-info text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h2 className="mb-0">{stats.total_departments}</h2>
                      <p className="mb-1">Departments</p>
                      <small className="opacity-75">
                        {stats.total_job_titles} job titles
                      </small>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-building fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Stats Row */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card dashboard-card bg-danger text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">
                        {attendanceStats?.absent_today || 0}
                      </h3>
                      <p className="mb-1">Absent Today</p>
                      <small className="opacity-75">
                        {attendanceStats?.late_arrivals || 0} late arrivals
                      </small>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-user-times fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card dashboard-card bg-dark text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">
                        {formatCurrency(payrollStats?.current_month_total)}
                      </h3>
                      <p className="mb-1">Monthly Payroll</p>
                      <small className="opacity-75">
                        {payrollStats?.processed_count || 0} processed
                      </small>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-dollar-sign fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card dashboard-card bg-secondary text-white h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">
                        {leaveStats?.approved_this_month || 0}
                      </h3>
                      <p className="mb-1">Approved Leaves</p>
                      <small className="opacity-75">This month</small>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-calendar-check fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card dashboard-card bg-light text-dark h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">{stats.inactive_employees || 0}</h3>
                      <p className="mb-1">Inactive Employees</p>
                      <small className="text-muted">Require attention</small>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-user-slash fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Employee Welcome Section - Show for regular employees */}
      {user?.role === "employee" && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card bg-primary text-white">
              <div className="card-body text-center py-4">
                <h2 className="mb-3">
                  <i className="fas fa-user-circle fa-3x mb-3"></i>
                  <br />
                  Welcome to Your Dashboard
                </h2>
                <p className="mb-0 lead">
                  Access your attendance, leave requests, and payroll information using the quick actions below.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-bolt me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Admin/HR Quick Actions */}
                {(user?.role === "admin" || user?.role === "hr") && (
                  <>
                    <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                      <a
                        href="/employees/create"
                        className="btn btn-outline-success w-100 h-100 d-flex flex-column justify-content-center"
                      >
                        <i className="fas fa-user-plus fa-2x mb-2"></i>
                        <span>Add Employee</span>
                      </a>
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                      <a
                        href="/employees"
                        className="btn btn-outline-primary w-100 h-100 d-flex flex-column justify-content-center"
                      >
                        <i className="fas fa-users fa-2x mb-2"></i>
                        <span>Manage Employees</span>
                      </a>
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                      <a
                        href="/leave-requests"
                        className="btn btn-outline-warning w-100 h-100 d-flex flex-column justify-content-center"
                      >
                        <i className="fas fa-calendar-alt fa-2x mb-2"></i>
                        <span>Leave Requests</span>
                      </a>
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                      <a
                        href="/payrolls"
                        className="btn btn-outline-info w-100 h-100 d-flex flex-column justify-content-center"
                      >
                        <i className="fas fa-money-bill-wave fa-2x mb-2"></i>
                        <span>Payroll</span>
                      </a>
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                      <a
                        href="/attendance/list"
                        className="btn btn-outline-secondary w-100 h-100 d-flex flex-column justify-content-center"
                      >
                        <i className="fas fa-clock fa-2x mb-2"></i>
                        <span>Attendance</span>
                      </a>
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                      <a
                        href="/departments"
                        className="btn btn-outline-dark w-100 h-100 d-flex flex-column justify-content-center"
                      >
                        <i className="fas fa-building fa-2x mb-2"></i>
                        <span>Departments</span>
                      </a>
                    </div>
                  </>
                )}

                {/* Employee Quick Actions */}
                <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                  <a
                    href="/my-leave-requests"
                    className="btn btn-outline-info w-100 h-100 d-flex flex-column justify-content-center"
                  >
                    <i className="fas fa-calendar-check fa-2x mb-2"></i>
                    <span>My Leaves</span>
                  </a>
                </div>
                <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                  <a
                    href="/my-payrolls"
                    className="btn btn-outline-success w-100 h-100 d-flex flex-column justify-content-center"
                  >
                    <i className="fas fa-receipt fa-2x mb-2"></i>
                    <span>My Payslips</span>
                  </a>
                </div>
                <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                  <a
                    href="/attendance/my-summary"
                    className="btn btn-outline-primary w-100 h-100 d-flex flex-column justify-content-center"
                  >
                    <i className="fas fa-chart-line fa-2x mb-2"></i>
                    <span>My Attendance</span>
                  </a>
                </div>
                <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                  <a
                    href="/attendance"
                    className="btn btn-outline-danger w-100 h-100 d-flex flex-column justify-content-center"
                  >
                    <i className="fas fa-fingerprint fa-2x mb-2"></i>
                    <span>Check In/Out</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities for Admin/HR */}
      {(user?.role === "admin" || user?.role === "hr") && (
        <div className="row">
          <div className="col-md-8 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-history me-2"></i>
                  Recent Activities
                </h5>
              </div>
              <div className="card-body">
                {recentActivities.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {recentActivities.slice(0, 5).map((activity, index) => (
                      <div
                        key={index}
                        className="list-group-item border-0 px-0"
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{activity.title}</h6>
                            <p className="mb-1 text-muted">
                              {activity.description}
                            </p>
                            <small className="text-muted">
                              {activity.timestamp}
                            </small>
                          </div>
                          <span
                            className={`badge bg-${
                              activity.type === "success"
                                ? "success"
                                : activity.type === "warning"
                                ? "warning"
                                : "primary"
                            }`}
                          >
                            {activity.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-3">
                    No recent activities
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Alerts & Notifications
                </h5>
              </div>
              <div className="card-body">
                {leaveStats?.pending_requests > 0 && (
                  <div className="alert alert-warning py-2 px-3 mb-2">
                    <small>
                      <i className="fas fa-calendar-times me-1"></i>
                      {leaveStats.pending_requests} pending leave requests
                    </small>
                  </div>
                )}
                {attendanceStats?.absent_today > 5 && (
                  <div className="alert alert-danger py-2 px-3 mb-2">
                    <small>
                      <i className="fas fa-user-times me-1"></i>
                      High absenteeism today ({
                        attendanceStats.absent_today
                      }{" "}
                      employees)
                    </small>
                  </div>
                )}
                {payrollStats?.pending_count > 0 && (
                  <div className="alert alert-info py-2 px-3 mb-2">
                    <small>
                      <i className="fas fa-dollar-sign me-1"></i>
                      {payrollStats.pending_count} payrolls pending processing
                    </small>
                  </div>
                )}
                {stats?.inactive_employees > 0 && (
                  <div className="alert alert-secondary py-2 px-3 mb-2">
                    <small>
                      <i className="fas fa-user-slash me-1"></i>
                      {stats.inactive_employees} inactive employee accounts
                    </small>
                  </div>
                )}
                {!leaveStats?.pending_requests &&
                  !attendanceStats?.absent_today &&
                  !payrollStats?.pending_count && (
                    <p className="text-muted text-center py-3 mb-0">
                      <i className="fas fa-check-circle me-1"></i>
                      All systems running smoothly
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;