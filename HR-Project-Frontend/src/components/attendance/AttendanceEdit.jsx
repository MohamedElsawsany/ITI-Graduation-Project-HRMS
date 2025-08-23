// src/components/attendance/AttendanceEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceService } from '../../services/attendance';
import LoadingSpinner from '../common/LoadingSpinner';

const AttendanceEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    check_in_time: '',
    check_out_time: '',
    status: 'Present',
    break_duration: '1.0',
    notes: ''
  });
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, [id]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getAttendance(id);
      setAttendance(response);
      setFormData({
        check_in_time: response.check_in_time || '',
        check_out_time: response.check_out_time || '',
        status: response.status || 'Present',
        break_duration: response.break_duration || '1.0',
        notes: response.notes || ''
      });
    } catch (err) {
      setError('Failed to fetch attendance record');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.check_in_time && formData.check_out_time) {
      if (formData.check_in_time >= formData.check_out_time) {
        setError('Check-out time must be after check-in time');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setSaving(true);
      await attendanceService.updateAttendance(id, formData);
      navigate('/attendance/list', { 
        state: { message: 'Attendance record updated successfully' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update attendance record');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <LoadingSpinner />;

  if (!attendance) {
    return (
      <div className="alert alert-danger">
        Attendance record not found.
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Edit Attendance Record</h1>
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
              <h5 className="mb-0">Edit Attendance Information</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
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
                      Break time is deducted from total work hours
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
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Update Attendance
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
              <h6 className="mb-0">Attendance Details</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label text-muted">Employee</label>
                <div className="fw-bold">
                  {attendance.employee_details?.full_name}
                </div>
                <small className="text-muted">
                  {attendance.employee_details?.department_name}
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted">Date</label>
                <div className="fw-bold">
                  {formatDate(attendance.date)}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted">Current Total Hours</label>
                <div className="fw-bold">
                  {attendance.total_hours ? `${attendance.total_hours} hours` : 'Not calculated'}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted">Current Overtime</label>
                <div className="fw-bold">
                  {attendance.overtime_hours > 0 ? `${attendance.overtime_hours} hours` : 'No overtime'}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted">Record Type</label>
                <div>
                  <span className={`badge ${attendance.is_manual_entry ? 'bg-warning' : 'bg-info'}`}>
                    {attendance.is_manual_entry ? 'Manual Entry' : 'System Entry'}
                  </span>
                </div>
              </div>

              {attendance.created_by_name && (
                <div className="mb-3">
                  <label className="form-label text-muted">Created By</label>
                  <div className="fw-bold">
                    {attendance.created_by_name}
                  </div>
                </div>
              )}

              <div className="alert alert-info">
                <h6 className="alert-heading">Auto Calculation</h6>
                <ul className="mb-0 small">
                  <li>Total hours will be recalculated automatically</li>
                  <li>Overtime is calculated if total hours 8</li>
                  <li>Break duration is deducted from work time</li>
                  <li>Status may be auto-adjusted based on times</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceEdit;