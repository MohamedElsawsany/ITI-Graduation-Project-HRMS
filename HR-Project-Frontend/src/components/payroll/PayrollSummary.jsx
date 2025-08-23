import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { payrollService } from '../../services/payroll';
import LoadingSpinner from '../common/LoadingSpinner';

const PayrollSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getPayrollSummary(selectedMonth);
      setSummary(data);
    } catch (err) {
      setError('Failed to fetch payroll summary');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatMonthDisplay = (monthString) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getStatusPercentage = (count, total) => {
    if (total === 0) return 0;
    return ((count / total) * 100).toFixed(1);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Payroll Summary</h1>
          <p className="text-muted mb-0">
            Overview of payroll statistics for {formatMonthDisplay(selectedMonth)}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/payrolls" className="btn btn-outline-secondary">
            <i className="fas fa-list me-2"></i>
            Back to Payrolls
          </Link>
          <Link to="/payrolls/create" className="btn btn-primary">
            <i className="fas fa-plus me-2"></i>
            Create Payroll
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Month Selection */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-3">
              <label htmlFor="month" className="form-label">Select Month</label>
              <input
                type="month"
                className="form-control"
                id="month"
                value={selectedMonth}
                onChange={handleMonthChange}
              />
            </div>
            <div className="col-md-9 d-flex align-items-end">
              <button
                className="btn btn-outline-primary"
                onClick={() => setSelectedMonth(getCurrentMonth())}
              >
                <i className="fas fa-calendar me-2"></i>
                Current Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {summary && (
        <>
          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card dashboard-card bg-primary text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">{summary.total_employees}</h3>
                      <p className="mb-0">Total Employees</p>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-users fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card dashboard-card bg-success text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4 className="mb-0">{formatCurrency(summary.total_gross_pay)}</h4>
                      <p className="mb-0">Total Gross Pay</p>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-dollar-sign fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card dashboard-card bg-warning text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4 className="mb-0">{formatCurrency(summary.total_deductions)}</h4>
                      <p className="mb-0">Total Deductions</p>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-minus-circle fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-3">
              <div className="card dashboard-card bg-info text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h4 className="mb-0">{formatCurrency(summary.total_net_pay)}</h4>
                      <p className="mb-0">Total Net Pay</p>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-money-bill-wave fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Payroll Status Breakdown</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-6 mb-3">
                      <div className="text-center">
                        <div className="display-6 text-secondary">{summary.draft_count}</div>
                        <small className="text-muted">Draft ({getStatusPercentage(summary.draft_count, summary.total_employees)}%)</small>
                      </div>
                    </div>
                    <div className="col-6 mb-3">
                      <div className="text-center">
                        <div className="display-6 text-warning">{summary.processed_count}</div>
                        <small className="text-muted">Processed ({getStatusPercentage(summary.processed_count, summary.total_employees)}%)</small>
                      </div>
                    </div>
                    <div className="col-6 mb-3">
                      <div className="text-center">
                        <div className="display-6 text-success">{summary.paid_count}</div>
                        <small className="text-muted">Paid ({getStatusPercentage(summary.paid_count, summary.total_employees)}%)</small>
                      </div>
                    </div>
                    <div className="col-6 mb-3">
                      <div className="text-center">
                        <div className="display-6 text-danger">{summary.cancelled_count}</div>
                        <small className="text-muted">Cancelled ({getStatusPercentage(summary.cancelled_count, summary.total_employees)}%)</small>
                      </div>
                    </div>
                  </div>

                  {/* Progress bars for visual representation */}
                  <div className="mt-3">
                    <div className="mb-2">
                      <div className="d-flex justify-content-between">
                        <small>Draft</small>
                        <small>{summary.draft_count} records</small>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-secondary" 
                          style={{ width: `${getStatusPercentage(summary.draft_count, summary.total_employees)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="d-flex justify-content-between">
                        <small>Processed</small>
                        <small>{summary.processed_count} records</small>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-warning" 
                          style={{ width: `${getStatusPercentage(summary.processed_count, summary.total_employees)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="d-flex justify-content-between">
                        <small>Paid</small>
                        <small>{summary.paid_count} records</small>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-success" 
                          style={{ width: `${getStatusPercentage(summary.paid_count, summary.total_employees)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="d-flex justify-content-between">
                        <small>Cancelled</small>
                        <small>{summary.cancelled_count} records</small>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-danger" 
                          style={{ width: `${getStatusPercentage(summary.cancelled_count, summary.total_employees)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Financial Summary</h5>
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <h6 className="text-success">
                      <i className="fas fa-plus-circle me-2"></i>
                      Total Earnings
                    </h6>
                    <div className="fs-3 text-success fw-bold">
                      {formatCurrency(summary.total_gross_pay)}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6 className="text-danger">
                      <i className="fas fa-minus-circle me-2"></i>
                      Total Deductions
                    </h6>
                    <div className="fs-3 text-danger fw-bold">
                      -{formatCurrency(summary.total_deductions)}
                    </div>
                  </div>

                  <hr />

                  <div className="mb-3">
                    <h6 className="text-primary">
                      <i className="fas fa-equals me-2"></i>
                      Net Amount Paid
                    </h6>
                    <div className="fs-2 text-primary fw-bold">
                      {formatCurrency(summary.total_net_pay)}
                    </div>
                  </div>

                  {/* Average calculations */}
                  {summary.total_employees > 0 && (
                    <div className="mt-4 pt-3 border-top">
                      <small className="text-muted d-block mb-2">Averages per employee:</small>
                      <div className="row text-center">
                        <div className="col-4">
                          <div className="text-muted small">Avg Gross</div>
                          <div className="fw-bold">
                            {formatCurrency(summary.total_gross_pay / summary.total_employees)}
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="text-muted small">Avg Deductions</div>
                          <div className="fw-bold">
                            {formatCurrency(summary.total_deductions / summary.total_employees)}
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="text-muted small">Avg Net</div>
                          <div className="fw-bold">
                            {formatCurrency(summary.total_net_pay / summary.total_employees)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                      <Link 
                        to={`/payrolls?month=${selectedMonth}&status=Draft`} 
                        className="btn btn-outline-secondary w-100"
                      >
                        <i className="fas fa-file-alt me-2"></i>
                        View Draft Payrolls
                        {summary.draft_count > 0 && (
                          <span className="badge bg-secondary ms-2">{summary.draft_count}</span>
                        )}
                      </Link>
                    </div>
                    <div className="col-md-3 mb-3">
                      <Link 
                        to={`/payrolls?month=${selectedMonth}&status=Processed`} 
                        className="btn btn-outline-warning w-100"
                      >
                        <i className="fas fa-clock me-2"></i>
                        View Processed
                        {summary.processed_count > 0 && (
                          <span className="badge bg-warning ms-2">{summary.processed_count}</span>
                        )}
                      </Link>
                    </div>
                    <div className="col-md-3 mb-3">
                      <Link 
                        to={`/payrolls?month=${selectedMonth}&status=Paid`} 
                        className="btn btn-outline-success w-100"
                      >
                        <i className="fas fa-check-circle me-2"></i>
                        View Paid
                        {summary.paid_count > 0 && (
                          <span className="badge bg-success ms-2">{summary.paid_count}</span>
                        )}
                      </Link>
                    </div>
                    <div className="col-md-3 mb-3">
                      <Link 
                        to="/payrolls/create" 
                        className="btn btn-primary w-100"
                      >
                        <i className="fas fa-plus me-2"></i>
                        Create New Payroll
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Information */}
          {summary.total_employees === 0 && (
            <div className="row mt-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <i className="fas fa-money-bill-wave fa-3x text-muted mb-3"></i>
                    <h5>No Payroll Data</h5>
                    <p className="text-muted">
                      No payroll records found for {formatMonthDisplay(selectedMonth)}.
                      <br />
                      Create payroll records to see summary statistics.
                    </p>
                    <Link to="/payrolls/create" className="btn btn-primary">
                      <i className="fas fa-plus me-2"></i>
                      Create First Payroll
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PayrollSummary;