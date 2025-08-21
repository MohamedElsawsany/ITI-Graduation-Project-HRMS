import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobTitleService } from '../../services/jobTitles';
import LoadingSpinner from '../common/LoadingSpinner';

const JobTitleEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchJobTitle();
  }, [id]);

  const fetchJobTitle = async () => {
    try {
      const jobTitle = await jobTitleService.getJobTitle(id);
      setFormData({
        name: jobTitle.name,
        description: jobTitle.description || ''
      });
    } catch (err) {
      setError('Failed to fetch job title details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await jobTitleService.updateJobTitle(id, formData);
      navigate('/job-titles');
    } catch (err) {
      if (err.response?.data) {
        const errorMessages = Object.values(err.response.data).flat().join(', ');
        setError(errorMessages);
      } else {
        setError('Failed to update job title');
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
          onClick={() => navigate('/job-titles')}
          className="btn btn-outline-secondary me-3"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Edit Job Title</h1>
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
                placeholder="Enter job title name"
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-control"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter job title description (optional)"
              />
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
                    Update Job Title
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/job-titles')}
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

export default JobTitleEdit;