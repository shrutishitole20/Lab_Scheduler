'use client';

import DashboardTab from '../../components/DashboardTab';
import { useLab } from '../../lib/LabContext';

export default function DashboardPage() {
  const {
    machines,
    queuedSamples,
    allSamples,
    loadMachines,
    handleAutoDispatch,
    setDowntimeModalMachineId,
    handleToggleMachineUp,
    handleCompleteSample,
    handlePutOnHold,
    handleReleaseFromHold,
    handleViewHistory,
  } = useLab();

  return (
    <div className="container-fluid px-4 py-3">
      <DashboardTab
        machines={machines}
        queuedSamples={queuedSamples}
        allSamples={allSamples}
        onRefreshMachines={loadMachines}
        onAutoDispatch={handleAutoDispatch}
        onOpenDowntimeModal={(id) => setDowntimeModalMachineId(id)}
        onToggleMachineUp={handleToggleMachineUp}
        onCompleteSample={handleCompleteSample}
        onPutOnHold={handlePutOnHold}
        onReleaseFromHold={handleReleaseFromHold}
        onViewHistory={handleViewHistory}
      />
    </div>
  );
}
