import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.js';
import Students from './pages/Students.js';
import Vouchers from './pages/Vouchers.js';
import FeeCollection from './pages/FeeCollection.js';
import ReceiptPage from './pages/ReceiptPage.js';
import ChallanPage from './pages/ChallanPage.js';
import Login from './pages/Login.js';
import Reports from './pages/Reports.js';
import Users from './pages/Users.js';
import ProtectedApp from './components/ProtectedApp.js';
import ResponsiveNav from './components/ResponsiveNav.js';
import NetworkBanner from './components/NetworkBanner.js';
import { useAuth } from './auth/AuthContext.js';

function AppShell() {
  const { user, logout, canCollect, isAdmin } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/students', label: 'Students' },
    ...(canCollect ? [{ to: '/collect', label: 'Collect fee' }] : []),
    { to: '/vouchers', label: 'Fee Vouchers' },
    { to: '/reports', label: 'Reports' },
    ...(isAdmin ? [{ to: '/users', label: 'Staff users' }] : []),
  ];

  return (
    <div className="layout">
      <NetworkBanner />
      <header className="app-header">
        <div className="header-row">
          <div>
            <h1 className="app-title">School Fee Management</h1>
            <p className="app-subtitle">
              {user?.full_name} · {user?.role}
            </p>
          </div>
          <button type="button" className="btn secondary small" onClick={logout}>
            Sign out
          </button>
        </div>
        <ResponsiveNav links={links} />
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          {canCollect && <Route path="/collect" element={<FeeCollection />} />}
          <Route path="/vouchers" element={<Vouchers />} />
          <Route path="/reports" element={<Reports />} />
          {isAdmin && <Route path="/users" element={<Users />} />}
          <Route path="/receipt/:id" element={<ReceiptPage />} />
          <Route path="/challan/:id" element={<ChallanPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedApp />}>
        <Route path="/*" element={<AppShell />} />
      </Route>
    </Routes>
  );
}
