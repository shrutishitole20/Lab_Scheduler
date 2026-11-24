'use client';

import ReportsTab from '../../components/ReportsTab';
import { useLab } from '../../lib/LabContext';

export default function ReportsPage() {
  const {
    dailyReport,
    reportDate,
    setReportDate,
    loadDailyReport,
  } = useLab();

  return (
    <div className="container-fluid px-4 py-3">
      <ReportsTab
        report={dailyReport}
        reportDate={reportDate}
        onDateChange={(d) => {
          setReportDate(d);
          loadDailyReport(d);
        }}
        onRefreshReport={() => loadDailyReport(reportDate)}
      />
    </div>
  );
}
