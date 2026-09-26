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
import Customers from './pages/admin/Customers.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Orders from './pages/admin/Orders.jsx';
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
            <Route path="/account" element={<Account />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </ToastProvider>
    </SessionProvider>
  );
}
