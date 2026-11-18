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
import { nameInitials } from './utils/initials.js';

const schoolName = import.meta.env.VITE_SCHOOL_NAME || 'School Fee Management';

function AppShell() {
  const { user, logout, canCollect, isAdmin } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/students', label: 'Students' },
    ...(canCollect ? [{ to: '/collect', label: 'Collect fee' }] : []),
    { to: '/vouchers', label: 'Fee vouchers' },
    { to: '/reports', label: 'Reports' },
    ...(isAdmin ? [{ to: '/users', label: 'Staff' }] : []),
  ];

  const roleLabel =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'accountant'
        ? 'Accountant'
        : user?.role === 'viewer'
          ? 'Viewer'
          : user?.role;

  return (
    <div className="app-shell">
      <div className="layout">
        <NetworkBanner />
        <header className="app-header no-print">
          <div className="header-row">
            <div className="brand">
              <span className="brand-mark" aria-hidden />
              <div>
                <h1 className="app-title">{schoolName}</h1>
                <p className="app-subtitle">Fee &amp; collections portal</p>
              </div>
            </div>
            <div className="user-chip">
              <span className="user-avatar" aria-hidden>
                {nameInitials(user?.full_name)}
              </span>
              <div className="user-chip__meta">
                <span className="user-chip__name">{user?.full_name}</span>
                <span className="user-chip__role">{roleLabel}</span>
              </div>
              <button type="button" className="btn btn-ghost small" onClick={logout}>
                Sign out
              </button>
            </div>
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