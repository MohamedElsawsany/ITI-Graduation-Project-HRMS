import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { payrollService } from '../../services/payroll';
import LoadingSpinner from '../common/LoadingSpinner';

const PayrollEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    pay_period_start: '',
    pay_period_end: '',
    base_salary: '',
    overtime_hours: '',
    overtime_rate: '',
    bonuses: '',
    deductions: '',
    tax_deduction: '',
    insurance_deduction: '',
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
    fetchPayrollDetails();
  }, [id]);

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

  const fetchPayrollDetails = async () => {
    try {
      setLoading(true);
      const data = await payrollService.getPayroll(id);
      
      if (data.status !== 'Draft') {
        setError('Only Draft payroll records can be edited.');
        return;
      }

      setPayroll(data);
      setFormData({
        pay_period_start: data.pay_period_start || '',
        pay_period_end: data.pay_period_end || '',
        base_salary: data.base_salary || '',
        overtime_hours: data.overtime_hours || '',
        overtime_rate: data.overtime_rate || '',
        bonuses: data.bonuses || '',
        deductions: data.deductions || '',
        tax_deduction: data.tax_deduction || '',
        insurance_deduction: data.insurance_deduction || '',
        notes: data.notes || ''
      });
    } catch (err) {
      setError('Failed to fetch payroll details');
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setFormErrors({});

    try {
      const updateData = {
        ...formData,
        base_salary: parseFloat(formData.base_salary),
        overtime_hours: parseFloat(formData.overtime_hours),
        overtime_rate: parseFloat(formData.overtime_rate),
        bonuses: parseFloat(formData.bonuses),
        deductions: parseFloat(formData.deductions),
        tax_deduction: parseFloat(formData.tax_deduction),
        insurance_deduction: parseFloat(formData.insurance_deduction)
      };

      await payrollService.updatePayroll(id, updateData);
      navigate(`/payrolls/${id}`);
    } catch (err) {
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          setFormErrors(err.response.data);
        } else {
          setError(err.response.data);
        }
      } else {
        setError('Failed to update payroll record. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (loading) return <LoadingSpinner />;

  if (!payroll && !loading) {
    return (
      <div className="alert alert-danger" role="alert">
        Payroll record not found or cannot be edited.
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Edit Payroll Record</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/payrolls">Payroll Management</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`/payrolls/${id}`}>Payroll Details</Link>
              </li>
              <li className="breadcrumb-item active">Edit</li>
            </ol>
          </nav>
        </div>
        <Link to={`/payrolls/${id}`} className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Back to Details
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {payroll && (
        <>
          {/* Employee Information (Read-only) */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Employee Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <strong>Employee:</strong> {payroll.employee_details.full_name}
                </div>
                <div className="col-md-4">
                  <strong>Department:</strong> {payroll.employee_details.department_name}
                </div>
                <div className="col-md-4">
                  <strong>Job Title:</strong> {payroll.employee_details.job_title_name}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Basic Information */}
              <div className="col-md-6">
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Pay Period & Base Salary</h5>
                  </div>
                  <div className="card-body">
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
                    <h5 className="mb-0">Updated Payroll Summary</h5>
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
                      <Link to={`/payrolls/${id}`} className="btn btn-outline-secondary">
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default PayrollEdit;