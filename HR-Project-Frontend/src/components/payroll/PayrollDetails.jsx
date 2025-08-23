import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { payrollService } from '../../services/payroll';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const PayrollDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payroll, setPayroll] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr';

  const statusColors = {
    'Draft': 'bg-secondary',
    'Processed': 'bg-warning',
    'Paid': 'bg-success',
    'Cancelled': 'bg-danger'
  };

  useEffect(() => {
    fetchPayrollDetails();
    if (isAdminOrHR) {
      fetchPayrollHistory();
    }
  }, [id]);

  const fetchPayrollDetails = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getPayroll(id);
      setPayroll(data);
    } catch (err) {
      setError('Failed to fetch payroll details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollHistory = async () => {
    try {
      const data = await payrollService.getPayrollHistory(id);
      setHistory(data.results || []);
    } catch (err) {
      console.error('Failed to fetch payroll history');
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await payrollService.updatePayrollStatus(id, newStatus);
      await fetchPayrollDetails();
      await fetchPayrollHistory();
    } catch (err) {
      setError('Failed to update payroll status');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      try {
        await payrollService.deletePayroll(id);
        navigate('/payrolls');
      } catch (err) {
        setError('Failed to delete payroll record');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <LoadingSpinner />;

  if (!payroll) {
    return (
      <div className="alert alert-danger" role="alert">
        Payroll record not found.
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Payroll Details</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to={isAdminOrHR ? "/payrolls" : "/my-payrolls"}>
                  {isAdminOrHR ? "Payroll Management" : "My Payrolls"}
                </Link>
              </li>
              <li className="breadcrumb-item active">Payroll Details</li>
            </ol>
          </nav>
        </div>
        <div>
          {isAdminOrHR && payroll.status === 'Draft' && (
            <>
              <Link
                to={`/payrolls/${id}/edit`}
                className="btn btn-warning me-2"
              >
                <i className="fas fa-edit me-2"></i>
                Edit
              </Link>
              <button
                className="btn btn-danger me-2"
                onClick={handleDelete}
              >
                <i className="fas fa-trash me-2"></i>
                Delete
              </button>
            </>
          )}
          <Link
            to={isAdminOrHR ? "/payrolls" : "/my-payrolls"}
            className="btn btn-outline-secondary"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        {/* Employee Information */}
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Employee Information</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Employee</label>
                <p className="mb-0">{payroll.employee_details.full_name}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Department</label>
                <p className="mb-0">{payroll.employee_details.department_name}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Job Title</label>
                <p className="mb-0">{payroll.employee_details.job_title_name}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Pay Period</label>
                <p className="mb-0">
                  {formatDate(payroll.pay_period_start)} - {formatDate(payroll.pay_period_end)}
                </p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Status</label>
                <div>
                  <span className={`badge ${statusColors[payroll.status]} text-white fs-6`}>
                    {payroll.status}
                  </span>
                </div>
              </div>
              {isAdminOrHR && (
                <>
                  {payroll.processed_by_name && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">Processed By</label>
                      <p className="mb-0">{payroll.processed_by_name}</p>
                    </div>
                  )}
                  {payroll.processed_date && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">Processed Date</label>
                      <p className="mb-0">{formatDateTime(payroll.processed_date)}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Payroll Breakdown */}
        <div className="col-md-8 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Payroll Breakdown</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Earnings */}
                <div className="col-md-6">
                  <h6 className="text-success mb-3">
                    <i className="fas fa-plus-circle me-2"></i>
                    Earnings
                  </h6>
                  <div className="mb-2 d-flex justify-content-between">
                    <span>Base Salary:</span>
                    <strong>{formatCurrency(payroll.base_salary)}</strong>
                  </div>
                  {payroll.overtime_hours > 0 && (
                    <div className="mb-2">
                      <div className="d-flex justify-content-between">
                        <span>Overtime:</span>
                        <strong>{formatCurrency(payroll.overtime_pay)}</strong>
                      </div>
                      <small className="text-muted">
                        {payroll.overtime_hours} hours × {formatCurrency(payroll.overtime_rate)}
                      </small>
                    </div>
                  )}
                  {payroll.bonuses > 0 && (
                    <div className="mb-2 d-flex justify-content-between">
                      <span>Bonuses:</span>
                      <strong>{formatCurrency(payroll.bonuses)}</strong>
                    </div>
                  )}
                  <hr />
                  <div className="d-flex justify-content-between">
                    <strong>Gross Pay:</strong>
                    <strong className="text-success fs-5">
                      {formatCurrency(payroll.gross_pay)}
                    </strong>
                  </div>
                </div>

                {/* Deductions */}
                <div className="col-md-6">
                  <h6 className="text-danger mb-3">
                    <i className="fas fa-minus-circle me-2"></i>
                    Deductions
                  </h6>
                  {payroll.tax_deduction > 0 && (
                    <div className="mb-2 d-flex justify-content-between">
                      <span>Tax Deduction:</span>
                      <span className="text-danger">
                        -{formatCurrency(payroll.tax_deduction)}
                      </span>
                    </div>
                  )}
                  {payroll.insurance_deduction > 0 && (
                    <div className="mb-2 d-flex justify-content-between">
                      <span>Insurance:</span>
                      <span className="text-danger">
                        -{formatCurrency(payroll.insurance_deduction)}
                      </span>
                    </div>
                  )}
                  {payroll.deductions > 0 && (
                    <div className="mb-2 d-flex justify-content-between">
                      <span>Other Deductions:</span>
                      <span className="text-danger">
                        -{formatCurrency(payroll.deductions)}
                      </span>
                    </div>
                  )}
                  <hr />
                  <div className="d-flex justify-content-between">
                    <strong>Total Deductions:</strong>
                    <strong className="text-danger fs-5">
                      -{formatCurrency(payroll.total_deductions)}
                    </strong>
                  </div>
                </div>
              </div>

              <hr className="my-4" />

              {/* Net Pay */}
              <div className="row">
                <div className="col-12">
                  <div className="bg-light p-3 rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <h4 className="mb-0">Net Pay:</h4>
                      <h3 className="mb-0 text-primary">
                        {formatCurrency(payroll.net_pay)}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {payroll.notes && (
                <div className="mt-4">
                  <h6>Notes:</h6>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-0">{payroll.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Management (Admin/HR only) */}
      {isAdminOrHR && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Status Management</h5>
              </div>
              <div className="card-body">
                <div className="d-flex gap-2">
                  {payroll.status === 'Draft' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleStatusUpdate('Processed')}
                    >
                      <i className="fas fa-check me-2"></i>
                      Mark as Processed
                    </button>
                  )}
                  {payroll.status === 'Processed' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleStatusUpdate('Paid')}
                    >
                      <i className="fas fa-dollar-sign me-2"></i>
                      Mark as Paid
                    </button>
                  )}
                  {(payroll.status === 'Draft' || payroll.status === 'Processed') && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleStatusUpdate('Cancelled')}
                    >
                      <i className="fas fa-times me-2"></i>
                      Cancel
                    </button>
                  )}
                  {payroll.status === 'Cancelled' && (
                    <button
                      className="btn btn-warning"
                      onClick={() => handleStatusUpdate('Draft')}
                    >
                      <i className="fas fa-undo me-2"></i>
                      Reopen as Draft
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History (Admin/HR only) */}
      {isAdminOrHR && history.length > 0 && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Change History</h5>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>
              {showHistory && (
                <div className="card-body">
                  <div className="timeline">
                    {history.map((change, index) => (
                      <div key={change.id} className="timeline-item mb-3">
                        <div className="d-flex">
                          <div className="flex-shrink-0">
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center"
                                 style={{ width: '40px', height: '40px' }}>
                              <i className="fas fa-history text-white"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="d-flex justify-content-between">
                              <div>
                                <h6 className="mb-1">{change.change_description}</h6>
                                <small className="text-muted">
                                  By {change.changed_by_name} on {formatDateTime(change.change_date)}
                                </small>
                              </div>
                              {change.old_status && change.new_status && (
                                <div>
                                  <span className={`badge ${statusColors[change.old_status]} me-1`}>
                                    {change.old_status}
                                  </span>
                                  <i className="fas fa-arrow-right me-1"></i>
                                  <span className={`badge ${statusColors[change.new_status]}`}>
                                    {change.new_status}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {index < history.length - 1 && <hr className="mt-3" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollDetails;