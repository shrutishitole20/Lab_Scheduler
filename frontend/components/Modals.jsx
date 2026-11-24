'use client';

import { useState } from 'react';
import { formatDate } from '../lib/api';

export function DowntimeModal({ machineId, onClose, onConfirm }) {
  const [preset, setPreset] = useState('');
  const [custom, setCustom] = useState('');

  const handleConfirm = () => {
    const reason = custom.trim() || preset || 'Operator requested downtime / maintenance';
    onConfirm(machineId, reason);
  };

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog" style={{ maxWidth: '500px', width: '100%', margin: '1.75rem auto', padding: '0 0.75rem' }}>
        <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden bg-white">
          <div className="modal-header bg-danger text-white py-2 px-3 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold fs-6">Mark Machine {machineId} Down</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body p-3">
            <p className="small text-muted mb-3">
              Marking a machine down halts new sample dispatch to this equipment. Active samples are kept safe.
            </p>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Reason for Downtime / Maintenance *</label>
              <select
                className="form-select form-select-sm mb-2"
                value={preset}
                onChange={(e) => {
                  setPreset(e.target.value);
                  setCustom(e.target.value);
                }}
              >
                <option value="">-- Select Common Reason --</option>
                <option value="Scheduled Calibration">Scheduled Calibration</option>
                <option value="Reagent Depletion / Refill">Reagent Depletion / Refill</option>
                <option value="Mechanical Jam / Hardware Error">Mechanical Jam / Hardware Error</option>
                <option value="Cleaning & Decontamination">Cleaning & Decontamination</option>
                <option value="Software / Network Disconnect">Software / Network Disconnect</option>
              </select>
              <textarea
                className="form-control form-control-sm"
                rows="2"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Or enter specific operator notes..."
              ></textarea>
            </div>
          </div>
          <div className="modal-footer py-2 px-3 bg-light">
            <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-sm btn-danger fw-semibold" onClick={handleConfirm}>
              <i className="bi bi-power me-1"></i> Confirm Machine Down
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HistoryModal({ sampleId, historyList, onClose }) {
  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog modal-lg" style={{ maxWidth: '800px', width: '100%', margin: '1.75rem auto', padding: '0 0.75rem' }}>
        <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden bg-white">
          <div className="modal-header bg-light py-2 px-3 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark fs-6">Audit Trail for Sample {sampleId}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-0" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="table-responsive">
              <table className="table table-striped mb-0 align-middle">
                <thead className="table-light small text-uppercase text-muted sticky-top">
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Audit Details</th>
                  </tr>
                </thead>
                <tbody>
                  {!historyList || historyList.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-3">No history logs recorded for this sample.</td>
                    </tr>
                  ) : (
                    historyList.map((h, i) => (
                      <tr key={i}>
                        <td className="small text-muted">{formatDate(h.timestamp)}</td>
                        <td><span className="badge bg-secondary">{h.action}</span></td>
                        <td className="small">{h.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer py-2 px-3 bg-light">
            <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
