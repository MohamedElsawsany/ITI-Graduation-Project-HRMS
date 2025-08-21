import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employees';
import LoadingSpinner from '../common/LoadingSpinner';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const response = await employeeService.getEmployee(id);
      setEmployee(response);
    } catch (err) {
      setError('Failed to fetch employee details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeService.deleteEmployee(id);
        navigate('/employees');
      } catch (err) {
        setError('Failed to delete employee');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!employee) return <div className="alert alert-warning">Employee not found</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Employee Details</h1>
        <div>
          <Link to={`/employees/${id}/edit`} className="btn btn-warning me-2">
            <i className="fas fa-edit me-2"></i>
            Edit
          </Link>
          <button onClick={handleDelete} className="btn btn-danger me-2">
            <i className="fas fa-trash me-2"></i>
            Delete
          </button>
          <Link to="/employees" className="btn btn-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to List
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Personal Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">First Name</label>
                  <p>{employee.first_name}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Last Name</label>
                  <p>{employee.last_name}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Email</label>
                  <p>{employee.user_email}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Username</label>
                  <p>{employee.user_username}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Phone</label>
                  <p>{employee.phone}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">National ID</label>
                  <p>{employee.national_id}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Date of Birth</label>
                  <p>{new Date(employee.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Gender</label>
                  <p>{employee.gender}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Marital Status</label>
                  <p>{employee.marital_status}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Emergency Contact</label>
                  <p>{employee.emergency_contact || 'N/A'}</p>
                </div>
                <div className="col-12 mb-3">
                  <label className="form-label fw-bold">Address</label>
                  <p>{employee.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0">Work Information</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Department</label>
                <p>{employee.department_name}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Job Title</label>
                <p>{employee.job_title_name}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Hire Date</label>
                <p>{new Date(employee.hire_date).toLocaleDateString()}</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Annual Leave Balance</label>
                <p>{employee.annual_leave_balance} days</p>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Status</label>
                <p>
                  <span className={`badge ${employee.is_active ? 'bg-success' : 'bg-danger'}`}>
                    {employee.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;