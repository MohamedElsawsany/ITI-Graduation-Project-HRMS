import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats/');
      setStats(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard</h1>
        <div className="text-muted">
          Welcome back, {user?.username}!
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Role-based dashboard content */}
      {(user?.role === 'admin' || user?.role === 'hr') && stats && (
        <div className="row">
          <div className="col-md-3 mb-4">
            <div className="card dashboard-card bg-primary text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h2 className="mb-0">{stats.total_employees}</h2>
                    <p className="mb-0">Total Employees</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-users fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card dashboard-card bg-success text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h2 className="mb-0">{stats.active_employees}</h2>
                    <p className="mb-0">Active Employees</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-user-check fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card dashboard-card bg-warning text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h2 className="mb-0">{stats.total_departments}</h2>
                    <p className="mb-0">Departments</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-building fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card dashboard-card bg-info text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h2 className="mb-0">{stats.total_job_titles}</h2>
                    <p className="mb-0">Job Titles</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-briefcase fa-2x"></i>
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
                {(user?.role === 'admin' || user?.role === 'hr') && (
                  <>
                    <div className="col-md-3 mb-3">
                      <a href="/employees" className="btn btn-outline-primary w-100">
                        <i className="fas fa-users me-2"></i>
                        Manage Employees
                      </a>
                    </div>
                    <div className="col-md-3 mb-3">
                      <a href="/employees/create" className="btn btn-outline-success w-100">
                        <i className="fas fa-user-plus me-2"></i>
                        Add Employee
                      </a>
                    </div>
                    <div className="col-md-3 mb-3">
                      <a href="/leave-requests" className="btn btn-outline-warning w-100">
                        <i className="fas fa-calendar-alt me-2"></i>
                        Leave Requests
                      </a>
                    </div>
                  </>
                )}
                <div className="col-md-3 mb-3">
                  <a href="/my-leave-requests" className="btn btn-outline-info w-100">
                    <i className="fas fa-calendar-check me-2"></i>
                    My Leave Requests
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
