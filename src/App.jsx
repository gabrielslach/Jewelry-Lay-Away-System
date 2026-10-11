import { Route, Routes } from 'react-router-dom';
import { SessionProvider } from './components/SessionProvider.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
import StorefrontLayout from './layouts/StorefrontLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import Account from './pages/Account.jsx';
import Collections from './pages/Collections.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import PiecePage from './pages/PiecePage.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import AccountNotifications from './pages/AccountNotifications.jsx';
import Customers from './pages/admin/Customers.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import DuePayments from './pages/admin/DuePayments.jsx';
import AdminLogin from './pages/admin/Login.jsx';
import AdminNotifications from './pages/admin/Notifications.jsx';
import Orders from './pages/admin/Orders.jsx';
import PendingPayments from './pages/admin/PendingPayments.jsx';
import Settings from './pages/admin/Settings.jsx';
import './App.css';

export default function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <Routes>
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:id" element={<PiecePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/account" element={<Account />} />
            <Route path="/account/notifications" element={<AccountNotifications />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="payments" element={<PendingPayments />} />
            <Route path="payments/due" element={<DuePayments />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="customers" element={<Customers />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </ToastProvider>
    </SessionProvider>
  );
}
