import { useState } from 'react';
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
import AppSidebar from './components/AppSidebar.js';
import NetworkBanner from './components/NetworkBanner.js';
import AppFooter from './components/AppFooter.js';
import { useAuth } from './auth/AuthContext.js';

const schoolName = import.meta.env.VITE_SCHOOL_NAME || 'School Fee Management';

function AppShell() {
  const { user, logout, canCollect, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/students', label: 'Students', icon: 'students' },
    ...(canCollect ? [{ to: '/collect', label: 'Collect fee', icon: 'collect' }] : []),
    { to: '/vouchers', label: 'Fee vouchers', icon: 'vouchers' },
    { to: '/reports', label: 'Reports', icon: 'reports' },
    ...(isAdmin ? [{ to: '/users', label: 'Staff', icon: 'staff' }] : []),
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
    <div className="app-frame">
      <AppSidebar
        links={links}
        schoolName={schoolName}
        user={user}
        roleLabel={roleLabel}
        onLogout={logout}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="app-main-column">
        <header className="topbar no-print">
          <button
            type="button"
            className="btn icon-btn secondary"
            aria-expanded={menuOpen}
            aria-controls="app-sidebar"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="icon-btn__bars" aria-hidden />
            Menu
          </button>
          <div className="topbar__titles">
            <span className="topbar__eyebrow">School fees</span>
            <span className="topbar__title">{schoolName}</span>
          </div>
        </header>

        <div className="app-main-inner">
          <NetworkBanner />
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
          <AppFooter />
        </div>
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
