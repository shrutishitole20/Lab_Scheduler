'use client';

import AdminTab from '../../components/AdminTab';
import { useLab } from '../../lib/LabContext';

export default function AdminPage() {
  const {
    machines,
    priorities,
    testTypes,
    users,
    loadAdminData,
    handleCreateMachine,
    handleDeleteMachine,
    handleCreateUser,
    handleDeleteUser,
    handleCreatePriority,
    handleDeletePriority,
    handleCreateTestType,
    handleDeleteTestType,
  } = useLab();

  return (
    <div className="container-fluid px-4 py-3">
      <AdminTab
        machines={machines}
        priorities={priorities}
        testTypes={testTypes}
        users={users}
        onRefreshAll={loadAdminData}
        onCreateMachine={handleCreateMachine}
        onDeleteMachine={handleDeleteMachine}
        onCreateUser={handleCreateUser}
        onDeleteUser={handleDeleteUser}
        onCreatePriority={handleCreatePriority}
        onDeletePriority={handleDeletePriority}
        onCreateTestType={handleCreateTestType}
        onDeleteTestType={handleDeleteTestType}
      />
    </div>
  );
}
