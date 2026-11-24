'use client';

import { formatDate } from '../lib/api';

export default function DashboardTab({
  machines,
  queuedSamples,
  allSamples,
  onRefreshMachines,
  onAutoDispatch,
  onOpenDowntimeModal,
  onToggleMachineUp,
  onCompleteSample,
  onPutOnHold,
  onReleaseFromHold,
  onViewHistory
}) {
  const activeProcessing = allSamples.filter(s => s.status === 'PROCESSING' || s.status === 'ON_HOLD');
  const combined = [...activeProcessing, ...queuedSamples];
  const now = new Date();

  return (
    <div id="dashboard-view">
      {/* Machine Workload Section */}
      <div className="row mb-3">
        <div className="col-12 mb-2">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-cpu me-2 text-primary"></i>Machine Workload &amp; Status</h5>
              <span className="text-muted small">Live capacity, availability, and test capability monitoring</span>
            </div>
            <button className="btn btn-sm btn-outline-primary flex-shrink-0" onClick={onRefreshMachines}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh Machines
            </button>
          </div>
        </div>

        <div className="row g-3">
          {(!machines || machines.length === 0) ? (
            <div className="col-12">
              <div className="alert alert-info py-3 text-center">
                No machines registered in laboratory. Add equipment from the Admin Panel.
              </div>
            </div>
          ) : (
            machines.map((m) => {
              const load = m.currentLoad || 0;
              const cap = m.capacity || 1;
              const pct = Math.min(100, Math.round((load / cap) * 100));
              const isDown = !m.available;
              const statusBadge = isDown ? (
                <span className="badge bg-danger"><i className="bi bi-x-circle me-1"></i>DOWN</span>
              ) : load >= cap ? (
                <span className="badge bg-warning text-dark"><i className="bi bi-lightning-fill me-1"></i>FULL</span>
              ) : (
                <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i>AVAILABLE</span>
              );

              return (
                <div className="col-md-6 col-lg-4" key={m.id}>
                  <div className={`card machine-card shadow-sm h-100 ${isDown ? 'machine-down' : ''}`}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="fw-bold mb-0 text-dark">{m.name}</h6>
                          <span className="badge bg-secondary text-uppercase">{m.id}</span>
                        </div>
                        {statusBadge}
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Workload:</span>
                          <span className="fw-bold">{load} / {cap} active slots ({cap - load} free)</span>
                        </div>
                        <div className="progress" style={{ height: '9px' }}>
                          <div
                            className={`progress-bar ${isDown ? 'bg-secondary' : load >= cap ? 'bg-danger' : load > 0 ? 'bg-primary' : 'bg-success'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="small mb-3">
                        <span className="text-muted d-block mb-1">Compatible Tests:</span>
                        <div>
                          {m.supportedTestTypes && m.supportedTestTypes.length > 0 ? (
                            m.supportedTestTypes.map((t, idx) => (
                              <span className="badge bg-light text-dark border me-1" key={idx}>{t}</span>
                            ))
                          ) : (
                            <span className="text-muted small">None configured</span>
                          )}
                        </div>
                      </div>

                      <div className="border-top pt-2 d-flex justify-content-end gap-2">
                        {isDown ? (
                          <button className="btn btn-sm btn-outline-success" onClick={() => onToggleMachineUp(m.id)}>
                            <i className="bi bi-play-circle me-1"></i> Mark Available
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => onOpenDowntimeModal(m.id)}>
                            <i className="bi bi-power me-1"></i> Mark Down
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Live Scheduling & Priority Queue Section */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center py-2 gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold text-dark"><i className="bi bi-list-task me-2 text-primary"></i>Live Scheduling & Priority Queue</span>
                <span className="badge bg-secondary">
                  {combined.length} Active ({queuedSamples.length} Queued, {activeProcessing.length} Processing)
                </span>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <button className="btn btn-sm btn-success fw-semibold" onClick={onAutoDispatch}>
                  <i className="bi bi-play-circle-fill me-1"></i> Auto-Dispatch Eligible
                </button>
                <div className="d-flex flex-wrap gap-1 align-items-center">
                  <span className="badge bg-danger"><i className="bi bi-exclamation-triangle-fill me-1"></i>Overdue</span>
                  <span className="badge bg-warning text-dark"><i className="bi bi-clock-fill me-1"></i>Approaching (80% SLA)</span>
                  <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i>On Track</span>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small text-uppercase text-muted">
                    <tr>
                      <th>Pos</th>
                      <th>Sample ID</th>
                      <th>Test Type</th>
                      <th>Specimen / Category</th>
                      <th>Priority</th>
                      <th>Target</th>
                      <th>Received Time</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th>Assigned Machine</th>
                      <th>SLA Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combined.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="text-center text-muted py-4">
                          <i className="bi bi-inbox fs-3 d-block mb-2"></i>No samples currently in queue or processing.
                        </td>
                      </tr>
                    ) : (
                      combined.map((s, idx) => {
                        const deadline = new Date(s.deadline);
                        const received = new Date(s.receivedTime);
                        const targetMs = (s.targetMinutes || 30) * 60 * 1000;
                        const elapsedMs = now - received;

                        let rowClass = 'sample-ontime';
                        let slaBadge = <span className="badge badge-ontime"><i className="bi bi-check-circle me-1"></i>On Track</span>;

                        if (s.status === 'COMPLETED') {
                          slaBadge = <span className="badge bg-secondary">Done</span>;
                        } else if (now >= deadline) {
                          rowClass = 'sample-overdue';
                          slaBadge = <span className="badge badge-overdue"><i className="bi bi-exclamation-triangle-fill me-1"></i>OVERDUE</span>;
                        } else if (elapsedMs >= targetMs * 0.8) {
                          rowClass = 'sample-approaching';
                          slaBadge = <span className="badge badge-approaching"><i className="bi bi-clock-fill me-1"></i>APPROACHING</span>;
                        }

                        if (s.priority === 'EMERGENCY') {
                          rowClass += ' sample-emergency';
                        }

                        const prioBadge = s.priority === 'EMERGENCY' ? (
                          <span className="badge bg-danger shadow-sm"><i className="bi bi-lightning-charge-fill me-1"></i>EMERGENCY</span>
                        ) : s.priority === 'HIGH' ? (
                          <span className="badge bg-warning text-dark">HIGH</span>
                        ) : s.priority === 'LOW' ? (
                          <span className="badge bg-secondary">LOW</span>
                        ) : (
                          <span className="badge bg-info text-dark">NORMAL</span>
                        );

                        const statusBadge = s.status === 'PROCESSING' ? (
                          <span className="badge bg-primary"><i className="bi bi-gear-wide-connected me-1"></i>PROCESSING</span>
                        ) : s.status === 'ON_HOLD' ? (
                          <span className="badge bg-secondary">ON_HOLD</span>
                        ) : (
                          <span className="badge bg-dark">QUEUED</span>
                        );

                        return (
                          <tr className={rowClass} key={s.id || idx}>
                            <td className="fw-bold text-muted">#{idx + 1}</td>
                            <td><span className="fw-bold text-primary">{s.id}</span></td>
                            <td><span className="fw-semibold">{s.testType}</span></td>
                            <td className="small">
                              {s.sampleType || 'Specimen'} <span className="text-muted small">({s.testCategory || 'General'})</span>
                            </td>
                            <td>{prioBadge}</td>
                            <td>{s.targetMinutes} min</td>
                            <td className="small text-muted">{formatDate(s.receivedTime)}</td>
                            <td className="small fw-semibold">{formatDate(s.deadline)}</td>
                            <td>{statusBadge}</td>
                            <td>
                              {s.assignedMachineId ? (
                                <span className="badge bg-dark">{s.assignedMachineId}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>{slaBadge}</td>
                            <td className="text-center">
                              <div className="btn-group" role="group">
                                {s.status === 'PROCESSING' && (
                                  <button className="btn btn-sm btn-success" title="Complete Processing" onClick={() => onCompleteSample(s.id)}>
                                    <i className="bi bi-check-lg"></i> Complete
                                  </button>
                                )}
                                {s.status === 'QUEUED' && (
                                  <button className="btn btn-sm btn-warning" title="Put On Hold" onClick={() => onPutOnHold(s.id)}>
                                    <i className="bi bi-pause"></i> Hold
                                  </button>
                                )}
                                {s.status === 'ON_HOLD' && (
                                  <button className="btn btn-sm btn-info" title="Release from Hold" onClick={() => onReleaseFromHold(s.id)}>
                                    <i className="bi bi-play"></i> Release
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
      </div>
    </div>
  );
}
