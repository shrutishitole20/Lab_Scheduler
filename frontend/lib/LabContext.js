'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { DowntimeModal, HistoryModal } from '../components/Modals';
import Toast from '../components/Toast';
import { loginApi, fetchApi } from './api';

const LabContext = createContext(null);

export function LabProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [authState, setAuthState] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [machines, setMachines] = useState([]);
  const [queuedSamples, setQueuedSamples] = useState([]);
  const [allSamples, setAllSamples] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [users, setUsers] = useState([]);
  const [dailyReport, setDailyReport] = useState(null);
  const [reportDate, setReportDate] = useState('2026-11-18');

  // Modal states
  const [downtimeModalMachineId, setDowntimeModalMachineId] = useState(null);
  const [historyModalData, setHistoryModalData] = useState(null);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3500);
  }, []);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('lab_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAuthState(parsed);
      } catch (e) {
        sessionStorage.removeItem('lab_auth');
      }
    }
    setLoadingAuth(false);
  }, []);

  // Navigation guard based on authState and role
  useEffect(() => {
    if (loadingAuth) return;

    const isPublic = pathname === '/';
    const isAdminRoute = pathname === '/admin';

    if (!authState && !isPublic) {
      router.replace('/');
    } else if (authState && isPublic) {
      router.replace('/dashboard');
    } else if (authState && isAdminRoute && !authState.role?.includes('ADMIN')) {
      showToast('Access denied: Administrator privileges required.');
      router.replace('/dashboard');
    }
  }, [authState, loadingAuth, pathname, router, showToast]);

  // API loaders
  const loadMachines = useCallback(async (auth = authState) => {
    if (!auth) return;
    try {
      const res = await fetchApi('/api/machines', {}, auth);
      setMachines(res.data || []);
    } catch (e) {
      console.error('Error loading machines:', e);
    }
  }, [authState]);

  const loadQueue = useCallback(async (auth = authState) => {
    if (!auth) return;
    try {
      const [queueRes, samplesRes] = await Promise.all([
        fetchApi('/api/queue', {}, auth),
        fetchApi('/api/samples', {}, auth)
      ]);
      setQueuedSamples(queueRes.data || []);
      setAllSamples(samplesRes.data || []);
    } catch (e) {
      console.error('Error loading queue:', e);
    }
  }, [authState]);

  const loadTestTypes = useCallback(async (auth = authState) => {
    if (!auth) return;
    try {
      const res = await fetchApi('/api/test-types', {}, auth);
      setTestTypes(res.data || []);
    } catch (e) {
      console.error('Error loading test types:', e);
    }
  }, [authState]);

  const loadDailyReport = useCallback(async (date = reportDate, auth = authState) => {
    if (!auth || !date) return;
    try {
      const res = await fetchApi(`/api/reports/daily?date=${date}`, {}, auth);
      setDailyReport(res.data || null);
    } catch (e) {
      console.error('Error loading daily report:', e);
    }
  }, [authState, reportDate]);

  const loadAdminData = useCallback(async (auth = authState) => {
    if (!auth) return;
    try {
      const [mRes, pRes, tRes, uRes] = await Promise.all([
        fetchApi('/api/machines', {}, auth),
        fetchApi('/api/priorities', {}, auth),
        fetchApi('/api/test-types', {}, auth),
        fetchApi('/api/users', {}, auth)
      ]);
      setMachines(mRes.data || []);
      setPriorities(pRes.data || []);
      setTestTypes(tRes.data || []);
      setUsers(uRes.data || []);
    } catch (e) {
      console.error('Error loading admin data:', e);
    }
  }, [authState]);

  // Route-based data fetcher
  useEffect(() => {
    if (!authState) return;

    if (pathname === '/dashboard') {
      loadMachines();
      loadQueue();
    } else if (pathname === '/samples') {
      loadQueue();
    } else if (pathname === '/register-sample') {
      loadTestTypes();
    } else if (pathname === '/reports') {
      loadDailyReport();
    } else if (pathname === '/admin' && authState.role?.includes('ADMIN')) {
      loadAdminData();
    }
  }, [pathname, authState, loadMachines, loadQueue, loadTestTypes, loadDailyReport, loadAdminData]);

  // Auto-refresh countdown timer (every 10s on /dashboard)
  useEffect(() => {
    if (!authState) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (pathname === '/dashboard') {
            loadMachines();
            loadQueue();
          }
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [authState, pathname, loadMachines, loadQueue]);

  // Auth actions
  const handleLogin = async (username, password) => {
    setLoginError('');
    try {
      const data = await loginApi(username, password);
      const newAuth = {
        username,
        password,
        role: data.role
      };
      sessionStorage.setItem('lab_auth', JSON.stringify(newAuth));
      setAuthState(newAuth);
      showToast(`Welcome, ${username} (${data.role})`);
      router.push('/dashboard');
    } catch (err) {
      setLoginError(err.message || 'Could not connect to server.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('lab_auth');
    setAuthState(null);
    router.push('/');
    showToast('Signed out successfully.');
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setCountdown(10);
    try {
      if (pathname === '/dashboard') {
        await Promise.all([loadMachines(), loadQueue()]);
      } else if (pathname === '/samples') {
        await loadQueue();
      } else if (pathname === '/register-sample') {
        await loadTestTypes();
      } else if (pathname === '/reports') {
        await loadDailyReport();
      } else if (pathname === '/admin') {
        await loadAdminData();
      }
      showToast('Refreshed data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Operational actions
  const handleAutoDispatch = async () => {
    try {
      await fetchApi('/api/queue/dispatch', { method: 'POST' }, authState);
      showToast('Auto-dispatch evaluated: Queued samples allocated to available machines.');
      await Promise.all([loadMachines(), loadQueue()]);
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleCompleteSample = async (id) => {
    try {
      await fetchApi(`/api/samples/${id}/complete`, { method: 'POST' }, authState);
      showToast(`Sample ${id} completed.`);
      await Promise.all([loadMachines(), loadQueue()]);
    } catch (e) {
      showToast(e.message);
    }
  };

  const handlePutOnHold = async (id) => {
    try {
      await fetchApi(`/api/samples/${id}/hold`, { method: 'POST' }, authState);
      showToast(`Sample ${id} placed on hold.`);
      await Promise.all([loadMachines(), loadQueue()]);
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleReleaseFromHold = async (id) => {
    try {
      await fetchApi(`/api/samples/${id}/release`, { method: 'POST' }, authState);
      showToast(`Sample ${id} released from hold.`);
      await Promise.all([loadMachines(), loadQueue()]);
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleViewHistory = async (id) => {
    try {
      const res = await fetchApi(`/api/samples/${id}/history`, {}, authState);
      setHistoryModalData({ sampleId: id, list: res.data || [] });
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleConfirmMachineDown = async (machineId, reason) => {
    try {
      await fetchApi(`/api/machines/${machineId}/down`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      }, authState);
      setDowntimeModalMachineId(null);
      showToast(`Machine ${machineId} marked DOWN: ${reason}`);
      await loadMachines();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleToggleMachineUp = async (machineId) => {
    try {
      await fetchApi(`/api/machines/${machineId}/up`, { method: 'POST' }, authState);
      showToast(`Machine ${machineId} marked UP/AVAILABLE.`);
      await loadMachines();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleRegisterSample = async (payload) => {
    try {
      const res = await fetchApi('/api/samples', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, authState);
      showToast(`Sample ${res.data.id} registered and scheduled successfully!`);
      router.push('/dashboard');
    } catch (e) {
      showToast(e.message);
    }
  };

  // Admin actions
  const handleCreateMachine = async (payload) => {
    try {
      await fetchApi('/api/machines', { method: 'POST', body: JSON.stringify(payload) }, authState);
      showToast(`Machine ${payload.id} registered successfully.`);
      await loadAdminData();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleDeleteMachine = async (id) => {
    if (!confirm(`Are you sure you want to delete machine ${id}?`)) return;
    try {
      await fetchApi(`/api/machines/${id}`, { method: 'DELETE' }, authState);
      showToast(`Machine ${id} deleted.`);
      await loadAdminData();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleCreateUser = async (payload) => {
    try {
      await fetchApi('/api/users', { method: 'POST', body: JSON.stringify(payload) }, authState);
      showToast(`User '${payload.username}' created successfully.`);
      await loadAdminData();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Are you sure you want to delete user '${name}'?`)) return;
    try {
      await fetchApi(`/api/users/${id}`, { method: 'DELETE' }, authState);
      showToast(`User '${name}' deleted.`);
      await loadAdminData();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleCreatePriority = async (payload) => {
    try {
      await fetchApi('/api/priorities', { method: 'POST', body: JSON.stringify(payload) }, authState);
      showToast(`Priority tier '${payload.name}' configured.`);
      await loadAdminData();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleDeletePriority = async (id, name) => {
    if (!confirm(`Are you sure you want to delete priority tier '${name}'?`)) return;
    try {
      await fetchApi(`/api/priorities/${id}`, { method: 'DELETE' }, authState);
      showToast(`Priority '${name}' deleted.`);
      await loadAdminData();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleCreateTestType = async (payload) => {
    try {
      await fetchApi('/api/test-types', { method: 'POST', body: JSON.stringify(payload) }, authState);
      showToast(`Test category '${payload.name}' registered.`);
      await loadAdminData();
    } catch (e) {
      showToast(e.message);
    }
  };

  const handleDeleteTestType = (name) => {
    if (!confirm(`Delete test category '${name}'?`)) return;
    showToast(`Note: Category '${name}' is preserved if actively referenced by samples.`);
  };

  const contextValue = useMemo(() => ({
    authState,
    loadingAuth,
    loginError,
    countdown,
    isRefreshing,
    machines,
    queuedSamples,
    allSamples,
    testTypes,
    priorities,
    users,
    dailyReport,
    reportDate,
    setReportDate,
    showToast,
    loadMachines,
    loadQueue,
    loadTestTypes,
    loadDailyReport,
    loadAdminData,
    handleLogin,
    handleLogout,
    handleManualRefresh,
    handleAutoDispatch,
    handleCompleteSample,
    handlePutOnHold,
    handleReleaseFromHold,
    handleViewHistory,
    setDowntimeModalMachineId,
    setHistoryModalData,
    handleConfirmMachineDown,
    handleToggleMachineUp,
    handleRegisterSample,
    handleCreateMachine,
    handleDeleteMachine,
    handleCreateUser,
    handleDeleteUser,
    handleCreatePriority,
    handleDeletePriority,
    handleCreateTestType,
    handleDeleteTestType
  }), [
    authState,
    loadingAuth,
    loginError,
    countdown,
    isRefreshing,
    machines,
    queuedSamples,
    allSamples,
    testTypes,
    priorities,
    users,
    dailyReport,
    reportDate,
    showToast,
    loadMachines,
    loadQueue,
    loadTestTypes,
    loadDailyReport,
    loadAdminData
  ]);

  if (loadingAuth) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Lab Scheduler...</span>
        </div>
      </div>
    );
  }

  // Prevent flash of protected routes if not authenticated
  if (!authState && pathname !== '/') {
    return null;
  }

  // Prevent flash of public route if already authenticated
  if (authState && pathname === '/') {
    return null;
  }

  // Prevent flash of admin route if not authorized
  if (authState && pathname === '/admin' && !authState.role?.includes('ADMIN')) {
    return null;
  }

  return (
    <LabContext.Provider value={contextValue}>
      {authState && (
        <Navbar
          authState={authState}
          countdown={countdown}
          onManualRefresh={handleManualRefresh}
          onLogout={handleLogout}
          isRefreshing={isRefreshing}
        />
      )}

      {children}

      {/* Downtime Modal */}
      {downtimeModalMachineId && (
        <DowntimeModal
          machineId={downtimeModalMachineId}
          onClose={() => setDowntimeModalMachineId(null)}
          onConfirm={handleConfirmMachineDown}
        />
      )}

      {/* History Modal */}
      {historyModalData && (
        <HistoryModal
          sampleId={historyModalData.sampleId}
          historyList={historyModalData.list}
          onClose={() => setHistoryModalData(null)}
        />
      )}

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast({ show: false, message: '' })} />
    </LabContext.Provider>
  );
}

export function useLab() {
  const context = useContext(LabContext);
  if (!context) {
    throw new Error('useLab must be used within a LabProvider');
  }
  return context;
}
