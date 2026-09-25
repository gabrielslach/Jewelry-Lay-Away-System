import { NavLink, Route, Routes } from 'react-router-dom';
import './App.css';
import Admin from './pages/Admin.jsx';
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <div className="app">
      <nav className="nav" aria-label="Main">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/admin">Admin</NavLink>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}
