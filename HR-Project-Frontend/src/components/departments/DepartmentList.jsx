import React, { useState, useEffect } from 'react';
import { departmentService } from '../../services/departments';
import { authService } from '../../services/auth';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: ''
  });

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, [currentPage]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getDepartments(currentPage);
      setDepartments(response.results || response.data);
      setTotalPages(Math.ceil(response.count / 10));
      setTotalCount(response.count);
    } catch (err) {
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authService.getUsers();
      setUsers(response);
    } catch (err) {
      console.error('Failed to fetch users');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingDepartment) {
        await departmentService.updateDepartment(editingDepartment.id, formData);
      } else {
        await departmentService.createDepartment(formData);
      }
      
      setShowModal(false);
      setEditingDepartment(null);
      setFormData({ name: '', description: '', manager: '' });
      fetchDepartments();
    } catch (err) {
      setError('Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      manager: department.manager || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await departmentService.deleteDepartment(id);
        fetchDepartments();
      } catch (err) {
        setError('Failed to delete department');
      }
    }
  };

  const openCreateModal = () => {
    setEditingDepartment(null);
    setFormData({ name: '', description: '', manager: '' });
    setShowModal(true);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Departments</h1>
        <button onClick={openCreateModal} className="btn btn-primary">
          <i className="fas fa-plus me-2"></i>
          Add Department
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Manager</th>
                      <th>Employees</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((department) => (
                      <tr key={department.id}>
                        <td className="fw-medium">{department.name}</td>
                        <td>{department.description || 'N/A'}</td>
                        <td>{department.manager_name || 'N/A'}</td>
                        <td>
                          <span className="badge bg-info">
                            {department.employee_count} employees
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              onClick={() => handleEdit(department)}
                              className="btn btn-outline-warning"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(department.id)}
                              className="btn btn-outline-danger"
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {departments.length === 0 && (
                <div className="text-center py-4">
                  <i className="fas fa-building fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No departments found.</p>
                </div>
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalCount}
                itemsPerPage={10}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingDepartment ? 'Edit Department' : 'Create Department'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Manager</label>
                    <select
                      className="form-select"
                      value={formData.manager}
                      onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                    >
                      <option value="">Select Manager</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
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
                        Saving...
                      </>
                    ) : (
                      editingDepartment ? 'Update' : 'Create'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentList;