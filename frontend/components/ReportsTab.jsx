'use client';

import { useState } from 'react';
import { formatDate } from '../lib/api';

export default function ReportsTab({
  report,
  reportDate,
  onDateChange,
  onRefreshReport
}) {
  const [filterType, setFilterType] = useState('ALL');

  const samples = report?.samples || [];
  let filtered = samples;
  let title = 'All Samples Matching Report Date';

  if (filterType === 'COMPLETED') {
    filtered = samples.filter(s => s.status === 'COMPLETED');
    title = 'Filtered: Completed Samples';
  } else if (filterType === 'PENDING') {
    filtered = samples.filter(s => s.status === 'QUEUED' || s.status === 'PROCESSING');
    title = 'Filtered: Pending / Active Samples';
  } else if (filterType === 'ON_HOLD') {
    filtered = samples.filter(s => s.status === 'ON_HOLD');
    title = 'Filtered: On-Hold Samples';
  } else if (filterType === 'DELAYED') {
    filtered = samples.filter(s => s.delayStatus === 'DELAYED' || s.delayStatus === 'OVERDUE');
    title = 'Filtered: Delayed / Overdue Samples';
  }

  return (
    <div id="reports-view">
      <div className="row align-items-center mb-3">
        <div className="col-md-6 mb-2 mb-md-0">
          <h5 className="fw-bold mb-0 text-primary"><i className="bi bi-file-earmark-bar-graph me-2"></i>Daily Performance &amp; SLA Report</h5>
          <span className="text-muted small">Audits turnaround compliance, delay detection, and volume analytics</span>
        </div>
        <div className="col-md-6 d-flex flex-wrap justify-content-md-end gap-2 mt-2 mt-md-0">
          <input
            type="date"
            className="form-control w-auto"
            value={reportDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
          <button className="btn btn-outline-primary" onClick={onRefreshReport} title="Search Date">
            <i className="bi bi-search"></i> Query Date
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div
            className="metric-card bg-completed shadow-sm"
            style={{ cursor: 'pointer' }}
            onClick={() => setFilterType('COMPLETED')}
            title="Click to view Completed samples"
          >
            <div>
              <span className="text-white-50">Completed</span>
              <h3>{report?.completed || 0}</h3>
            </div>
            <i className="bi bi-check2-circle fs-1 opacity-75"></i>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="metric-card bg-pending shadow-sm"
            style={{ cursor: 'pointer' }}
            onClick={() => setFilterType('PENDING')}
            title="Click to view Pending samples"
          >
            <div>
              <span className="text-white-50">Pending / Active</span>
              <h3>{report?.pending || 0}</h3>
            </div>
            <i className="bi bi-hourglass-split fs-1 opacity-75"></i>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="metric-card bg-delayed shadow-sm"
            style={{ cursor: 'pointer' }}
            onClick={() => setFilterType('DELAYED')}
            title="Click to view Delayed samples"
          >
            <div>
              <span className="text-white-50">Delayed / Approaching</span>
              <h3>{report?.delayed || 0}</h3>
            </div>
            <i className="bi bi-exclamation-triangle fs-1 opacity-75"></i>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="metric-card bg-onhold shadow-sm"
            style={{ cursor: 'pointer' }}
            onClick={() => setFilterType('ON_HOLD')}
            title="Click to view On Hold samples"
          >
            <div>
              <span className="text-white-50">On Hold</span>
              <h3>{report?.onHold || 0}</h3>
            </div>
            <i className="bi bi-pause-circle fs-1 opacity-75"></i>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center py-2">
          <span className="fw-semibold text-dark">{title}</span>
          <button className="btn btn-sm btn-link text-decoration-none" onClick={() => setFilterType('ALL')}>
            Show All Samples for Date
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small text-uppercase text-muted">
                <tr>
                  <th>Sample ID</th>
                  <th>Test Type</th>
                  <th>Priority</th>
                  <th>Received Time</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Machine</th>
                  <th>Completion Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">No samples found matching filter criteria.</td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id}>
                      <td className="fw-bold text-primary">{s.id}</td>
                      <td>{s.testType}</td>
                      <td><span className="badge bg-secondary">{s.priority}</span></td>
                      <td className="small text-muted">{formatDate(s.receivedTime)}</td>
                      <td className="small">{formatDate(s.deadline)}</td>
                      <td><span className={`badge ${s.status === 'COMPLETED' ? 'bg-success' : 'bg-primary'}`}>{s.status}</span></td>
                      <td>{s.assignedMachineId || '-'}</td>
                      <td className="small">{s.completionTime ? formatDate(s.completionTime) : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
