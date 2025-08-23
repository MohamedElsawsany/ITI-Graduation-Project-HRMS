// src/components/common/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isVisible, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    {
      path: '/dashboard',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard',
      roles: ['admin', 'hr', 'employee']
    },
    {
      path: '/employees',
      icon: 'fas fa-users',
      label: 'Employees',
      roles: ['admin', 'hr']
    },
    {
      path: '/departments',
      icon: 'fas fa-building',
      label: 'Departments',
      roles: ['admin', 'hr']
    },
    {
      path: '/job-titles',
      icon: 'fas fa-briefcase',
      label: 'Job Titles',
      roles: ['admin', 'hr']
    },
    {
      path: '/attendance',
      icon: 'fas fa-clock',
      label: 'Attendance',
      roles: ['admin', 'hr', 'employee']
    },
    {
      path: '/attendance/list',
      icon: 'fas fa-calendar-alt',
      label: 'Attendance Records',
      roles: ['admin', 'hr', 'employee']
    },
    {
      path: '/attendance/my-summary',
      icon: 'fas fa-chart-line',
      label: 'My Attendance Summary',
      roles: ['admin', 'hr', 'employee']
    },
    {
      path: '/attendance/reports',
      icon: 'fas fa-chart-bar',
      label: 'Attendance Reports',
      roles: ['admin', 'hr']
    },
    {
      path: '/payrolls',
      icon: 'fas fa-money-bill-wave',
      label: 'Payroll Management',
      roles: ['admin', 'hr']
    },
    {
      path: '/my-payrolls',
      icon: 'fas fa-receipt',
      label: 'My Payrolls',
      roles: ['admin', 'hr', 'employee']
    },
    {
      path: '/leave-requests',
      icon: 'fas fa-calendar-alt',
      label: 'Leave Requests',
      roles: ['admin', 'hr']
    },
    {
      path: '/my-leave-requests',
      icon: 'fas fa-calendar-check',
      label: 'My Leave Requests',
      roles: ['admin', 'hr', 'employee']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className={`sidebar ${isVisible ? 'show' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-brand d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <i className="fas fa-users me-2"></i>
          <span className="d-none d-lg-inline">HR System</span>
          <span className="d-lg-none">HR</span>
        </div>
        {/* Mobile close button */}
        <button 
          className="btn btn-link text-white d-md-none p-0" 
          onClick={onClose}
          style={{ fontSize: '1.2rem' }}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      {/* Navigation Menu */}
      <nav className="mt-3">
        <ul className="nav flex-column">
          {filteredMenuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link d-flex align-items-center ${isActive(item.path) ? 'active' : ''}`}
                onClick={onClose}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;