import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <button 
          className="btn btn-outline-light d-md-none me-3"
          onClick={toggleSidebar}
        >
          <i className="fas fa-bars"></i>
        </button>
        
        <span className="navbar-brand mb-0 h1">
          <i className="fas fa-users me-2"></i>
          HR Management System
        </span>

        <div className="navbar-nav ms-auto">
          <div className="nav-item dropdown">
            <button
              className="btn btn-outline-light dropdown-toggle"
              data-bs-toggle="dropdown"
            >
              <i className="fas fa-user me-2"></i>
              {user?.username}
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <span className="dropdown-item-text">
                  <small className="text-muted">Role: {user?.role}</small>
                </span>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;