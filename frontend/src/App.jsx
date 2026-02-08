import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import MSMEPortal from './pages/MSMEPortal';
import SavedAddressesPage from './pages/SavedAddressesPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import SettingsPage from './pages/SettingsPage';
import ShipmentsPage from './pages/ShipmentsPage';
import DriverDashboard from './pages/DriverDashboard';
import DriverOrders from './pages/DriverOrders';
import DriverSettings from './pages/DriverSettings';
import AdminSettings from './pages/AdminSettings';
import AdminTrips from './pages/AdminTrips';
import LandingPage from './components/LandingPage';
import DriverSignup from './pages/DriverSignup';

import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/driver-signup" element={<DriverSignup />} />

          <Route path="/admin" element={
            <ProtectedRoute role="SUPER_ADMIN">
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/zones" element={
            <ProtectedRoute role="SUPER_ADMIN">
              <AppLayout>
                <AdminDashboard activeTab="zones" />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute role="SUPER_ADMIN">
              <AppLayout>
                <AdminSettings />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/trips" element={
            <ProtectedRoute role="SUPER_ADMIN">
              <AppLayout>
                <AdminTrips />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/msme" element={
            <ProtectedRoute role="MSME">
              <AppLayout>
                <MSMEPortal />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/msme/addresses" element={
            <ProtectedRoute role="MSME">
              <AppLayout>
                <SavedAddressesPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/msme/shipments" element={
            <ProtectedRoute role="MSME">
              <AppLayout>
                <ShipmentsPage />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/msme/settings" element={
            <ProtectedRoute role="MSME">
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/driver" element={
            <ProtectedRoute role="DRIVER">
              <AppLayout>
                <DriverDashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/driver/orders" element={
            <ProtectedRoute role="DRIVER">
              <AppLayout>
                <DriverOrders />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/driver/settings" element={
            <ProtectedRoute role="DRIVER">
              <AppLayout>
                <DriverSettings />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/" element={<LandingPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
