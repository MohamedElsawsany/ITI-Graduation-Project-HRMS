import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { payrollService } from '../../services/payroll';
import { employeeService } from '../../services/employees';
import { departmentService } from '../../services/departments';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';

const PayrollList = () => {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    month: '',
    employee: '',
    status: '',
    department: ''
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
    fetchPayrolls();
    fetchEmployees();
    fetchDepartments();
  }, [currentPage, filters]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getPayrolls(currentPage, filters);
      setPayrolls(data.results);
      setTotalPages(Math.ceil(data.count / 10));
      setTotalItems(data.count);
    } catch (err) {
      setError('Failed to fetch payroll records');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getEmployees(1, { page_size: 1000 });
      setEmployees(data.results);
    } catch (err) {
      console.error('Failed to fetch employees');
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getDepartments(1);
      setDepartments(data.results);
    } catch (err) {
      console.error('Failed to fetch departments');
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
      employee: '',
      status: '',
      department: ''
    });
    setCurrentPage(1);
  };

  const handleStatusUpdate = async (payrollId, newStatus) => {
    try {
      await payrollService.updatePayrollStatus(payrollId, newStatus);
      fetchPayrolls(); // Refresh the list
    } catch (err) {
      setError('Failed to update payroll status');
    }
  };

  const handleDelete = async (payrollId) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      try {
        await payrollService.deletePayroll(payrollId);
        fetchPayrolls(); // Refresh the list
      } catch (err) {
        setError('Failed to delete payroll record');
      }
    }
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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Payroll Management</h1>
        <div>
          <Link to="/payrolls/create" className="btn btn-primary me-2">
            <i className="fas fa-plus me-2"></i>
            Create Payroll
          </Link>
          <Link to="/payrolls/summary" className="btn btn-outline-info">
            <i className="fas fa-chart-bar me-2"></i>
            Summary
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Filters</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 mb-3">
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
            <div className="col-md-3 mb-3">
              <label htmlFor="employee" className="form-label">Employee</label>
              <select
                className="form-select"
                id="employee"
                name="employee"
                value={filters.employee}
                onChange={handleFilterChange}
              >
                <option value="">All Employees</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 mb-3">
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
            <div className="col-md-3 mb-3">
              <label htmlFor="department" className="form-label">Department</label>
              <select
                className="form-select"
                id="department"
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-1 mb-3 d-flex align-items-end">
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={clearFilters}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll List */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Payroll Records ({totalItems})</h5>
        </div>
        <div className="card-body">
          {payrolls.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-money-bill-wave fa-3x text-muted mb-3"></i>
              <h5>No payroll records found</h5>
              <p className="text-muted">Try adjusting your filters or create a new payroll record.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Pay Period</th>
                    <th>Gross Pay</th>
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
                          <strong>{payroll.employee_details.full_name}</strong>
                          <br />
                          <small className="text-muted">
                            {payroll.employee_details.job_title_name}
                          </small>
                        </div>
                      </td>
                      <td>{payroll.employee_details.department_name}</td>
                      <td>
                        <div>
                          {formatDate(payroll.pay_period_start)} - 
                          <br />
                          {formatDate(payroll.pay_period_end)}
                        </div>
                      </td>
                      <td>
                        <strong>{formatCurrency(payroll.gross_pay)}</strong>
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
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/payrolls/${payroll.id}`}
                            className="btn btn-outline-primary"
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          {payroll.status === 'Draft' && (
                            <>
                              <Link
                                to={`/payrolls/${payroll.id}/edit`}
                                className="btn btn-outline-warning"
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </Link>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(payroll.id)}
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </>
                          )}
                          {/* Status update buttons */}
                          {payroll.status === 'Draft' && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleStatusUpdate(payroll.id, 'Processed')}
                              title="Process"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          {payroll.status === 'Processed' && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleStatusUpdate(payroll.id, 'Paid')}
                              title="Mark as Paid"
                            >
                              <i className="fas fa-dollar-sign"></i>
                            </button>
                          )}
                        </div>
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

export default PayrollList;