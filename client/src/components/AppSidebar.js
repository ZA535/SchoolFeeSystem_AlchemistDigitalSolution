import { NavLink } from 'react-router-dom';
import NavIcon from './NavIcon.js';
import { nameInitials } from '../utils/initials.js';

export default function AppSidebar({
  links,
  schoolName,
  user,
  roleLabel,
  onLogout,
  open,
  onClose,
}) {
  return (
    <>
      <button
        type="button"
        className={`sidebar-backdrop no-print ${open ? 'is-visible' : ''}`}
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        id="app-sidebar"
        className={`sidebar no-print ${open ? 'sidebar--open' : ''}`}
        aria-label="Application"
      >
        <div className="sidebar-brand">
          <span className="brand-mark brand-mark--sidebar" aria-hidden />
          <div className="sidebar-brand__text">
            <span className="sidebar-brand__eyebrow">Fee portal</span>
            <strong className="sidebar-brand__name">{schoolName}</strong>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          <p className="sidebar-nav__label">Menu</p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar-link__icon">
                <NavIcon name={link.icon} />
              </span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className="user-avatar user-avatar--sidebar" aria-hidden>
            {nameInitials(user?.full_name)}
          </span>
          <div className="sidebar-user__meta">
            <span className="sidebar-user__name">{user?.full_name}</span>
            <span className="sidebar-user__role">{roleLabel}</span>
          </div>
          <button type="button" className="btn btn-sidebar small" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}