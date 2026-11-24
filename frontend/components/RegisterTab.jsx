'use client';

import { useState } from 'react';

export default function RegisterTab({ testTypes, onRegisterSample, onCancel }) {
  const [testType, setTestType] = useState(testTypes?.[0] || 'Blood');
  const [sampleType, setSampleType] = useState('Blood');
  const [testCategory, setTestCategory] = useState('');
  const [processingType, setProcessingType] = useState('Routine');
  const [priority, setPriority] = useState('HIGH');
  const [targetMinutes, setTargetMinutes] = useState(30);
  const [receivedTime, setReceivedTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePriorityChange = (e) => {
    const val = e.target.value;
    setPriority(val);
    if (val === 'EMERGENCY') setTargetMinutes(15);
    else if (val === 'HIGH') setTargetMinutes(30);
    else if (val === 'NORMAL') setTargetMinutes(120);
    else if (val === 'LOW') setTargetMinutes(240);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        testType,
        sampleType,
        testCategory: testCategory || 'General',
        processingType,
        priority,
        targetMinutes: parseInt(targetMinutes, 10),
        receivedTime: receivedTime ? receivedTime + ':00' : null
      };
      await onRegisterSample(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="register-view">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header py-3 bg-light">
              <h5 className="fw-bold mb-0 text-primary"><i className="bi bi-plus-circle me-2"></i>Register Incoming Sample</h5>
              <span className="text-muted small">Specimens are assigned an auto-incremented ID and prioritized in queue</span>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Diagnostic Test Type *</label>
                  <select
                    className="form-select"
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    required
                  >
                    {testTypes && testTypes.length > 0 ? (
                      testTypes.map((t) => <option value={t} key={t}>{t}</option>)
                    ) : (
                      <>
                        <option value="Blood">Blood</option>
                        <option value="Urine">Urine</option>
                        <option value="Thyroid">Thyroid</option>
                      </>
                    )}
                  </select>
                  <div className="form-text">Options loaded dynamically from database test categories.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Specimen / Sample Type</label>
                  <select
                    className="form-select"
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                  >
                    <option value="Blood">Whole Blood / Plasma</option>
                    <option value="Serum">Serum</option>
                    <option value="Urine">Urine</option>
                    <option value="Swab">Nasopharyngeal / Throat Swab</option>
                    <option value="Saliva">Saliva</option>
                    <option value="Tissue">Biopsy / Tissue</option>
                  </select>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Test Category</label>
                    <input
                      type="text"
                      className="form-control"
                      value={testCategory}
                      onChange={(e) => setTestCategory(e.target.value)}
                      placeholder="e.g. Hematology, Biochemistry"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Processing Type</label>
                    <select
                      className="form-select"
                      value={processingType}
                      onChange={(e) => setProcessingType(e.target.value)}
                    >
                      <option value="Routine">Routine</option>
                      <option value="STAT">STAT / Continuous</option>
                      <option value="Batch">Batch</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Priority Urgency *</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={handlePriorityChange}
                    required
                  >
                    <option value="EMERGENCY">EMERGENCY (Rank 1 - 15 min)</option>
                    <option value="HIGH">HIGH (Rank 2 - 30 min)</option>
                    <option value="NORMAL">NORMAL (Rank 3 - 120 min)</option>
                    <option value="LOW">LOW (Rank 4 - 240 min)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Target Turnaround Time (minutes) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(e.target.value)}
                    min="1"
                    required
                  />
                  <div className="form-text">Auto-populated based on priority tier; customizable per protocol.</div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Received Time (optional)</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={receivedTime}
                    onChange={(e) => setReceivedTime(e.target.value)}
                  />
                  <div className="form-text">Leave blank to use current server timestamp.</div>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary px-4 fw-semibold" disabled={loading}>
                    <i className="bi bi-check-circle me-1"></i> {loading ? 'Registering...' : 'Register & Auto-Schedule'}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
