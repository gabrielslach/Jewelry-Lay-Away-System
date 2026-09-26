import { NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import Account from './pages/Account.jsx';
import Admin from './pages/Admin.jsx';
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <div className="app">
      <nav className="nav" aria-label="Main">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/account">My Account</NavLink>
        <NavLink to="/admin">Admin</NavLink>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/orders" element={<Admin />} />
          <Route path="/admin/customers" element={<Admin />} />
          <Route path="/admin/settings" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}
