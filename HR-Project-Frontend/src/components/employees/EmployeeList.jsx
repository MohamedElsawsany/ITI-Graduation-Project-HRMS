import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employeeService } from '../../services/employees';
import { departmentService } from '../../services/departments';
import { jobTitleService } from '../../services/jobTitles';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    job_title: '',
    active: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchJobTitles();
  }, [currentPage, filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      let response;
      
      if (searchTerm.trim()) {
        response = await employeeService.searchEmployees(searchTerm, currentPage);
      } else {
        response = await employeeService.getEmployees(currentPage, filters);
      }

      setEmployees(response.results || response.data);
      setTotalPages(Math.ceil(response.count / 10));
      setTotalCount(response.count);
    } catch (err) {
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments(1);
      setDepartments(response.results || response.data || []);
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchJobTitles = async () => {
    try {
      const response = await jobTitleService.getJobTitles(1);
      setJobTitles(response.results || response.data || []);
    } catch (err) {
      console.error('Failed to fetch job titles');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEmployees();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      await employeeService.updateEmployeeStatus(id, !currentStatus);
      fetchEmployees();
    } catch (err) {
      setError('Failed to update employee status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeService.deleteEmployee(id);
        fetchEmployees();
      } catch (err) {
        setError('Failed to delete employee');
      }
    }
  };

  if (loading && employees.length === 0) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Employees</h1>
        <Link to="/employees/create" className="btn btn-primary">
          <i className="fas fa-plus me-2"></i>
          Add Employee
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, phone, or national ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <select
                  className="form-select"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <select
                  className="form-select"
                  value={filters.job_title}
                  onChange={(e) => handleFilterChange('job_title', e.target.value)}
                >
                  <option value="">All Job Titles</option>
                  {jobTitles.map(title => (
                    <option key={title.id} value={title.id}>
                      {title.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <select
                  className="form-select"
                  value={filters.active}
                  onChange={(e) => handleFilterChange('active', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-outline-primary w-100">
                  <i className="fas fa-search me-2"></i>
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Employee Table */}
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
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Department</th>
                      <th>Job Title</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td>
                          <Link 
                            to={`/employees/${employee.id}`}
                            className="text-decoration-none fw-medium"
                          >
                            {employee.full_name || `${employee.first_name} ${employee.last_name}`}
                          </Link>
                        </td>
                        <td>{employee.user_email}</td>
                        <td>{employee.phone}</td>
                        <td>{employee.department_name}</td>
                        <td>{employee.job_title_name}</td>
                        <td>
                          <span className={`badge ${employee.is_active ? 'bg-success' : 'bg-danger'}`}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Link
                              to={`/employees/${employee.id}`}
                              className="btn btn-outline-primary"
                              title="View"
                            >
                              <i className="fas fa-eye"></i>
                            </Link>
                            <Link
                              to={`/employees/${employee.id}/edit`}
                              className="btn btn-outline-warning"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button
                              className={`btn ${employee.is_active ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                              onClick={() => handleStatusToggle(employee.id, employee.is_active)}
                              title={employee.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <i className={`fas ${employee.is_active ? 'fa-user-slash' : 'fa-user-check'}`}></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(employee.id)}
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

              {employees.length === 0 && !loading && (
                <div className="text-center py-4">
                  <i className="fas fa-users fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No employees found.</p>
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
    </div>
  );
};

export default EmployeeList;