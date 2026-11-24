'use client';

import { useState } from 'react';

export default function AdminTab({
  machines,
  priorities,
  testTypes,
  users,
  onRefreshAll,
  onCreateMachine,
  onDeleteMachine,
  onCreateUser,
  onDeleteUser,
  onCreatePriority,
  onDeletePriority,
  onCreateTestType,
  onDeleteTestType
}) {
  const [subTab, setSubTab] = useState('machines');

  // Form states
  const [machineId, setMachineId] = useState('');
  const [machineName, setMachineName] = useState('');
  const [machineCap, setMachineCap] = useState(2);
  const [machineTests, setMachineTests] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('STAFF');

  const [prioName, setPrioName] = useState('');
  const [prioRank, setPrioRank] = useState(1);
  const [prioTarget, setPrioTarget] = useState(20);

  const [testTypeName, setTestTypeName] = useState('');

  const handleMachineSubmit = async (e) => {
    e.preventDefault();
    const tests = machineTests.split(',').map(t => t.trim()).filter(Boolean);
    await onCreateMachine({ id: machineId, name: machineName, capacity: parseInt(machineCap, 10), supportedTestTypes: tests, available: true });
    setMachineId('');
    setMachineName('');
    setMachineCap(2);
    setMachineTests('');
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    await onCreateUser({ username, password, role: userRole });
    setUsername('');
    setPassword('');
    setUserRole('STAFF');
  };

  const handlePrioritySubmit = async (e) => {
    e.preventDefault();
    await onCreatePriority({ name: prioName, rankOrder: parseInt(prioRank, 10), targetMinutes: parseInt(prioTarget, 10) });
    setPrioName('');
    setPrioRank(1);
    setPrioTarget(20);
  };

  const handleTestTypeSubmit = async (e) => {
    e.preventDefault();
    await onCreateTestType({ name: testTypeName });
    setTestTypeName('');
  };

  return (
    <div id="admin-view">
      <div className="row mb-3">
        <div className="col-12">
          <h5 className="fw-bold text-primary mb-1"><i className="bi bi-shield-lock me-2"></i>Administrator Management Console</h5>
          <p className="text-muted small">Manage laboratory equipment, user authentication, diagnostic test categories, and priority SLA rules.</p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card shadow-sm p-3 border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Machines Online</span>
                <h4 className="fw-bold mb-0">{machines?.length || 0}</h4>
              </div>
              <i className="bi bi-cpu fs-2 text-primary opacity-50"></i>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow-sm p-3 border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Test Categories</span>
                <h4 className="fw-bold mb-0">{testTypes?.length || 0}</h4>
              </div>
              <i className="bi bi-tags fs-2 text-success opacity-50"></i>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow-sm p-3 border-start border-4 border-warning">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Priority SLA Tiers</span>
                <h4 className="fw-bold mb-0">{priorities?.length || 0}</h4>
              </div>
              <i className="bi bi-clock-history fs-2 text-warning opacity-50"></i>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow-sm p-3 border-start border-4 border-info">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">Active Operators</span>
                <h4 className="fw-bold mb-0">{users?.length || 0}</h4>
              </div>
              <i className="bi bi-people fs-2 text-info opacity-50"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <ul className="nav nav-pills mb-3 flex-nowrap overflow-auto pb-1" id="admin-tabs" style={{ WebkitOverflowScrolling: 'touch' }}>
        <li className="nav-item">
          <button
            className={`nav-link ${subTab === 'machines' ? 'active' : ''}`}
            onClick={() => setSubTab('machines')}
          >
            <i className="bi bi-hdd-rack me-1"></i> Machines
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${subTab === 'users' ? 'active' : ''}`}
            onClick={() => setSubTab('users')}
          >
            <i className="bi bi-people me-1"></i> Users & Security
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${subTab === 'priorities' ? 'active' : ''}`}
            onClick={() => setSubTab('priorities')}
          >
            <i className="bi bi-clock-history me-1"></i> Priorities & Deadlines
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${subTab === 'testtypes' ? 'active' : ''}`}
            onClick={() => setSubTab('testtypes')}
          >
            <i className="bi bi-tag me-1"></i> Test Categories
          </button>
        </li>
      </ul>

      {/* Sub Tab: Machines */}
      {subTab === 'machines' && (
        <div className="admin-sub-section">
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-header py-2 d-flex justify-content-between align-items-center">
                  <span className="fw-semibold"><i className="bi bi-list-check me-1 text-primary"></i> Registered Equipment</span>
                  <button className="btn btn-sm btn-outline-secondary" onClick={onRefreshAll}><i className="bi bi-arrow-clockwise"></i></button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light small text-uppercase text-muted">
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Capacity</th>
                          <th>Current Load</th>
                          <th>Status</th>
                          <th>Supported Tests</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!machines || machines.length === 0) ? (
                          <tr><td colSpan="7" className="text-center text-muted py-3">No machines registered.</td></tr>
                        ) : (
                          machines.map(m => (
                            <tr key={m.id}>
                              <td className="fw-bold">{m.id}</td>
                              <td>{m.name}</td>
                              <td>{m.capacity} slots</td>
                              <td>{m.currentLoad}</td>
                              <td>{m.available ? <span className="badge bg-success">AVAILABLE</span> : <span className="badge bg-danger">DOWN</span>}</td>
                              <td>{(m.supportedTestTypes || []).map(t => <span className="badge bg-light text-dark border me-1" key={t}>{t}</span>)}</td>
                              <td className="text-center">
                                <button className="btn btn-sm btn-outline-danger" onClick={() => onDeleteMachine(m.id)} title="Delete Machine">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm">
                <div className="card-header py-2 bg-light">
                  <span className="fw-semibold"><i className="bi bi-plus-lg me-1 text-primary"></i> Register New Machine</span>
                </div>
                <div className="card-body">
                  <form onSubmit={handleMachineSubmit}>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Machine ID *</label>
                      <input type="text" className="form-control form-control-sm" value={machineId} onChange={(e) => setMachineId(e.target.value)} required placeholder="e.g. M3" />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Machine Name *</label>
                      <input type="text" className="form-control form-control-sm" value={machineName} onChange={(e) => setMachineName(e.target.value)} required placeholder="e.g. Molecular PCR Analyzer" />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Processing Capacity *</label>
                      <input type="number" className="form-control form-control-sm" value={machineCap} onChange={(e) => setMachineCap(e.target.value)} min="1" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Supported Tests (comma separated) *</label>
                      <input type="text" className="form-control form-control-sm" value={machineTests} onChange={(e) => setMachineTests(e.target.value)} required placeholder="e.g. Blood, Urine" />
                    </div>
                    <button type="submit" className="btn btn-sm btn-primary w-100">
                      <i className="bi bi-plus-lg me-1"></i> Register Machine
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: Users */}
      {subTab === 'users' && (
        <div className="admin-sub-section">
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-header py-2 d-flex justify-content-between align-items-center">
                  <span className="fw-semibold"><i className="bi bi-people me-1 text-primary"></i> System Users & Roles</span>
                  <button className="btn btn-sm btn-outline-secondary" onClick={onRefreshAll}><i className="bi bi-arrow-clockwise"></i></button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light small text-uppercase text-muted">
                        <tr>
                          <th>User ID</th>
                          <th>Username</th>
                          <th>Role</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!users || users.length === 0) ? (
                          <tr><td colSpan="4" className="text-center text-muted py-3">No users found.</td></tr>
                        ) : (
                          users.map(u => (
                            <tr key={u.id}>
                              <td className="fw-bold">{u.id}</td>
                              <td><i className="bi bi-person me-1"></i>{u.username}</td>
                              <td><span className={`badge ${u.role === 'ADMIN' ? 'bg-primary' : 'bg-secondary'}`}>{u.role}</span></td>
                              <td className="text-center">
                                <button className="btn btn-sm btn-outline-danger" onClick={() => onDeleteUser(u.id, u.username)} title="Delete User">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm">
                <div className="card-header py-2 bg-light">
                  <span className="fw-semibold"><i className="bi bi-person-plus me-1 text-primary"></i> Create System User</span>
                </div>
                <div className="card-body">
                  <form onSubmit={handleUserSubmit}>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Username *</label>
                      <input type="text" className="form-control form-control-sm" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="e.g. jdoe" />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Password *</label>
                      <input type="password" className="form-control form-control-sm" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Assigned Role *</label>
                      <select className="form-select form-select-sm" value={userRole} onChange={(e) => setUserRole(e.target.value)} required>
                        <option value="STAFF">STAFF (Laboratory Operator)</option>
                        <option value="ADMIN">ADMIN (System Administrator)</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-sm btn-primary w-100">
                      <i className="bi bi-person-check me-1"></i> Create User
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: Priorities */}
      {subTab === 'priorities' && (
        <div className="admin-sub-section">
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-header py-2 d-flex justify-content-between align-items-center">
                  <span className="fw-semibold"><i className="bi bi-clock-history me-1 text-primary"></i> Configured Priority Tiers & SLA Targets</span>
                  <button className="btn btn-sm btn-outline-secondary" onClick={onRefreshAll}><i className="bi bi-arrow-clockwise"></i></button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light small text-uppercase text-muted">
                        <tr>
                          <th>ID</th>
                          <th>Priority Name</th>
                          <th>Rank Order</th>
                          <th>Target Duration (min)</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!priorities || priorities.length === 0) ? (
                          <tr><td colSpan="5" className="text-center text-muted py-3">No priority tiers configured.</td></tr>
                        ) : (
                          priorities.map(p => (
                            <tr key={p.id}>
                              <td>{p.id}</td>
                              <td className="fw-bold">{p.name}</td>
                              <td>Rank {p.rankOrder}</td>
                              <td>{p.targetMinutes} min</td>
                              <td className="text-center">
                                <button className="btn btn-sm btn-outline-danger" onClick={() => onDeletePriority(p.id, p.name)} title="Delete Priority Tier">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm">
                <div className="card-header py-2 bg-light">
                  <span className="fw-semibold"><i className="bi bi-plus-lg me-1 text-primary"></i> Add / Configure Priority Tier</span>
                </div>
                <div className="card-body">
                  <form onSubmit={handlePrioritySubmit}>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Priority Name *</label>
                      <input type="text" className="form-control form-control-sm" value={prioName} onChange={(e) => setPrioName(e.target.value)} required placeholder="e.g. CRITICAL" />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Rank Order * (1 = highest urgency)</label>
                      <input type="number" className="form-control form-control-sm" value={prioRank} onChange={(e) => setPrioRank(e.target.value)} min="1" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Target Turnaround (Minutes) *</label>
                      <input type="number" className="form-control form-control-sm" value={prioTarget} onChange={(e) => setPrioTarget(e.target.value)} min="1" required />
                    </div>
                    <button type="submit" className="btn btn-sm btn-primary w-100">
                      <i className="bi bi-save me-1"></i> Save Priority Tier
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: Test Categories */}
      {subTab === 'testtypes' && (
        <div className="admin-sub-section">
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-header py-2 d-flex justify-content-between align-items-center">
                  <span className="fw-semibold"><i className="bi bi-tags me-1 text-primary"></i> Registered Diagnostic Test Types</span>
                  <button className="btn btn-sm btn-outline-secondary" onClick={onRefreshAll}><i className="bi bi-arrow-clockwise"></i></button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light small text-uppercase text-muted">
                        <tr>
                          <th>#</th>
                          <th>Test Category Name</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!testTypes || testTypes.length === 0) ? (
                          <tr><td colSpan="3" className="text-center text-muted py-3">No test categories registered.</td></tr>
                        ) : (
                          testTypes.map((t, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td className="fw-semibold">{t}</td>
                              <td className="text-center">
                                <button className="btn btn-sm btn-outline-danger" onClick={() => onDeleteTestType(t)} title="Delete Category">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm">
                <div className="card-header py-2 bg-light">
                  <span className="fw-semibold"><i className="bi bi-plus-lg me-1 text-primary"></i> Add Test Category</span>
                </div>
                <div className="card-body">
                  <form onSubmit={handleTestTypeSubmit}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Test Category Name *</label>
                      <input type="text" className="form-control form-control-sm" value={testTypeName} onChange={(e) => setTestTypeName(e.target.value)} required placeholder="e.g. Molecular PCR" />
                    </div>
                    <button type="submit" className="btn btn-sm btn-primary w-100">
                      <i className="bi bi-plus-lg me-1"></i> Register Category
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
