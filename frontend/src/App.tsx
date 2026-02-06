import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import Login from './features/auth/Login';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './features/dashboard/Dashboard';
import UserManagement from './features/users/UserManagement';
import CustomerManagement from './features/customers/CustomerManagement';
import CustomerList from './features/customers/CustomerList';
import CustomerForm from './features/customers/CustomerForm';
import IPOList from './features/customers/IPOList';
import IPOApplicationForm from './features/customers/IPOApplicationForm';
import BankList from './features/banks/BankList';
import './index.css';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route
              path="users"
              element={
                <ProtectedRoute requiredRole={['SUPERADMIN', 'ADMIN']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'CHECKER', 'ADMIN', 'SUPERADMIN']}>
                  <CustomerManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers-new"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'ADMIN', 'SUPERADMIN']}>
                  <CustomerList />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/new"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'ADMIN', 'SUPERADMIN']}>
                  <CustomerForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/:id"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'CHECKER', 'ADMIN', 'SUPERADMIN']}>
                  <CustomerForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="ipos"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'CHECKER', 'ADMIN', 'SUPERADMIN']}>
                  <IPOList />
                </ProtectedRoute>
              }
            />
            <Route
              path="ipo-applications/new"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'ADMIN', 'SUPERADMIN']}>
                  <IPOApplicationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/dashboard"
              element={
                <ProtectedRoute requiredRole={['SUPERADMIN']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="banks"
              element={
                <ProtectedRoute requiredRole={['ADMIN', 'SUPERADMIN']}>
                  <BankList />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
