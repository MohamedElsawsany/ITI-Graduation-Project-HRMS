import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { departmentService } from '../../services/departments';
import { authService } from '../../services/auth';
import LoadingSpinner from '../common/LoadingSpinner';

const DepartmentEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: ''
  });

  useEffect(() => {
    fetchDepartment();
    fetchUsers();
  }, [id]);

  const fetchDepartment = async () => {
    try {
      const department = await departmentService.getDepartment(id);
      setFormData({
        name: department.name,
        description: department.description || '',
        manager: department.manager || ''
      });
    } catch (err) {
      setError('Failed to fetch department details');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authService.getUsers();
      setUsers(response);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await departmentService.updateDepartment(id, formData);
      navigate('/departments');
    } catch (err) {
      if (err.response?.data) {
        const errorMessages = Object.values(err.response.data).flat().join(', ');
        setError(errorMessages);
      } else {
        setError('Failed to update department');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <button
          onClick={() => navigate('/departments')}
          className="btn btn-outline-secondary me-3"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Edit Department</h1>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter department name"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-control"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter department description (optional)"
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Manager</label>
              <select
                name="manager"
                className="form-select"
                value={formData.manager}
                onChange={handleChange}
              >
                <option value="">Select Manager (optional)</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="d-flex gap-2">
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
                  <>
                    <i className="fas fa-save me-2"></i>
                    Update Department
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/departments')}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DepartmentEdit;