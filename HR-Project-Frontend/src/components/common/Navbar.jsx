import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

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

        <div className="navbar-nav ms-auto">
          <div className="nav-item dropdown" ref={dropdownRef}>
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