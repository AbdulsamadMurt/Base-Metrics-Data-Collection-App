import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FacilitatorPortal from './pages/FacilitatorPortal';
import SupervisorPortal from './pages/SupervisorPortal';
import B1TaskPortal from './pages/B1TaskPortal';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';
import AdminPasswordGate from './components/AdminPasswordGate';
import PendingApprovalView from './components/PendingApprovalView';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { user, profile, loading, isAuthReady } = useAuth();

  if (loading || !isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2ea043]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // If user is pending approval and is not admin
  const isAdminUser = profile?.role === 'admin' || user.email === 'murtalaabdulsamad142@gmail.com';
  if (profile?.approvalStatus === 'pending' && !isAdminUser) {
    return <PendingApprovalView />;
  }

  if (roles && profile && !roles.includes(profile.role) && !isAdminUser) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const RoleHomeRedirect = () => {
  const { profile, user } = useAuth();
  const isAdminUser = profile?.role === 'admin' || user?.email === 'murtalaabdulsamad142@gmail.com';

  if (isAdminUser) {
    return <Navigate to="/admin" replace />;
  }
  if (profile?.role === 'b1_task') {
    return <Navigate to="/b1-task" replace />;
  }
  if (profile?.role === 'supervisor') {
    return <Navigate to="/supervisor" replace />;
  }
  return <Navigate to="/facilitator" replace />;
};

// Root route: Shows public Base Metrics landing page to unauthenticated visitors
// (satisfying Google OAuth Branding verification), while redirecting logged-in staff directly to their role home
const RootRoute = () => {
  const { user, loading, isAuthReady } = useAuth();

  if (loading || !isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2ea043]" />
      </div>
    );
  }

  if (user) {
    return <RoleHomeRedirect />;
  }

  return <Home />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          
          {/* Admin Live Metrics Dashboard (Restricted strictly to Admin) */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['admin']}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Facilitator Portal */}
          <Route path="/facilitator" element={
            <ProtectedRoute roles={['facilitator', 'admin']}>
              <Layout>
                <FacilitatorPortal />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Supervisor Portal */}
          <Route path="/supervisor" element={
            <ProtectedRoute roles={['supervisor', 'admin']}>
              <Layout>
                <SupervisorPortal />
              </Layout>
            </ProtectedRoute>
          } />

          {/* B1 Task Portal (For other sectors & custom field tasks) */}
          <Route path="/b1-task" element={
            <ProtectedRoute roles={['b1_task', 'admin']}>
              <Layout>
                <B1TaskPortal />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Admin Command Center */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <Layout>
                <AdminPasswordGate>
                  <AdminDashboard />
                </AdminPasswordGate>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
