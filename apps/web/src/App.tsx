import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box, Typography } from '@mui/material';
import Login from './pages/Login';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import DataSourceManager from './pages/DataSourceManager';
import DashboardListPage from './pages/DashboardListPage';
import DashboardCreatePage from './pages/DashboardCreatePage';
import DashboardEditPage from './pages/DashboardEditPage';
import UserManager from './pages/UserManager';
import UserProfile from './pages/UserProfile';
import PasswordReset from './pages/PasswordReset';
import PerformanceDashboard from './pages/PerformanceDashboard';


const Dashboard: React.FC = () => (
  <Container maxWidth="lg">
    <Box sx={{ my: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1">Welcome to BI Platform Dashboard</Typography>
    </Box>
  </Container>
);

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/data-sources"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DataSourceManager />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboards"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardListPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboards/new"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardCreatePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboards/:id/edit"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardEditPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRole="Admin">
            <MainLayout>
              <UserManager />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PerformanceDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
              <UserProfile />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/password-reset" element={<PasswordReset />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/unauthorized"
        element={
          <Container>
            <Typography variant="h4">Unauthorized</Typography>
            <Typography>You don't have permission to access this page.</Typography>
          </Container>
        }
      />
    </Routes>
  );
};

export default App;
