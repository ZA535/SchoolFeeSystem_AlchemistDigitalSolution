import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NavLabel } from '../enums/labels.js';

export default function ResponsiveNav({ links, onNavigate }) {
  const [open, setOpen] = useState(false);

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <nav className="app-nav no-print" aria-label="Main">
      <button
        type="button"
        className="nav-toggle btn secondary"
        aria-expanded={open}
        aria-controls="main-nav-list"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? NavLabel.CLOSE_MENU : NavLabel.MENU}
      </button>
      <div id="main-nav-list" className={`nav-links ${open ? 'nav-links--open' : ''}`}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={close}
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
