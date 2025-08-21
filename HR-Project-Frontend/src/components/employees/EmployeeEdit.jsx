import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employees';
import { departmentService } from '../../services/departments';
import { jobTitleService } from '../../services/jobTitles';
import { GENDER_CHOICES, MARITAL_CHOICES } from '../../utils/constants';
import LoadingSpinner from '../common/LoadingSpinner';

const EmployeeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    user: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    address: '',
    hire_date: '',
    national_id: '',
    marital_status: '',
    emergency_contact: '',
    annual_leave_balance: 21,
    is_active: true,
    department: '',
    job_title: ''
  });
  
  const [departments, setDepartments] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [employeeRes, deptsRes, titlesRes] = await Promise.all([
        employeeService.getEmployee(id),
        departmentService.getDepartments(),
        jobTitleService.getJobTitles()
      ]);

      const employee = employeeRes;
      setFormData({
        user: employee.user,
        first_name: employee.first_name,
        last_name: employee.last_name,
        date_of_birth: employee.date_of_birth,
        gender: employee.gender,
        phone: employee.phone,
        address: employee.address,
        hire_date: employee.hire_date,
        national_id: employee.national_id,
        marital_status: employee.marital_status,
        emergency_contact: employee.emergency_contact || '',
        annual_leave_balance: employee.annual_leave_balance,
        is_active: employee.is_active,
        department: employee.department,
        job_title: employee.job_title
      });

      setDepartments(deptsRes.results || deptsRes);
      setJobTitles(titlesRes.results || titlesRes);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      await employeeService.updateEmployee(id, formData);
      navigate(`/employees/${id}`);
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setErrors({ general: 'Failed to update employee' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Edit Employee</h1>
        <button onClick={() => navigate(`/employees/${id}`)} className="btn btn-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Details
        </button>
      </div>

      {errors.general && (
        <div className="alert alert-danger">{errors.general}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Employee Information</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
                {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
                {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">National ID *</label>
                <input
                  type="text"
                  name="national_id"
                  className={`form-control ${errors.national_id ? 'is-invalid' : ''}`}
                  value={formData.national_id}
                  onChange={handleChange}
                  required
                />
                {errors.national_id && <div className="invalid-feedback">{errors.national_id}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Date of Birth *</label>
                <input
                  type="date"
                  name="date_of_birth"
                  className={`form-control ${errors.date_of_birth ? 'is-invalid' : ''}`}
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                />
                {errors.date_of_birth && <div className="invalid-feedback">{errors.date_of_birth}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Hire Date *</label>
                <input
                  type="date"
                  name="hire_date"
                  className={`form-control ${errors.hire_date ? 'is-invalid' : ''}`}
                  value={formData.hire_date}
                  onChange={handleChange}
                  required
                />
                {errors.hire_date && <div className="invalid-feedback">{errors.hire_date}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Gender *</label>
                <select
                  name="gender"
                  className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  {GENDER_CHOICES.map(choice => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
                {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Marital Status *</label>
                <select
                  name="marital_status"
                  className={`form-select ${errors.marital_status ? 'is-invalid' : ''}`}
                  value={formData.marital_status}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Status</option>
                  {MARITAL_CHOICES.map(choice => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
                {errors.marital_status && <div className="invalid-feedback">{errors.marital_status}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Department *</label>
                <select
                  name="department"
                  className={`form-select ${errors.department ? 'is-invalid' : ''}`}
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && <div className="invalid-feedback">{errors.department}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Job Title *</label>
                <select
                  name="job_title"
                  className={`form-select ${errors.job_title ? 'is-invalid' : ''}`}
                  value={formData.job_title}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Job Title</option>
                  {jobTitles.map(title => (
                    <option key={title.id} value={title.id}>
                      {title.name}
                    </option>
                  ))}
                </select>
                {errors.job_title && <div className="invalid-feedback">{errors.job_title}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Annual Leave Balance *</label>
                <input
                  type="number"
                  name="annual_leave_balance"
                  className={`form-control ${errors.annual_leave_balance ? 'is-invalid' : ''}`}
                  value={formData.annual_leave_balance}
                  onChange={handleChange}
                  min="0"
                  max="365"
                  required
                />
                {errors.annual_leave_balance && <div className="invalid-feedback">{errors.annual_leave_balance}</div>}
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Emergency Contact</label>
                <input
                  type="tel"
                  name="emergency_contact"
                  className={`form-control ${errors.emergency_contact ? 'is-invalid' : ''}`}
                  value={formData.emergency_contact}
                  onChange={handleChange}
                />
                {errors.emergency_contact && <div className="invalid-feedback">{errors.emergency_contact}</div>}
              </div>

              <div className="col-12 mb-3">
                <label className="form-label">Address *</label>
                <textarea
                  name="address"
                  className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  required
                />
                {errors.address && <div className="invalid-feedback">{errors.address}</div>}
              </div>

              <div className="col-12 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    name="is_active"
                    className="form-check-input"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <label className="form-check-label">Active Employee</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-3">
          <button
            type="button"
            onClick={() => navigate(`/employees/${id}`)}
            className="btn btn-secondary me-2"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Updating...
              </>
            ) : (
              'Update Employee'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeEdit;