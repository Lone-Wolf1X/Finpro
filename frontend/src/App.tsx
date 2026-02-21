import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import Login from './features/auth/Login';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './features/dashboard/Dashboard';
import UserManagement from './features/users/UserManagement';
import UserProfile from './features/users/UserProfile';
import AdminLimitRequests from './features/admin/AdminLimitRequests';
import SystemAccountManagement from './features/admin/SystemAccountManagement';
import SystemAccountDetails from './features/admin/SystemAccountDetails';
import BankingSystemAccountDetails from './features/banking/SystemAccountDetails';
import TransactionVerification from './features/admin/TransactionVerification';
import KYCAlignment from './features/admin/KYCAlignment';
import SuperAdminDashboard from './features/admin/SuperAdminDashboard';
import TenantManagement from './features/admin/TenantManagement';
import AdminMarketDashboard from './features/admin/AdminMarketDashboard';

import CustomerList from './features/customers/CustomerList';
import CustomerForm from './features/customers/CustomerForm';
import IPOList from './features/customers/IPOList';
import IPODetails from './features/customers/IPODetails';
import IPOApplicationForm from './features/customers/IPOApplicationForm';
import IPOApplicationManagement from './features/customers/IPOApplicationManagement';
import IPOForm from './features/ipos/IPOForm';
import IPOManagement from './features/ipos/IPOManagement';
import CustomerProfile from './features/customers/CustomerProfile';
import BulkCustomerUpload from './features/customers/BulkCustomerUpload';
import BulkDepositPage from './features/customers/BulkDepositPage';
import BulkIPOApplyPage from './features/customers/BulkIPOApplyPage';
import BulkDepositVerificationPage from './features/customers/BulkDepositVerificationPage';
import BankList from './features/banks/BankList';
import BankAccountDetails from './features/banking/BankAccountDetails';
import BankOperations from './features/banking/BankOperations';
import CapitalDepositForm from './features/admin/CapitalDepositForm';
import PortfolioList from './features/customers/PortfolioList';
import SecondaryMarketBuy from './features/customers/SecondaryMarketBuy';
import BankModule from './features/bank/BankModule';
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
              path="profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
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
              path="customers/bulk"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'ADMIN', 'SUPERADMIN']}>
                  <BulkCustomerUpload />
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
                <ProtectedRoute requiredRole={['ADMIN', 'SUPERADMIN']}>
                  <IPOManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="ipos/customer-view"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'CHECKER', 'ADMIN', 'SUPERADMIN']}>
                  <IPOList />
                </ProtectedRoute>
              }
            />
            <Route
              path="ipos/:id"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'CHECKER', 'ADMIN', 'SUPERADMIN']}>
                  <IPODetails />
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
                <ProtectedRoute requiredRole={['MAKER', 'CHECKER', 'ADMIN', 'SUPERADMIN']}>
                  <IPOApplicationManagement />
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
              path="ipo-applications/bulk"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'ADMIN', 'SUPERADMIN']}>
                  <BulkIPOApplyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="ipo-applications/:id/edit"
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
              path="admin/super-dashboard"
              element={
                <ProtectedRoute requiredRole={['SUPERADMIN']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/tenants"
              element={
                <ProtectedRoute requiredRole={['SUPERADMIN']}>
                  <TenantManagement />
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
              path="admin/limit-requests"
              element={
                <ProtectedRoute requiredRole={['ADMIN', 'SUPERADMIN']}>
                  <AdminLimitRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/market"
              element={
                <ProtectedRoute requiredRole={['ADMIN', 'SUPERADMIN']}>
                  <AdminMarketDashboard />
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
              path="bank-module"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'CHECKER', 'ADMIN', 'SUPERADMIN']}>
                  <BankModule />
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
            <Route
              path="banking/system-accounts/:id"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'CHECKER', 'ADMIN', 'SUPERADMIN']}>
                  <BankingSystemAccountDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="capital-deposits/create"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'ADMIN', 'SUPERADMIN']}>
                  <CapitalDepositForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="portfolio"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'CHECKER', 'ADMIN', 'SUPERADMIN', 'INVESTOR']}>
                  <PortfolioList />
                </ProtectedRoute>
              }
            />
            <Route
              path="secondary-market/buy"
              element={
                <ProtectedRoute requiredRole={['MAKER', 'CHECKER', 'ADMIN', 'SUPERADMIN', 'INVESTOR']}>
                  <SecondaryMarketBuy />
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
