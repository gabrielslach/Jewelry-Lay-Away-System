import { NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import StorefrontLayout from './layouts/StorefrontLayout.jsx';
import Account from './pages/Account.jsx';
import Admin from './pages/Admin.jsx';
import Home from './pages/Home.jsx';

function AdminShell() {
  return (
    <div className="app">
      <nav className="nav" aria-label="Main">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/admin">Admin</NavLink>
      </nav>
      <main>
        <Admin />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/account" element={<Account />} />
      </Route>
      <Route path="/admin" element={<AdminShell />} />
      <Route path="/admin/orders" element={<AdminShell />} />
      <Route path="/admin/customers" element={<AdminShell />} />
      <Route path="/admin/settings" element={<AdminShell />} />
    </Routes>
  );
}
