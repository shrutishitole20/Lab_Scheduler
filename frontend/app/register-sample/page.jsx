'use client';

import { useRouter } from 'next/navigation';
import RegisterTab from '../../components/RegisterTab';
import { useLab } from '../../lib/LabContext';

export default function RegisterSamplePage() {
  const router = useRouter();
  const { testTypes, handleRegisterSample } = useLab();

  return (
    <div className="container-fluid px-4 py-3">
      <RegisterTab
        testTypes={testTypes}
        onRegisterSample={handleRegisterSample}
        onCancel={() => router.push('/dashboard')}
      />
    </div>
  );
}
