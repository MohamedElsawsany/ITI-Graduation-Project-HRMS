import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { payrollService } from '../../services/payroll';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';

const MyPayrolls = () => {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    month: '',
    status: ''
  });

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Processed', label: 'Processed' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const statusColors = {
    'Draft': 'bg-secondary',
    'Processed': 'bg-warning',
    'Paid': 'bg-success',
    'Cancelled': 'bg-danger'
  };

  useEffect(() => {
    fetchMyPayrolls();
  }, [currentPage, filters]);

  const fetchMyPayrolls = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getMyPayrolls(currentPage, filters);
      setPayrolls(data.results);
      setTotalPages(Math.ceil(data.count / 10));
      setTotalItems(data.count);
    } catch (err) {
      setError('Failed to fetch your payroll records');
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
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      month: '',
      status: ''
    });
    setCurrentPage(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateYearToDateTotals = () => {
    const currentYear = new Date().getFullYear();
    const ytdPayrolls = payrolls.filter(payroll => {
      const payrollYear = new Date(payroll.pay_period_start).getFullYear();
      return payrollYear === currentYear && payroll.status === 'Paid';
    });

    return {
      grossPay: ytdPayrolls.reduce((sum, payroll) => sum + parseFloat(payroll.gross_pay), 0),
      netPay: ytdPayrolls.reduce((sum, payroll) => sum + parseFloat(payroll.net_pay), 0),
      deductions: ytdPayrolls.reduce((sum, payroll) => sum + parseFloat(payroll.total_deductions), 0)
    };
  };

  const ytdTotals = calculateYearToDateTotals();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Payroll History</h1>
        <div className="text-muted">
          Welcome, {user?.username}!
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Year-to-Date Summary */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card dashboard-card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h3 className="mb-0">{formatCurrency(ytdTotals.grossPay)}</h3>
                  <p className="mb-0">YTD Gross Pay</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-dollar-sign fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card dashboard-card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h3 className="mb-0">{formatCurrency(ytdTotals.netPay)}</h3>
                  <p className="mb-0">YTD Net Pay</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-money-bill-wave fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card dashboard-card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h3 className="mb-0">{formatCurrency(ytdTotals.deductions)}</h3>
                  <p className="mb-0">YTD Deductions</p>
                </div>
                <div className="align-self-center">
                  <i className="fas fa-minus-circle fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Filter Payroll Records</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label htmlFor="month" className="form-label">Month</label>
              <input
                type="month"
                className="form-control"
                id="month"
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                className="form-select"
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-3 d-flex align-items-end">
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll History */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Payroll History ({totalItems} records)</h5>
        </div>
        <div className="card-body">
          {payrolls.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-money-bill-wave fa-3x text-muted mb-3"></i>
              <h5>No payroll records found</h5>
              <p className="text-muted">
                {filters.month || filters.status 
                  ? 'Try adjusting your filters to see more records.'
                  : 'You don\'t have any payroll records yet.'
                }
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Pay Period</th>
                    <th>Base Salary</th>
                    <th>Overtime</th>
                    <th>Bonuses</th>
                    <th>Gross Pay</th>
                    <th>Deductions</th>
                    <th>Net Pay</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map(payroll => (
                    <tr key={payroll.id}>
                      <td>
                        <div>
                          <strong>
                            {formatDate(payroll.pay_period_start)} - 
                            <br />
                            {formatDate(payroll.pay_period_end)}
                          </strong>
                        </div>
                      </td>
                      <td>{formatCurrency(payroll.base_salary || 0)}</td>
                      <td>
                        {payroll.overtime_pay > 0 ? (
                          <div>
                            <small className="text-muted d-block">
                              {payroll.overtime_hours}h × {formatCurrency(payroll.overtime_rate || 0)}
                            </small>
                            {formatCurrency(payroll.overtime_pay || 0)}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {payroll.bonuses > 0 ? 
                          formatCurrency(payroll.bonuses) : 
                          <span className="text-muted">-</span>
                        }
                      </td>
                      <td>
                        <strong>{formatCurrency(payroll.gross_pay)}</strong>
                      </td>
                      <td>
                        <span className="text-danger">
                          -{formatCurrency(payroll.total_deductions || 0)}
                        </span>
                      </td>
                      <td>
                        <strong className="text-success">
                          {formatCurrency(payroll.net_pay)}
                        </strong>
                      </td>
                      <td>
                        <span className={`badge ${statusColors[payroll.status]} text-white`}>
                          {payroll.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/payrolls/${payroll.id}`}
                          className="btn btn-outline-primary btn-sm"
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={10}
          />
        </div>
      </div>
    </div>
  );
};

export default MyPayrolls;