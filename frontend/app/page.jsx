'use client';

import LoginView from '../components/LoginView';
import { useLab } from '../lib/LabContext';

export default function HomePage() {
  const { handleLogin, loginError } = useLab();

  return (
    <div className="container-fluid px-4 py-3">
      <LoginView onLogin={handleLogin} error={loginError} />
    </div>
  );
}
