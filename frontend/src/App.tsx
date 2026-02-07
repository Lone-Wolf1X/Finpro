import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import Login from './features/auth/Login';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './features/dashboard/Dashboard';
import UserManagement from './features/users/UserManagement';
import SystemAccountManagement from './features/admin/SystemAccountManagement';
import SystemAccountDetails from './features/admin/SystemAccountDetails';
import TransactionVerification from './features/admin/TransactionVerification';
import KYCAlignment from './features/admin/KYCAlignment';

import CustomerList from './features/customers/CustomerList';
import CustomerForm from './features/customers/CustomerForm';
import IPOList from './features/customers/IPOList';
import IPOApplicationForm from './features/customers/IPOApplicationForm';
import IPOApplicationAdminList from './features/customers/IPOApplicationAdminList';
import IPOForm from './features/ipos/IPOForm';
import CustomerProfile from './features/customers/CustomerProfile';
import BulkDepositPage from './features/customers/BulkDepositPage';
import BulkDepositVerificationPage from './features/customers/BulkDepositVerificationPage';
import BankList from './features/banks/BankList';
import BankAccountDetails from './features/banking/BankAccountDetails';
import BankOperations from './features/banking/BankOperations';
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
                  <CustomerList />
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
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/:id/edit"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'ADMIN', 'SUPERADMIN']}>
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
              path="ipos/new"
              element={
                <ProtectedRoute requiredRole={['ADMIN', 'SUPERADMIN']}>
                  <IPOForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="ipos/:id/edit"
              element={
                <ProtectedRoute requiredRole={['ADMIN', 'SUPERADMIN']}>
                  <IPOForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="ipo-applications"
              element={
                <ProtectedRoute requiredRole={['CHECKER', 'ADMIN', 'SUPERADMIN']}>
                  <IPOApplicationAdminList />
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
              path="bulk-deposits/create"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'ADMIN', 'SUPERADMIN']}>
                  <BulkDepositPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="bulk-deposits/verify"
              element={
                <ProtectedRoute requiredRole={['CHECKER', 'ADMIN', 'SUPERADMIN']}>
                  <BulkDepositVerificationPage />
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
            <Route
              path="admin/system-accounts"
              element={
                <ProtectedRoute requiredRole={['ADMIN', 'SUPERADMIN']}>
                  <SystemAccountManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/system-accounts/:id"
              element={
                <ProtectedRoute requiredRole={['ADMIN', 'SUPERADMIN']}>
                  <SystemAccountDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="transactions/verify"
              element={
                <ProtectedRoute requiredRole={['CHECKER', 'ADMIN', 'SUPERADMIN']}>
                  <TransactionVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/kyc-alignment"
              element={
                <ProtectedRoute requiredRole={['ADMIN', 'SUPERADMIN']}>
                  <KYCAlignment />
                </ProtectedRoute>
              }
            />
            <Route
              path="banking/operations"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'ADMIN', 'SUPERADMIN']}>
                  <BankOperations />
                </ProtectedRoute>
              }
            />
            <Route
              path="banking/accounts/:id"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'CHECKER', 'ADMIN', 'SUPERADMIN']}>
                  <BankAccountDetails />
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
