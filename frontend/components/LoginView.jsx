'use client';

import { useState } from 'react';

export default function LoginView({ onLogin, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await onLogin(username.trim(), password.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    onLogin(user, pass);
  };

  return (
    <div id="login-view" className="row justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="col-11 col-sm-8 col-md-5 col-lg-4">
        <div className="card shadow-lg p-3 p-sm-4">
          <div className="text-center mb-4">
            <div className="display-5 text-primary mb-2"><i className="bi bi-hospital"></i></div>
            <h4 className="fw-bold">Lab Sample Scheduler</h4>
            <p className="text-muted small">Sign in to access priority scheduling &amp; workload</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Username</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-person"></i></span>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin or staff"
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Password</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-key"></i></span>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="admin123 or staff123"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
              <i className="bi bi-box-arrow-in-right me-1"></i> {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <hr className="my-3" />
          <div className="small text-muted text-center mb-2">Quick Sign-In Credentials:</div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary flex-fill"
              onClick={() => handleQuickLogin('admin', 'admin123')}
            >
              <i className="bi bi-shield-lock me-1"></i> Admin
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary flex-fill"
              onClick={() => handleQuickLogin('staff', 'staff123')}
            >
              <i className="bi bi-person me-1"></i> Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
