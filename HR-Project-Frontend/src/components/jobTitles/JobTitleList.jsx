import React, { useState, useEffect } from 'react';
import { jobTitleService } from '../../services/jobTitles';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';

const JobTitleList = () => {
  const [jobTitles, setJobTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingJobTitle, setEditingJobTitle] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchJobTitles();
  }, [currentPage]);

  const fetchJobTitles = async () => {
    try {
      setLoading(true);
      const response = await jobTitleService.getJobTitles(currentPage);
      setJobTitles(response.results || response.data);
      setTotalPages(Math.ceil(response.count / 10));
      setTotalCount(response.count);
    } catch (err) {
      setError('Failed to fetch job titles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingJobTitle) {
        await jobTitleService.updateJobTitle(editingJobTitle.id, formData);
      } else {
        await jobTitleService.createJobTitle(formData);
      }
      
      setShowModal(false);
      setEditingJobTitle(null);
      setFormData({ name: '', description: '' });
      fetchJobTitles();
    } catch (err) {
      setError('Failed to save job title');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (jobTitle) => {
    setEditingJobTitle(jobTitle);
    setFormData({
      name: jobTitle.name,
      description: jobTitle.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job title?')) {
      try {
        await jobTitleService.deleteJobTitle(id);
        fetchJobTitles();
      } catch (err) {
        setError('Failed to delete job title');
      }
    }
  };

  const openCreateModal = () => {
    setEditingJobTitle(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Job Titles</h1>
        <button onClick={openCreateModal} className="btn btn-primary">
          <i className="fas fa-plus me-2"></i>
          Add Job Title
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
                      <th>Employees</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobTitles.map((jobTitle) => (
                      <tr key={jobTitle.id}>
                        <td className="fw-medium">{jobTitle.name}</td>
                        <td>{jobTitle.description || 'N/A'}</td>
                        <td>
                          <span className="badge bg-info">
                            {jobTitle.employee_count} employees
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              onClick={() => handleEdit(jobTitle)}
                              className="btn btn-outline-warning"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(jobTitle.id)}
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

              {jobTitles.length === 0 && (
                <div className="text-center py-4">
                  <i className="fas fa-briefcase fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No job titles found.</p>
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
                  {editingJobTitle ? 'Edit Job Title' : 'Create Job Title'}
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
                      editingJobTitle ? 'Update' : 'Create'
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

export default JobTitleList;