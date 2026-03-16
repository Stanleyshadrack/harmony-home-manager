import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmployeeManagement } from '@/components/employees/EmployeeManagement';
import { getAllEmployees } from '@/api/service/employee.service';

export default function Employees() {

  const { t } = useTranslation();

  return (
    <DashboardLayout
      title="Employee Management"
      breadcrumbs={[
        { label: t('navigation.dashboard'), href: '/dashboard' },
        { label: 'Employees' },
      ]}
    >
      <EmployeeManagement />
    </DashboardLayout>
  );
}
