'use client';

import { useRouter } from 'next/navigation';
import SamplesTab from '../../components/SamplesTab';
import { useLab } from '../../lib/LabContext';

export default function SamplesPage() {
  const router = useRouter();
  const {
    allSamples,
    loadQueue,
    handleCompleteSample,
    handlePutOnHold,
    handleReleaseFromHold,
    handleViewHistory,
  } = useLab();

  return (
    <div className="container-fluid px-4 py-3">
      <SamplesTab
        allSamples={allSamples}
        onRefresh={loadQueue}
        onGoToRegister={() => router.push('/register-sample')}
        onCompleteSample={handleCompleteSample}
        onPutOnHold={handlePutOnHold}
        onReleaseFromHold={handleReleaseFromHold}
        onViewHistory={handleViewHistory}
      />
    </div>
  );
}
