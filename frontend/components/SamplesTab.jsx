'use client';

import { useState } from 'react';
import { formatDate } from '../lib/api';

export default function SamplesTab({
  allSamples,
  onRefresh,
  onGoToRegister,
  onCompleteSample,
  onPutOnHold,
  onReleaseFromHold,
  onViewHistory
}) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  let filtered = allSamples || [];
  if (filter !== 'ALL') {
    filtered = filtered.filter(s => s.status === filter);
  }

  const query = search.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(s =>
      (s.id && s.id.toLowerCase().includes(query)) ||
      (s.testType && s.testType.toLowerCase().includes(query)) ||
      (s.sampleType && s.sampleType.toLowerCase().includes(query)) ||
      (s.assignedMachineId && s.assignedMachineId.toLowerCase().includes(query))
    );
  }

  return (
    <div id="samples-view">
      <div className="row align-items-center mb-3">
        <div className="col-md-6">
          <h5 className="fw-bold mb-0 text-primary"><i className="bi bi-collection me-2"></i>Laboratory Sample Management</h5>
          <span className="text-muted small">Comprehensive registry of incoming, queued, processing, and completed specimens</span>
        </div>
        <div className="col-md-6 d-flex justify-content-md-end gap-2 mt-2 mt-md-0">
          <button className="btn btn-sm btn-primary" onClick={onGoToRegister}>
            <i className="bi bi-plus-circle me-1"></i> Register New Sample
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={onRefresh}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      <div className="card shadow-sm mb-3">
        <div className="card-body py-2">
          <div className="row g-2 align-items-center">
            <div className="col-md-6 d-flex flex-wrap gap-1">
              {['ALL', 'QUEUED', 'PROCESSING', 'COMPLETED', 'ON_HOLD'].map((st) => (
                <button
                  key={st}
                  className={`btn btn-sm ${filter === st ? 'btn-primary active' : 'btn-outline-secondary'}`}
                  onClick={() => setFilter(st)}
                >
                  {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Sample ID, Test Type, Specimen, or Machine..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-uppercase text-muted">
                <tr>
                  <th>Sample ID</th>
                  <th>Specimen</th>
                  <th>Test Type & Category</th>
                  <th>Processing Type</th>
                  <th>Priority</th>
                  <th>Received Time</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Machine</th>
                  <th>Turnaround Time</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center text-muted py-4">No samples matching filter criteria.</td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const prioBadge = s.priority === 'EMERGENCY' ? (
                      <span className="badge bg-danger">EMERGENCY</span>
                    ) : s.priority === 'HIGH' ? (
                      <span className="badge bg-warning text-dark">HIGH</span>
                    ) : (
                      <span className="badge bg-info text-dark">NORMAL</span>
                    );

                    const statusBadge = s.status === 'COMPLETED' ? (
                      <span className="badge bg-success">COMPLETED</span>
                    ) : s.status === 'PROCESSING' ? (
                      <span className="badge bg-primary">PROCESSING</span>
                    ) : s.status === 'ON_HOLD' ? (
                      <span className="badge bg-secondary">ON_HOLD</span>
                    ) : (
                      <span className="badge bg-dark">QUEUED</span>
                    );

                    let turnaround = '-';
                    if (s.completionTime && s.receivedTime) {
                      const start = new Date(s.receivedTime);
                      const end = new Date(s.completionTime);
                      const diffMin = Math.round((end - start) / 60000);
                      turnaround = `${diffMin} min`;
                    }

                    return (
                      <tr key={s.id}>
                        <td className="fw-bold text-primary">{s.id}</td>
                        <td>{s.sampleType || 'Specimen'}</td>
                        <td>
                          <span className="fw-semibold">{s.testType}</span> <small className="text-muted">({s.testCategory || 'General'})</small>
                        </td>
                        <td><span className="badge bg-light text-dark border">{s.processingType || 'Routine'}</span></td>
                        <td>{prioBadge}</td>
                        <td className="small text-muted">{formatDate(s.receivedTime)}</td>
                        <td className="small">{formatDate(s.deadline)}</td>
                        <td>{statusBadge}</td>
                        <td>{s.assignedMachineId ? <span className="badge bg-dark">{s.assignedMachineId}</span> : <span className="text-muted">-</span>}</td>
                        <td className="small">{turnaround}</td>
                        <td className="text-center">
                          <div className="btn-group" role="group">
                            {s.status === 'PROCESSING' && (
                              <button className="btn btn-sm btn-success" title="Complete Sample" onClick={() => onCompleteSample(s.id)}>
                                <i className="bi bi-check-lg"></i>
                              </button>
                            )}
                            {s.status === 'QUEUED' && (
                              <button className="btn btn-sm btn-warning" title="Put On Hold" onClick={() => onPutOnHold(s.id)}>
                                <i className="bi bi-pause"></i>
                              </button>
                            )}
                            {s.status === 'ON_HOLD' && (
                              <button className="btn btn-sm btn-info" title="Release from Hold" onClick={() => onReleaseFromHold(s.id)}>
                                <i className="bi bi-play"></i>
                              </button>
                            )}
                            <button className="btn btn-sm btn-outline-secondary" title="View Audit Trail" onClick={() => onViewHistory(s.id)}>
                              <i className="bi bi-clock-history"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
