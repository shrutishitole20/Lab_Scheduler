'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar({
  authState,
  countdown,
  onManualRefresh,
  onLogout,
  isRefreshing
}) {
  const pathname = usePathname();
  const isAdmin = authState?.role && authState.role.includes('ADMIN');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm" id="main-nav">
      <div className="container-fluid px-3 px-lg-4">
        <Link className="navbar-brand d-flex align-items-center" href="/dashboard">
          <i className="bi bi-hospital fs-4 me-2"></i>
          <span className="fw-bold">Lab Scheduler</span>
        </Link>

        {/* Mobile right-side quick actions + toggler */}
        <div className="d-flex d-lg-none align-items-center gap-2 ms-auto me-2">
          <button className="btn btn-sm btn-outline-light" onClick={onManualRefresh} title="Refresh now">
            <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin-animation' : ''}`}></i>
          </button>
          <button className="btn btn-sm btn-outline-light" onClick={onLogout}>
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-controls="navContent"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link
                href="/dashboard"
                className={`nav-link ${pathname === '/dashboard' ? 'active fw-bold' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-speedometer2 me-1"></i> Dashboard &amp; Queue
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/samples"
                className={`nav-link ${pathname === '/samples' ? 'active fw-bold' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-collection me-1"></i> Sample Management
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/register-sample"
                className={`nav-link ${pathname === '/register-sample' ? 'active fw-bold' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-plus-circle me-1"></i> Register Sample
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/reports"
                className={`nav-link ${pathname === '/reports' ? 'active fw-bold' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <i className="bi bi-file-earmark-bar-graph me-1"></i> Reports &amp; SLA
              </Link>
            </li>
            {isAdmin && (
              <li className="nav-item admin-only">
                <Link
                  href="/admin"
                  className={`nav-link ${pathname === '/admin' ? 'active fw-bold' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-shield-lock me-1"></i> Admin Console
                </Link>
              </li>
            )}
          </ul>

          {/* Desktop right-side user info */}
          <div className="d-none d-lg-flex align-items-center gap-3">
            <span className="badge bg-light text-dark px-2 py-1 d-flex align-items-center gap-1 shadow-sm" title="Auto-refreshes every 10s">
              <i className={`bi bi-arrow-repeat text-primary ${isRefreshing ? 'spin-animation' : ''}`}></i>
              Auto: <span>{countdown}</span>s
            </span>

            <button className="btn btn-sm btn-outline-light" onClick={onManualRefresh} title="Refresh now">
              <i className="bi bi-arrow-clockwise"></i>
            </button>

            <span className="badge bg-dark px-3 py-2 d-flex align-items-center gap-1">
              <i className="bi bi-person-circle"></i>
              <span>{authState?.username || 'User'}</span>
              <span className="badge bg-warning text-dark ms-1">
                {authState?.role ? authState.role.replace('ROLE_', '') : 'USER'}
              </span>
            </span>

            <button className="btn btn-sm btn-outline-light" onClick={onLogout}>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>

          {/* Mobile user info (shown inside the menu) */}
          <div className="d-flex d-lg-none align-items-center gap-2 py-2 border-top border-secondary mt-1">
            <span className="badge bg-dark px-3 py-2 d-flex align-items-center gap-1">
              <i className="bi bi-person-circle"></i>
              <span>{authState?.username || 'User'}</span>
              <span className="badge bg-warning text-dark ms-1">
                {authState?.role ? authState.role.replace('ROLE_', '') : 'USER'}
              </span>
            </span>
            <span className="badge bg-light text-dark px-2 py-1 d-flex align-items-center gap-1">
              <i className={`bi bi-arrow-repeat text-primary ${isRefreshing ? 'spin-animation' : ''}`}></i>
              <span>{countdown}</span>s
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
