// Updated src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import EmployeeList from './components/employees/EmployeeList';
import EmployeeDetails from './components/employees/EmployeeDetails';
import EmployeeCreate from './components/employees/EmployeeCreate';
import EmployeeEdit from './components/employees/EmployeeEdit';
import DepartmentList from './components/departments/DepartmentList';
import JobTitleList from './components/jobTitles/JobTitleList';
import LeaveRequestList from './components/leaves/LeaveRequestList';
import MyLeaveRequests from './components/leaves/MyLeaveRequests';
import PayrollList from './components/payroll/PayrollList';
import MyPayrolls from './components/payroll/MyPayrolls';
import PayrollDetails from './components/payroll/PayrollDetails';
import PayrollCreate from './components/payroll/PayrollCreate';
import PayrollEdit from './components/payroll/PayrollEdit';
import PayrollSummary from './components/payroll/PayrollSummary';
// Attendance Components
import AttendanceDashboard from './components/attendance/AttendanceDashboard';
import AttendanceList from './components/attendance/AttendanceList';
import AttendanceCreate from './components/attendance/AttendanceCreate';
import AttendanceEdit from './components/attendance/AttendanceEdit';
import MyAttendanceSummary from './components/attendance/MyAttendanceSummary';
import AttendanceReports from './components/attendance/AttendanceReports';
// Notification Components
import NotificationList from './components/notifications/NotificationList';
import NotificationCreate from './components/notifications/NotificationCreate';
import NotificationPreferences from './components/notifications/NotificationPreferences';
import Layout from './components/common/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login" />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" /> : <Login />} 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Employee Routes */}
      <Route
        path="/employees"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <EmployeeList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/create"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <EmployeeCreate />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:id"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr','employee']}>
            <Layout>
              <EmployeeDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <EmployeeEdit />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Department & Job Title Routes */}
      <Route
        path="/departments"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <DepartmentList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/job-titles"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <JobTitleList />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Leave Routes */}
      <Route
        path="/leave-requests"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <LeaveRequestList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-leave-requests"
        element={
          <ProtectedRoute>
            <Layout>
              <MyLeaveRequests />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Payroll Routes */}
      <Route
        path="/payrolls"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <PayrollList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payrolls/create"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <PayrollCreate />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payrolls/summary"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <PayrollSummary />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payrolls/:id"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr', 'employee']}>
            <Layout>
              <PayrollDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payrolls/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <PayrollEdit />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-payrolls"
        element={
          <ProtectedRoute>
            <Layout>
              <MyPayrolls />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Attendance Routes */}
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <Layout>
              <AttendanceDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/list"
        element={
          <ProtectedRoute>
            <Layout>
              <AttendanceList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/create"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <AttendanceCreate />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <AttendanceEdit />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/my-summary"
        element={
          <ProtectedRoute>
            <Layout>
              <MyAttendanceSummary />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/reports"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <AttendanceReports />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Notification Routes */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <NotificationList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications/create"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <Layout>
              <NotificationCreate />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications/preferences"
        element={
          <ProtectedRoute>
            <Layout>
              <NotificationPreferences />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;