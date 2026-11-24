

let authState = null;
let refreshTimer = null;
let countdownSeconds = 10;
let currentTab = 'dashboard';
let cachedAllSamples = [];
let currentSampleFilter = 'ALL';
let currentDailyReportSamples = [];

document.addEventListener('DOMContentLoaded', () => {

    const saved = sessionStorage.getItem('lab_auth');
    if (saved) {
        try {
            authState = JSON.parse(saved);
            initializeAuthenticatedView();
        } catch (e) {
            sessionStorage.removeItem('lab_auth');
            showLoginView();
        }
    } else {
        showLoginView();
    }

    const today = new Date().toISOString().split('T')[0];
    const reportPicker = document.getElementById('report-date-picker');
    if (reportPicker) {
        reportPicker.value = '2026-11-18';
    }
});

function showLoginView() {
    document.getElementById('main-nav').style.display = 'none';
    document.getElementById('login-view').style.display = 'flex';
    document.querySelectorAll('.tab-content-section').forEach(el => el.style.display = 'none');
    clearInterval(refreshTimer);
}

function initializeAuthenticatedView() {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('main-nav').style.display = 'flex';
    document.getElementById('user-display').textContent = authState.username;
    document.getElementById('role-display').textContent = authState.role ? authState.role.replace('ROLE_', '') : 'USER';

    const isAdmin = authState.role && authState.role.includes('ADMIN');
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'block' : 'none';
    });

    populateTestTypeDropdown();

    showTab('dashboard');
    startAutoRefresh();
}

async function handleLogin(event) {
    if (event) event.preventDefault();
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    const alertBox = document.getElementById('login-alert');
    const loginBtn = document.getElementById('login-btn');

    if (loginBtn) loginBtn.disabled = true;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            alertBox.textContent = data.message || 'Invalid username or password.';
            alertBox.style.display = 'block';
            return;
        }

        authState = {
            username: user,
            password: pass,
            role: data.data.role
        };
        sessionStorage.setItem('lab_auth', JSON.stringify(authState));
        alertBox.style.display = 'none';
        initializeAuthenticatedView();
        showToast('Welcome, ' + user + ' (' + authState.role + ')');
    } catch (err) {
        alertBox.textContent = 'Could not connect to server. Is Spring Boot running?';
        alertBox.style.display = 'block';
    } finally {
        if (loginBtn) loginBtn.disabled = false;
    }
}

function quickLogin(user, pass) {
    document.getElementById('login-username').value = user;
    document.getElementById('login-password').value = pass;
    handleLogin();
}

function logout() {
    sessionStorage.removeItem('lab_auth');
    authState = null;
    showLoginView();
    showToast('Signed out successfully.');
}

async function fetchApi(url, options = {}) {
    if (!authState) throw new Error('Not authenticated');

    const headers = options.headers || {};
    headers['Authorization'] = 'Basic ' + btoa(authState.username + ':' + authState.password);
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    options.headers = headers;

    const response = await fetch(url, options);

    if (response.status === 401) {
        logout();
        throw new Error('Session expired or unauthorized.');
    }
    if (response.status === 403) {
        showToast('Access Denied: Admin role required for this action.');
        throw new Error('Access Denied: Admin role required.');
    }

    const data = await response.json();
    if (!response.ok && !data.success) {
        const errorMsg = data.message || (data.details ? data.details.join(', ') : 'Request failed');
        showToast(errorMsg);
        throw new Error(errorMsg);
    }
    return data;
}

function showTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-content-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    const activeNav = document.getElementById('nav-' + tabName);
    if (activeNav) activeNav.classList.add('active');

    const activeView = document.getElementById(tabName + '-view');
    if (activeView) activeView.style.display = 'block';

    if (tabName === 'dashboard') {
        loadDashboard();
    } else if (tabName === 'samples') {
        loadAllSamplesTable();
    } else if (tabName === 'register') {
        populateTestTypeDropdown();
    } else if (tabName === 'reports') {
        fetchDailyReport();
    } else if (tabName === 'admin') {
        loadAdminOverview();
    }
}

