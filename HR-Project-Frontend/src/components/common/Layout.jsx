import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  return (
    <div className="d-flex position-relative">
      {/* Desktop Sidebar - Always visible on desktop */}
      <div className="d-none d-md-block">
        <Sidebar isVisible={true} onClose={closeSidebar} />
      </div>
      
      {/* Mobile Sidebar - Toggle visibility on mobile */}
      <div className="d-md-none">
        <Sidebar isVisible={sidebarVisible} onClose={closeSidebar} />
      </div>

      {/* Mobile overlay */}
      {sidebarVisible && (
        <div 
          className="d-md-none position-fixed w-100 h-100"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            top: 0,
            left: 0
          }}
          onClick={closeSidebar}
        />
      )}

      {/* Main content area */}
      <div className="flex-fill d-flex flex-column">
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="main-content flex-fill p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;