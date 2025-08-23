import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { payrollService } from '../../services/payroll';
import { employeeService } from '../../services/employees';
import LoadingSpinner from '../common/LoadingSpinner';

const PayrollCreate = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    employee: '',
    pay_period_start: '',
    pay_period_end: '',
    base_salary: '',
    overtime_hours: '0',
    overtime_rate: '0',
    bonuses: '0',
    deductions: '0',
    tax_deduction: '0',
    insurance_deduction: '0',
    notes: ''
  });

  // Auto-calculated fields
  const [calculatedValues, setCalculatedValues] = useState({
    overtime_pay: 0,
    gross_pay: 0,
    total_deductions: 0,
    net_pay: 0
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    calculatePayroll();
  }, [
    formData.base_salary,
    formData.overtime_hours,
    formData.overtime_rate,
    formData.bonuses,
    formData.deductions,
    formData.tax_deduction,
    formData.insurance_deduction
  ]);

  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getEmployees(1, { page_size: 1000, is_active: true });
      setEmployees(data.results || []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setError('Failed to fetch employees');
    }
  };

  const calculatePayroll = () => {
    const baseSalary = parseFloat(formData.base_salary) || 0;
    const overtimeHours = parseFloat(formData.overtime_hours) || 0;
    const overtimeRate = parseFloat(formData.overtime_rate) || 0;
    const bonuses = parseFloat(formData.bonuses) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const taxDeduction = parseFloat(formData.tax_deduction) || 0;
    const insuranceDeduction = parseFloat(formData.insurance_deduction) || 0;

    const overtimePay = overtimeHours * overtimeRate;
    const grossPay = baseSalary + overtimePay + bonuses;
    const totalDeductions = deductions + taxDeduction + insuranceDeduction;
    const netPay = grossPay - totalDeductions;

    setCalculatedValues({
      overtime_pay: overtimePay,
      gross_pay: grossPay,
      total_deductions: totalDeductions,
      net_pay: netPay
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.employee) {
      errors.employee = 'Please select an employee';
    }
    
    if (!formData.pay_period_start) {
      errors.pay_period_start = 'Pay period start date is required';
    }
    
    if (!formData.pay_period_end) {
      errors.pay_period_end = 'Pay period end date is required';
    }
    
    if (formData.pay_period_start && formData.pay_period_end) {
      if (new Date(formData.pay_period_start) > new Date(formData.pay_period_end)) {
        errors.pay_period_end = 'End date must be after start date';
      }
    }
    
    if (!formData.base_salary || parseFloat(formData.base_salary) <= 0) {
      errors.base_salary = 'Base salary must be greater than 0';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFormErrors({});

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const payrollData = {
        employee: parseInt(formData.employee),
        pay_period_start: formData.pay_period_start,
        pay_period_end: formData.pay_period_end,
        base_salary: parseFloat(formData.base_salary) || 0,
        overtime_hours: parseFloat(formData.overtime_hours) || 0,
        overtime_rate: parseFloat(formData.overtime_rate) || 0,
        bonuses: parseFloat(formData.bonuses) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        tax_deduction: parseFloat(formData.tax_deduction) || 0,
        insurance_deduction: parseFloat(formData.insurance_deduction) || 0,
        notes: formData.notes || ''
      };

      console.log('Submitting payroll data:', payrollData); // Debug log

      const result = await payrollService.createPayroll(payrollData);
      console.log('Payroll created successfully:', result); // Debug log
      navigate(`/payrolls/${result.id}`);
    } catch (err) {
      console.error('Error creating payroll:', err); // Debug log
      
      if (err.response?.status === 400 && err.response?.data) {
        // Handle validation errors from backend
        if (typeof err.response.data === 'object') {
          setFormErrors(err.response.data);
        } else if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else {
          setError('Validation failed. Please check your input.');
        }
      } else if (err.response?.status === 401) {
        setError('You are not authorized to create payroll records.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to create payroll records.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to create payroll record. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const setCurrentMonthPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    setFormData(prev => ({
      ...prev,
      pay_period_start: startDate.toISOString().split('T')[0],
      pay_period_end: endDate.toISOString().split('T')[0]
    }));
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Create Payroll Record</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/payrolls">Payroll Management</Link>
              </li>
              <li className="breadcrumb-item active">Create Payroll</li>
            </ol>
          </nav>
        </div>
        <Link to="/payrolls" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Payrolls
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Basic Information */}
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Basic Information</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="employee" className="form-label">Employee *</label>
                  <select
                    className={`form-select ${formErrors.employee ? 'is-invalid' : ''}`}
                    id="employee"
                    name="employee"
                    value={formData.employee}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name} - {employee.department?.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.employee && (
                    <div className="invalid-feedback">{formErrors.employee}</div>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="pay_period_start" className="form-label">Pay Period Start *</label>
                    <input
                      type="date"
                      className={`form-control ${formErrors.pay_period_start ? 'is-invalid' : ''}`}
                      id="pay_period_start"
                      name="pay_period_start"
                      value={formData.pay_period_start}
                      onChange={handleChange}
                      required
                    />
                    {formErrors.pay_period_start && (
                      <div className="invalid-feedback">{formErrors.pay_period_start}</div>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="pay_period_end" className="form-label">Pay Period End *</label>
                    <input
                      type="date"
                      className={`form-control ${formErrors.pay_period_end ? 'is-invalid' : ''}`}
                      id="pay_period_end"
                      name="pay_period_end"
                      value={formData.pay_period_end}
                      onChange={handleChange}
                      required
                    />
                    {formErrors.pay_period_end && (
                      <div className="invalid-feedback">{formErrors.pay_period_end}</div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={setCurrentMonthPeriod}
                  >
                    <i className="fas fa-calendar me-2"></i>
                    Set Current Month
                  </button>
                </div>

                <div className="mb-3">
                  <label htmlFor="base_salary" className="form-label">Base Salary *</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-control ${formErrors.base_salary ? 'is-invalid' : ''}`}
                      id="base_salary"
                      name="base_salary"
                      value={formData.base_salary}
                      onChange={handleChange}
                      required
                    />
                    {formErrors.base_salary && (
                      <div className="invalid-feedback">{formErrors.base_salary}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Overtime and Bonuses */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Additional Earnings</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="overtime_hours" className="form-label">Overtime Hours</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-control ${formErrors.overtime_hours ? 'is-invalid' : ''}`}
                      id="overtime_hours"
                      name="overtime_hours"
                      value={formData.overtime_hours}
                      onChange={handleChange}
                    />
                    {formErrors.overtime_hours && (
                      <div className="invalid-feedback">{formErrors.overtime_hours}</div>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="overtime_rate" className="form-label">Overtime Rate</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`form-control ${formErrors.overtime_rate ? 'is-invalid' : ''}`}
                        id="overtime_rate"
                        name="overtime_rate"
                        value={formData.overtime_rate}
                        onChange={handleChange}
                      />
                      {formErrors.overtime_rate && (
                        <div className="invalid-feedback">{formErrors.overtime_rate}</div>
                      )}
                    </div>
                  </div>
                </div>

                {calculatedValues.overtime_pay > 0 && (
                  <div className="alert alert-info">
                    <strong>Overtime Pay: {formatCurrency(calculatedValues.overtime_pay)}</strong>
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="bonuses" className="form-label">Bonuses</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-control ${formErrors.bonuses ? 'is-invalid' : ''}`}
                      id="bonuses"
                      name="bonuses"
                      value={formData.bonuses}
                      onChange={handleChange}
                    />
                    {formErrors.bonuses && (
                      <div className="invalid-feedback">{formErrors.bonuses}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deductions and Summary */}
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Deductions</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="tax_deduction" className="form-label">Tax Deduction</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-control ${formErrors.tax_deduction ? 'is-invalid' : ''}`}
                      id="tax_deduction"
                      name="tax_deduction"
                      value={formData.tax_deduction}
                      onChange={handleChange}
                    />
                    {formErrors.tax_deduction && (
                      <div className="invalid-feedback">{formErrors.tax_deduction}</div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="insurance_deduction" className="form-label">Insurance Deduction</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-control ${formErrors.insurance_deduction ? 'is-invalid' : ''}`}
                      id="insurance_deduction"
                      name="insurance_deduction"
                      value={formData.insurance_deduction}
                      onChange={handleChange}
                    />
                    {formErrors.insurance_deduction && (
                      <div className="invalid-feedback">{formErrors.insurance_deduction}</div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="deductions" className="form-label">Other Deductions</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-control ${formErrors.deductions ? 'is-invalid' : ''}`}
                      id="deductions"
                      name="deductions"
                      value={formData.deductions}
                      onChange={handleChange}
                    />
                    {formErrors.deductions && (
                      <div className="invalid-feedback">{formErrors.deductions}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll Summary */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Payroll Summary</h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span>Gross Pay:</span>
                  <strong className="text-success">
                    {formatCurrency(calculatedValues.gross_pay)}
                  </strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Deductions:</span>
                  <strong className="text-danger">
                    -{formatCurrency(calculatedValues.total_deductions)}
                  </strong>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <h5>Net Pay:</h5>
                  <h4 className="text-primary">
                    {formatCurrency(calculatedValues.net_pay)}
                  </h4>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Notes</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="notes" className="form-label">Additional Notes</label>
                  <textarea
                    className={`form-control ${formErrors.notes ? 'is-invalid' : ''}`}
                    id="notes"
                    name="notes"
                    rows="4"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter any additional notes or comments about this payroll..."
                  />
                  {formErrors.notes && (
                    <div className="invalid-feedback">{formErrors.notes}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-end gap-2">
                  <Link to="/payrolls" className="btn btn-outline-secondary">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Create Payroll
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PayrollCreate;