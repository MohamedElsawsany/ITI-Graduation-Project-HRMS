// Updated src/components/common/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    setDropdownOpen(!dropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

        <div className="navbar-nav ms-auto d-flex flex-row align-items-center">
          {/* Notification Bell */}
          <NotificationBell />
          
          {/* User Dropdown */}
          <div className="nav-item dropdown ms-2" ref={dropdownRef}>
            <button
              className="btn btn-outline-light dropdown-toggle"
              onClick={toggleDropdown}
              aria-expanded={dropdownOpen}
            >
              <i className="fas fa-user me-2"></i>
              {user?.username}
            </button>
            <ul className={`dropdown-menu dropdown-menu-end ${dropdownOpen ? 'show' : ''}`}>
              <li>
                <span className="dropdown-item-text">
                  <small className="text-muted">Role: {user?.role}</small>
                </span>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <Link 
                  to={`/employees/${user?.employee_id}`} 
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="fas fa-user me-2"></i>
                  Profile
                </Link>
              </li>
              <li>
                <Link 
                  to="/notifications/preferences" 
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="fas fa-cog me-2"></i>
                  Notification Settings
                </Link>
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