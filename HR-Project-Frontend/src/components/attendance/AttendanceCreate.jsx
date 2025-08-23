// src/components/attendance/AttendanceCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceService } from '../../services/attendance';
import { employeeService } from '../../services/employees';
import LoadingSpinner from '../common/LoadingSpinner';

const AttendanceCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employee: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    check_in_time: '',
    check_out_time: '',
    status: 'Present',
    break_duration: '1.0',
    notes: ''
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await employeeService.getEmployees(1, { is_active: true });
      setEmployees(response.results || []);
    } catch (err) {
      setError('Failed to fetch employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const searchEmployees = async (query) => {
    if (query.length < 2) {
      fetchEmployees();
      return;
    }

    try {
      const response = await attendanceService.searchEmployeesForAttendance(query);
      setEmployees(response.employees || []);
    } catch (err) {
      console.error('Failed to search employees:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchEmployees(query);
  };

  const validateForm = () => {
    if (!formData.employee) {
      setError('Please select an employee');
      return false;
    }
    if (!formData.date) {
      setError('Please select a date');
      return false;
    }
    if (formData.check_in_time && formData.check_out_time) {
      if (formData.check_in_time >= formData.check_out_time) {
        setError('Check-out time must be after check-in time');
        return false;
      }
    }
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      setError('Attendance date cannot be in the future');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setLoading(true);
      await attendanceService.createAttendance(formData);
      navigate('/attendance/list', { 
        state: { message: 'Attendance record created successfully' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create attendance record');
    } finally {
      setLoading(false);
    }
  };

  if (employeesLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Create Attendance Record</h1>
        <button 
          type="button" 
          className="btn btn-outline-secondary"
          onClick={() => navigate('/attendance/list')}
        >
          <i className="fas fa-arrow-left me-2"></i>
          Back to List
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Attendance Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Employee *</label>
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                    </div>
                    <select
                      className="form-select"
                      name="employee"
                      value={formData.employee}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.full_name} - {employee.department_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Check In Time</label>
                    <input
                      type="time"
                      className="form-control"
                      name="check_in_time"
                      value={formData.check_in_time}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Check Out Time</label>
                    <input
                      type="time"
                      className="form-control"
                      name="check_out_time"
                      value={formData.check_out_time}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Present">Present</option>
                      <option value="Late">Late</option>
                      <option value="Absent">Absent</option>
                      <option value="Half Day">Half Day</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Break Duration (Hours)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="break_duration"
                      value={formData.break_duration}
                      onChange={handleChange}
                      min="0"
                      max="8"
                      step="0.5"
                    />
                    <small className="form-text text-muted">
                      Default is 1 hour for lunch break
                    </small>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Any additional notes or comments..."
                  ></textarea>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/attendance/list')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Create Attendance
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Instructions</h6>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <h6 className="alert-heading">Creating Attendance Records</h6>
                <ul className="mb-0 small">
                  <li>Select the employee from the dropdown</li>
                  <li>Choose the attendance date (cannot be future)</li>
                  <li>Enter check-in and check-out times if available</li>
                  <li>Select appropriate status</li>
                  <li>Break duration is automatically considered</li>
                  <li>Total hours will be calculated automatically</li>
                </ul>
              </div>

              <div className="alert alert-warning">
                <h6 className="alert-heading">Important Notes</h6>
                <ul className="mb-0 small">
                  <li>Only one attendance record per employee per day</li>
                  <li>Check-out time must be after check-in time</li>
                  <li>Overtime will be calculated automatically</li>
                  <li>Status may be auto-determined based on times</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCreate;