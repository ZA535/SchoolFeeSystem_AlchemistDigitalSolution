import { NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Vouchers from './pages/Vouchers.jsx';
import FeeCollection from './pages/FeeCollection.jsx';
import ReceiptPage from './pages/ReceiptPage.jsx';
import ChallanPage from './pages/ChallanPage.jsx';

export default function App() {
  return (
    <div className="layout">
      <header>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem' }}>
          School Fee Management
        </h1>
        <p style={{ margin: '0 0 1rem', color: 'var(--muted)' }}>
          Track fees, vouchers, and payments
        </p>
        <nav className="nav no-print">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/students" className={({ isActive }) => (isActive ? 'active' : '')}>
            Students
          </NavLink>
          <NavLink to="/collect" className={({ isActive }) => (isActive ? 'active' : '')}>
            Collect fee
          </NavLink>
          <NavLink to="/vouchers" className={({ isActive }) => (isActive ? 'active' : '')}>
            Fee Vouchers
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/collect" element={<FeeCollection />} />
        <Route path="/vouchers" element={<Vouchers />} />
        <Route path="/receipt/:id" element={<ReceiptPage />} />
        <Route path="/challan/:id" element={<ChallanPage />} />
      </Routes>
    </div>
  );
}