function startAutoRefresh() {
    clearInterval(refreshTimer);
    countdownSeconds = 10;
    const countdownEl = document.getElementById('countdown');

    refreshTimer = setInterval(() => {
        countdownSeconds--;
        if (countdownEl) countdownEl.textContent = countdownSeconds;

        if (countdownSeconds <= 0) {
            countdownSeconds = 10;
            if (currentTab === 'dashboard') {
                loadDashboard(false);
            }
        }
    }, 1000);
}

function manualRefresh() {
    countdownSeconds = 10;
    if (currentTab === 'dashboard') loadDashboard(true);
    else if (currentTab === 'samples') loadAllSamplesTable();
    else if (currentTab === 'reports') fetchDailyReport();
    else if (currentTab === 'admin') loadAdminOverview();
    showToast('Refreshed data.');
}

async function loadDashboard(showIndicator = false) {
    const spinner = document.getElementById('refresh-spinner');
    if (spinner) spinner.classList.add('spin-animation');

    try {
        await Promise.all([loadMachines(), loadLiveQueue()]);
    } catch (e) {
        console.error('Error loading dashboard:', e);
    } finally {
        if (spinner) spinner.classList.remove('spin-animation');
    }
}

async function loadMachines() {
    const container = document.getElementById('machines-container');
    if (!container) return;

    try {
        const result = await fetchApi('/api/machines');
        const machines = result.data || [];

        if (machines.length === 0) {
            container.innerHTML = '<div class="col-12"><div class="alert alert-info py-3 text-center">No machines registered in laboratory. Add equipment from the Admin Panel.</div></div>';
            return;
        }

        container.innerHTML = machines.map(m => {
            const load = m.currentLoad || 0;
            const cap = m.capacity || 1;
            const pct = Math.min(100, Math.round((load / cap) * 100));
            const isDown = !m.available;
            const statusBadge = isDown
                ? '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>DOWN</span>'
                : (load >= cap ? '<span class="badge bg-warning text-dark"><i class="bi bi-lightning-fill me-1"></i>FULL</span>' : '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>AVAILABLE</span>');

            const testBadges = (m.supportedTestTypes && m.supportedTestTypes.length > 0)
                ? m.supportedTestTypes.map(t => `<span class="badge bg-light text-dark border me-1">${t}</span>`).join('')
                : '<span class="text-muted small">None configured</span>';

            return `
                <div class="col-md-6 col-lg-4">
                    <div class="card machine-card shadow-sm h-100 ${isDown ? 'machine-down' : ''}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="fw-bold mb-0 text-dark">${m.name}</h6>
                                    <span class="badge bg-secondary text-uppercase">${m.id}</span>
                                </div>
                                ${statusBadge}
                            </div>

                            <div class="mb-3">
                                <div class="d-flex justify-content-between small text-muted mb-1">
                                    <span>Workload:</span>
                                    <span class="fw-bold">${load} / ${cap} active slots (${cap - load} free)</span>
                                </div>
                                <div class="progress" style="height: 9px;">
                                    <div class="progress-bar ${isDown ? 'bg-secondary' : (load >= cap ? 'bg-danger' : (load > 0 ? 'bg-primary' : 'bg-success'))}"
                                         style="width: ${pct}%"></div>
                                </div>
                            </div>

                            <div class="small mb-3">
                                <span class="text-muted d-block mb-1">Compatible Tests:</span>
                                <div>${testBadges}</div>
                            </div>

                            <div class="border-top pt-2 d-flex justify-content-end gap-2">
                                ${isDown
                                    ? `<button class="btn btn-sm btn-outline-success" onclick="toggleMachineAvailable('${m.id}')">
                                           <i class="bi bi-play-circle me-1"></i> Mark Available
                                       </button>`
                                    : `<button class="btn btn-sm btn-outline-danger" onclick="openDowntimeModal('${m.id}')">
                                           <i class="bi bi-power me-1"></i> Mark Down
                                       </button>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        container.innerHTML = '<div class="col-12 text-danger small">Failed to load machines.</div>';
    }
}

async function loadLiveQueue() {
    const tbody = document.getElementById('queue-table-body');
    const countBadge = document.getElementById('queue-count-badge');
    if (!tbody) return;

    try {
        const [queueRes, samplesRes] = await Promise.all([
            fetchApi('/api/queue'),
            fetchApi('/api/samples')
        ]);

        const queuedSamples = queueRes.data || [];
        const allSamples = samplesRes.data || [];

        const activeProcessing = allSamples.filter(s => s.status === 'PROCESSING' || s.status === 'ON_HOLD');
        const combined = [...activeProcessing, ...queuedSamples];

        if (countBadge) {
            countBadge.textContent = `${combined.length} Active (${queuedSamples.length} Queued, ${activeProcessing.length} Processing)`;
        }

        if (combined.length === 0) {
            tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted py-4"><i class="bi bi-inbox fs-3 d-block mb-2"></i>No samples currently in queue or processing.</td></tr>`;
            return;
        }

        const now = new Date();

        tbody.innerHTML = combined.map((s, idx) => {
            const deadline = new Date(s.deadline);
            const received = new Date(s.receivedTime);
            const targetMs = (s.targetMinutes || 30) * 60 * 1000;
            const elapsedMs = now - received;

            let rowClass = 'sample-ontime';
            let slaBadge = '<span class="badge badge-ontime"><i class="bi bi-check-circle me-1"></i>On Track</span>';

            if (s.status === 'COMPLETED') {
                slaBadge = '<span class="badge bg-secondary">Done</span>';
            } else if (now >= deadline) {
                rowClass = 'sample-overdue';
                slaBadge = '<span class="badge badge-overdue"><i class="bi bi-exclamation-triangle-fill me-1"></i>OVERDUE</span>';
            } else if (elapsedMs >= (targetMs * 0.8)) {
                rowClass = 'sample-approaching';
                slaBadge = '<span class="badge badge-approaching"><i class="bi bi-clock-fill me-1"></i>APPROACHING</span>';
            }

            if (s.priority === 'EMERGENCY') {
                rowClass += ' sample-emergency';
            }

            const prioBadge = s.priority === 'EMERGENCY'
                ? '<span class="badge bg-danger shadow-sm"><i class="bi bi-lightning-charge-fill me-1"></i>EMERGENCY</span>'
                : (s.priority === 'HIGH'
                    ? '<span class="badge bg-warning text-dark">HIGH</span>'
                    : (s.priority === 'LOW' ? '<span class="badge bg-secondary">LOW</span>' : '<span class="badge bg-info text-dark">NORMAL</span>'));

            const statusBadge = s.status === 'PROCESSING'
                ? '<span class="badge bg-primary"><i class="bi bi-gear-wide-connected me-1"></i>PROCESSING</span>'
                : (s.status === 'ON_HOLD' ? '<span class="badge bg-secondary">ON_HOLD</span>' : '<span class="badge bg-dark">QUEUED</span>');

            const specimenDetails = `${s.sampleType || 'Specimen'} <span class="text-muted small">(${s.testCategory || 'General'})</span>`;

            return `
                <tr class="${rowClass}">
                    <td class="fw-bold text-muted">#${idx + 1}</td>
                    <td><span class="fw-bold text-primary">${s.id}</span></td>
                    <td><span class="fw-semibold">${s.testType}</span></td>
                    <td class="small">${specimenDetails}</td>
                    <td>${prioBadge}</td>
                    <td>${s.targetMinutes} min</td>
                    <td class="small text-muted">${formatDate(s.receivedTime)}</td>
                    <td class="small fw-semibold">${formatDate(s.deadline)}</td>
                    <td>${statusBadge}</td>
                    <td>${s.assignedMachineId ? `<span class="badge bg-dark">${s.assignedMachineId}</span>` : '<span class="text-muted">-</span>'}</td>
                    <td>${slaBadge}</td>
                    <td class="text-center">
                        <div class="btn-group" role="group">
                            ${s.status === 'PROCESSING'
                                ? `<button class="btn btn-sm btn-success" title="Complete Processing" onclick="completeSample('${s.id}')">
                                       <i class="bi bi-check-lg"></i> Complete
                                   </button>`
                                : ''
                            }
                            ${s.status === 'QUEUED'
                                ? `<button class="btn btn-sm btn-warning" title="Put On Hold" onclick="putOnHold('${s.id}')">
                                       <i class="bi bi-pause"></i> Hold
                                   </button>`
                                : ''
                            }
                            ${s.status === 'ON_HOLD'
                                ? `<button class="btn btn-sm btn-info" title="Release from Hold" onclick="releaseFromHold('${s.id}')">
                                       <i class="bi bi-play"></i> Release
                                   </button>`
                                : ''
                            }
                            <button class="btn btn-sm btn-outline-secondary" title="View Audit Trail" onclick="viewHistory('${s.id}')">
                                <i class="bi bi-clock-history"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-center text-danger py-4">Error loading priority queue.</td></tr>`;
    }
}

async function triggerAutoDispatch() {
    try {
        const res = await fetchApi('/api/queue/dispatch', { method: 'POST' });
        showToast('Auto-dispatch evaluated: Queued samples allocated to available machines.');
        loadDashboard();
    } catch (e) {
        console.error(e);
    }
}

async function loadAllSamplesTable() {
    const tbody = document.getElementById('all-samples-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="11" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading all registered samples...</td></tr>`;

    try {
        const res = await fetchApi('/api/samples');
        cachedAllSamples = res.data || [];
        renderFilteredSamplesTable();
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="11" class="text-center text-danger py-4">Error loading samples registry.</td></tr>`;
    }
}

function filterSamples(status, btnElement) {
    currentSampleFilter = status;
    document.querySelectorAll('#sample-status-filters .filter-btn').forEach(btn => {
        btn.classList.remove('btn-primary', 'active');
        btn.classList.add('btn-outline-secondary');
    });
    if (btnElement) {
        btnElement.classList.remove('btn-outline-secondary');
        btnElement.classList.add('btn-primary', 'active');
    }
    renderFilteredSamplesTable();
}

function searchSamplesTable() {
    renderFilteredSamplesTable();
}

function renderFilteredSamplesTable() {
    const tbody = document.getElementById('all-samples-table-body');
    if (!tbody) return;

    const query = (document.getElementById('sample-search-input')?.value || '').trim().toLowerCase();

    let list = cachedAllSamples;
    if (currentSampleFilter !== 'ALL') {
        list = list.filter(s => s.status === currentSampleFilter);
    }

    if (query) {
        list = list.filter(s =>
            (s.id && s.id.toLowerCase().includes(query)) ||
            (s.testType && s.testType.toLowerCase().includes(query)) ||
            (s.sampleType && s.sampleType.toLowerCase().includes(query)) ||
            (s.assignedMachineId && s.assignedMachineId.toLowerCase().includes(query))
        );
    }

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="text-center text-muted py-4">No samples matching filter criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(s => {
        const prioBadge = s.priority === 'EMERGENCY'
            ? '<span class="badge bg-danger">EMERGENCY</span>'
            : (s.priority === 'HIGH' ? '<span class="badge bg-warning text-dark">HIGH</span>' : '<span class="badge bg-info text-dark">NORMAL</span>');

        const statusBadge = s.status === 'COMPLETED'
            ? '<span class="badge bg-success">COMPLETED</span>'
            : (s.status === 'PROCESSING'
                ? '<span class="badge bg-primary">PROCESSING</span>'
                : (s.status === 'ON_HOLD' ? '<span class="badge bg-secondary">ON_HOLD</span>' : '<span class="badge bg-dark">QUEUED</span>'));

        let turnaround = '-';
        if (s.completionTime && s.receivedTime) {
            const start = new Date(s.receivedTime);
            const end = new Date(s.completionTime);
            const diffMin = Math.round((end - start) / 60000);
            turnaround = `${diffMin} min`;
        }

        return `
            <tr>
                <td class="fw-bold text-primary">${s.id}</td>
                <td>${s.sampleType || 'Specimen'}</td>
                <td><span class="fw-semibold">${s.testType}</span> <small class="text-muted">(${s.testCategory || 'General'})</small></td>
                <td><span class="badge bg-light text-dark border">${s.processingType || 'Routine'}</span></td>
                <td>${prioBadge}</td>
                <td class="small text-muted">${formatDate(s.receivedTime)}</td>
                <td class="small">${formatDate(s.deadline)}</td>
                <td>${statusBadge}</td>
                <td>${s.assignedMachineId ? `<span class="badge bg-dark">${s.assignedMachineId}</span>` : '<span class="text-muted">-</span>'}</td>
                <td class="small">${turnaround}</td>
                <td class="text-center">
                    <div class="btn-group" role="group">
                        ${s.status === 'PROCESSING'
                            ? `<button class="btn btn-sm btn-success" title="Complete Sample" onclick="completeSample('${s.id}')">
                                   <i class="bi bi-check-lg"></i>
                               </button>`
                            : ''
                        }
                        ${s.status === 'QUEUED'
                            ? `<button class="btn btn-sm btn-warning" title="Put On Hold" onclick="putOnHold('${s.id}')">
                                   <i class="bi bi-pause"></i>
                               </button>`
                            : ''
                        }
                        ${s.status === 'ON_HOLD'
                            ? `<button class="btn btn-sm btn-info" title="Release from Hold" onclick="releaseFromHold('${s.id}')">
                                   <i class="bi bi-play"></i>
                               </button>`
                            : ''
                        }
                        <button class="btn btn-sm btn-outline-secondary" title="View Audit Trail" onclick="viewHistory('${s.id}')">
                            <i class="bi bi-clock-history"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function completeSample(id) {
    try {
        await fetchApi(`/api/samples/${id}/complete`, { method: 'POST' });
        showToast(`Sample ${id} completed.`);
        loadDashboard();
        if (currentTab === 'samples') loadAllSamplesTable();
    } catch (e) {
        console.error(e);
    }
}

async function putOnHold(id) {
    try {
        await fetchApi(`/api/samples/${id}/hold`, { method: 'POST' });
        showToast(`Sample ${id} placed on hold.`);
        loadDashboard();
        if (currentTab === 'samples') loadAllSamplesTable();
    } catch (e) {
        console.error(e);
    }
}

async function releaseFromHold(id) {
    try {
        await fetchApi(`/api/samples/${id}/release`, { method: 'POST' });
        showToast(`Sample ${id} released from hold.`);
        loadDashboard();
        if (currentTab === 'samples') loadAllSamplesTable();
    } catch (e) {
        console.error(e);
    }
}

function openDowntimeModal(machineId) {
    document.getElementById('downtime-machine-id').value = machineId;
    document.getElementById('downtimeModalTitle').textContent = `Mark Machine ${machineId} Down`;
    document.getElementById('downtime-preset-reason').value = '';
    document.getElementById('downtime-custom-reason').value = '';

    const modal = new bootstrap.Modal(document.getElementById('downtimeModal'));
    modal.show();
}

async function confirmMachineDown() {
    const machineId = document.getElementById('downtime-machine-id').value;
    const preset = document.getElementById('downtime-preset-reason').value;
    const custom = document.getElementById('downtime-custom-reason').value.trim();
    const reason = custom || preset || 'Operator requested downtime / maintenance';

    try {
        await fetchApi(`/api/machines/${machineId}/down`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });

        const modalEl = document.getElementById('downtimeModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        showToast(`Machine ${machineId} marked DOWN: ${reason}`);
        loadDashboard();
        if (currentTab === 'admin') loadAdminMachinesTable();
    } catch (e) {
        console.error(e);
    }
}

async function toggleMachineAvailable(machineId) {
    try {
        await fetchApi(`/api/machines/${machineId}/up`, { method: 'POST' });
        showToast(`Machine ${machineId} marked UP/AVAILABLE.`);
        loadDashboard();
        if (currentTab === 'admin') loadAdminMachinesTable();
    } catch (e) {
        console.error(e);
    }
}

async function viewHistory(id) {
    try {
        const result = await fetchApi(`/api/samples/${id}/history`);
        const list = result.data || [];
        const tbody = document.getElementById('history-table-body');
        document.getElementById('historyModalTitle').textContent = `Audit Trail for Sample ${id}`;

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">No history logs recorded for this sample.</td></tr>`;
        } else {
            tbody.innerHTML = list.map(h => `
                <tr>
                    <td class="small text-muted">${formatDate(h.timestamp)}</td>
                    <td><span class="badge bg-secondary">${h.action}</span></td>
                    <td class="small">${h.details}</td>
                </tr>
            `).join('');
        }

        const modal = new bootstrap.Modal(document.getElementById('historyModal'));
        modal.show();
    } catch (e) {
        console.error(e);
    }
}

async function populateTestTypeDropdown() {
    const select = document.getElementById('reg-testType');
    if (!select) return;

    try {
        const res = await fetchApi('/api/test-types');
        const testTypes = res.data || [];
        if (testTypes.length > 0) {
            select.innerHTML = testTypes.map(t => `<option value="${t}">${t}</option>`).join('');
        }
    } catch (e) {
        console.warn('Could not load test types dynamically:', e);
    }
}

function updateDefaultTarget() {
    const prio = document.getElementById('reg-priority').value;
    const targetInput = document.getElementById('reg-targetMinutes');
    if (prio === 'EMERGENCY') targetInput.value = 15;
    else if (prio === 'HIGH') targetInput.value = 30;
    else if (prio === 'NORMAL') targetInput.value = 120;
    else if (prio === 'LOW') targetInput.value = 240;
}

async function handleRegisterSample(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-sample');
    if (btn) btn.disabled = true;

    const testType = document.getElementById('reg-testType').value;
    const priority = document.getElementById('reg-priority').value;
    const targetMinutes = parseInt(document.getElementById('reg-targetMinutes').value, 10);
    const receivedTimeVal = document.getElementById('reg-receivedTime').value;
    const sampleTypeEl = document.getElementById('reg-sampleType');
    const testCatEl = document.getElementById('reg-testCategory');
    const procTypeEl = document.getElementById('reg-processingType');

    const payload = {
        testType,
        sampleType: sampleTypeEl ? sampleTypeEl.value : 'Blood',
        testCategory: testCatEl ? testCatEl.value : 'General',
        processingType: procTypeEl ? procTypeEl.value : 'Routine',
        priority,
        targetMinutes,
        receivedTime: receivedTimeVal ? receivedTimeVal + ':00' : null
    };

    try {
        const res = await fetchApi('/api/samples', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        showToast(`Sample ${res.data.id} registered and scheduled successfully!`);
        document.getElementById('register-sample-form').reset();
        updateDefaultTarget();
        showTab('dashboard');
    } catch (e) {
        console.error(e);
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function fetchDailyReport() {
    const dateInput = document.getElementById('report-date-picker').value;
    if (!dateInput) return;

    try {
        const res = await fetchApi(`/api/reports/daily?date=${dateInput}`);
        const report = res.data;

        document.getElementById('rep-completed').textContent = report.completed;
        document.getElementById('rep-pending').textContent = report.pending;
        document.getElementById('rep-delayed').textContent = report.delayed;
        document.getElementById('rep-onhold').textContent = report.onHold;

        currentDailyReportSamples = report.samples || [];
        filterReportTable('ALL');
    } catch (e) {
        console.error(e);
    }
}

function filterReportTable(filterType) {
    const tbody = document.getElementById('report-table-body');
    const titleEl = document.getElementById('report-filter-title');
    if (!tbody) return;

    let list = currentDailyReportSamples;
    if (filterType === 'COMPLETED') {
        list = list.filter(s => s.status === 'COMPLETED');
        if (titleEl) titleEl.textContent = 'Filtered: Completed Samples';
    } else if (filterType === 'PENDING') {
        list = list.filter(s => s.status === 'QUEUED' || s.status === 'PROCESSING');
        if (titleEl) titleEl.textContent = 'Filtered: Pending / Active Samples';
    } else if (filterType === 'ON_HOLD') {
        list = list.filter(s => s.status === 'ON_HOLD');
        if (titleEl) titleEl.textContent = 'Filtered: On-Hold Samples';
    } else if (filterType === 'DELAYED') {
        list = list.filter(s => s.delayStatus === 'DELAYED' || s.delayStatus === 'OVERDUE');
        if (titleEl) titleEl.textContent = 'Filtered: Delayed / Overdue Samples';
    } else {
        if (titleEl) titleEl.textContent = 'All Samples Matching Report Date';
    }

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No samples found matching filter criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(s => `
        <tr>
            <td class="fw-bold text-primary">${s.id}</td>
            <td>${s.testType}</td>
            <td><span class="badge bg-secondary">${s.priority}</span></td>
            <td class="small text-muted">${formatDate(s.receivedTime)}</td>
            <td class="small">${formatDate(s.deadline)}</td>
            <td><span class="badge ${s.status === 'COMPLETED' ? 'bg-success' : 'bg-primary'}">${s.status}</span></td>
            <td>${s.assignedMachineId || '-'}</td>
            <td class="small">${s.completionTime ? formatDate(s.completionTime) : '-'}</td>
        </tr>
    `).join('');
}

function switchAdminTab(subTab, btn) {
    document.querySelectorAll('.admin-sub-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#admin-tabs .nav-link').forEach(el => el.classList.remove('active'));

    const section = document.getElementById('admin-section-' + subTab);
    if (section) section.style.display = 'block';
    if (btn) btn.classList.add('active');

    if (subTab === 'machines') loadAdminMachinesTable();
    else if (subTab === 'users') loadAdminUsersTable();
    else if (subTab === 'priorities') loadAdminPrioritiesTable();
    else if (subTab === 'testtypes') loadAdminTestTypesTable();
}

async function loadAdminOverview() {
    try {
        const [machinesRes, prioRes, typesRes, usersRes] = await Promise.all([
            fetchApi('/api/machines'),
            fetchApi('/api/priorities'),
            fetchApi('/api/test-types'),
            fetchApi('/api/users')
        ]);

        document.getElementById('admin-kpi-machines').textContent = (machinesRes.data || []).length;
        document.getElementById('admin-kpi-priorities').textContent = (prioRes.data || []).length;
        document.getElementById('admin-kpi-testtypes').textContent = (typesRes.data || []).length;
        document.getElementById('admin-kpi-users').textContent = (usersRes.data || []).length;

        loadAdminMachinesTable();
    } catch (e) {
        console.error('Error loading admin overview:', e);
    }
}

async function loadAdminMachinesTable() {
    const tbody = document.getElementById('admin-machines-table-body');
    if (!tbody) return;

    try {
        const res = await fetchApi('/api/machines');
        const machines = res.data || [];

        if (machines.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">No machines registered.</td></tr>`;
            return;
        }

        tbody.innerHTML = machines.map(m => `
            <tr>
                <td class="fw-bold">${m.id}</td>
                <td>${m.name}</td>
                <td>${m.capacity} slots</td>
                <td>${m.currentLoad}</td>
                <td>${m.available ? '<span class="badge bg-success">AVAILABLE</span>' : '<span class="badge bg-danger">DOWN</span>'}</td>
                <td>${(m.supportedTestTypes || []).map(t => `<span class="badge bg-light text-dark border me-1">${t}</span>`).join('')}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteMachine('${m.id}')" title="Delete Machine">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3">Failed to load machines.</td></tr>`;
    }
}

async function handleCreateMachine(event) {
    event.preventDefault();
    const id = document.getElementById('admin-machine-id').value.trim();
    const name = document.getElementById('admin-machine-name').value.trim();
    const capacity = parseInt(document.getElementById('admin-machine-capacity').value, 10);
    const testsStr = document.getElementById('admin-machine-tests').value.trim();
    const supportedTestTypes = testsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);

    try {
        await fetchApi('/api/machines', {
            method: 'POST',
            body: JSON.stringify({ id, name, capacity, supportedTestTypes, available: true })
        });
        showToast(`Machine ${id} registered successfully.`);
        event.target.reset();
        loadAdminMachinesTable();
        loadDashboard();
    } catch (e) {
        console.error(e);
    }
}

async function deleteMachine(id) {
    if (!confirm(`Are you sure you want to delete machine ${id}?`)) return;

    try {
        await fetchApi(`/api/machines/${id}`, { method: 'DELETE' });
        showToast(`Machine ${id} deleted.`);
        loadAdminMachinesTable();
        loadDashboard();
    } catch (e) {
        console.error(e);
    }
}

async function loadAdminUsersTable() {
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    try {
        const res = await fetchApi('/api/users');
        const users = res.data || [];

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td class="fw-bold">${u.id}</td>
                <td><i class="bi bi-person me-1"></i>${u.username}</td>
                <td><span class="badge ${u.role === 'ADMIN' ? 'bg-primary' : 'bg-secondary'}">${u.role}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${u.id}, '${u.username}')" title="Delete User">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">Failed to load users.</td></tr>`;
    }
}

async function handleCreateUser(event) {
    event.preventDefault();
    const username = document.getElementById('admin-user-username').value.trim();
    const password = document.getElementById('admin-user-password').value.trim();
    const role = document.getElementById('admin-user-role').value;

    try {
        await fetchApi('/api/users', {
            method: 'POST',
            body: JSON.stringify({ username, password, role })
        });
        showToast(`User '${username}' created successfully.`);
        event.target.reset();
        loadAdminUsersTable();
    } catch (e) {
        console.error(e);
    }
}

async function deleteUser(id, username) {
    if (!confirm(`Are you sure you want to delete user '${username}'?`)) return;

    try {
        await fetchApi(`/api/users/${id}`, { method: 'DELETE' });
        showToast(`User '${username}' deleted.`);
        loadAdminUsersTable();
    } catch (e) {
        console.error(e);
    }
}

async function loadAdminPrioritiesTable() {
    const tbody = document.getElementById('admin-priorities-table-body');
    if (!tbody) return;

    try {
        const res = await fetchApi('/api/priorities');
        const priorities = res.data || [];

        if (priorities.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No priority tiers configured.</td></tr>`;
            return;
        }

        tbody.innerHTML = priorities.map(p => `
            <tr>
                <td>${p.id}</td>
                <td class="fw-bold">${p.name}</td>
                <td>Rank ${p.rankOrder}</td>
                <td>${p.targetMinutes} min</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="deletePriority(${p.id}, '${p.name}')" title="Delete Priority Tier">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">Failed to load priorities.</td></tr>`;
    }
}

async function handleCreatePriority(event) {
    event.preventDefault();
    const name = document.getElementById('admin-priority-name').value.trim();
    const rankOrder = parseInt(document.getElementById('admin-priority-rank').value, 10);
    const targetMinutes = parseInt(document.getElementById('admin-priority-target').value, 10);

    try {
        await fetchApi('/api/priorities', {
            method: 'POST',
            body: JSON.stringify({ name, rankOrder, targetMinutes })
        });
        showToast(`Priority tier '${name}' configured.`);
        event.target.reset();
        loadAdminPrioritiesTable();
    } catch (e) {
        console.error(e);
    }
}

async function deletePriority(id, name) {
    if (!confirm(`Are you sure you want to delete priority tier '${name}'?`)) return;

    try {
        await fetchApi(`/api/priorities/${id}`, { method: 'DELETE' });
        showToast(`Priority '${name}' deleted.`);
        loadAdminPrioritiesTable();
    } catch (e) {
        console.error(e);
    }
}

async function loadAdminTestTypesTable() {
    const tbody = document.getElementById('admin-testtypes-table-body');
    if (!tbody) return;

    try {
        const res = await fetchApi('/api/test-types');
        const types = res.data || [];

        if (types.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">No test categories registered.</td></tr>`;
            return;
        }

        tbody.innerHTML = types.map((t, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td class="fw-semibold">${t}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTestType('${t}')" title="Delete Category">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-3">Failed to load test types.</td></tr>`;
    }
}

async function handleCreateTestType(event) {
    event.preventDefault();
    const name = document.getElementById('admin-testtype-name').value.trim();

    try {
        await fetchApi('/api/test-types', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        showToast(`Test category '${name}' registered.`);
        event.target.reset();
        loadAdminTestTypesTable();
        populateTestTypeDropdown();
    } catch (e) {
        console.error(e);
    }
}

async function deleteTestType(name) {
    if (!confirm(`Delete test category '${name}'?`)) return;
    showToast(`Note: Category '${name}' is preserved if actively referenced by samples.`);
}

function formatDate(isoStr) {
    if (!isoStr) return '-';
    try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + ' ' + d.toLocaleDateString();
    } catch (e) {
        return isoStr;
    }
}

function showToast(message) {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toast-message');
    if (!toastEl || !toastBody) return;
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
}
