import InvestorManager from './InvestorManager';
import ProjectManager from './ProjectManager';
import AgencyManager from './AgencyManager';
import { Card, Tabs, Typography } from 'antd';

const { Paragraph } = Typography;

export default function CatalogPage({
  investors,
  allProjects,
  agencies,
  loadingInvestors,
  loadingProjects,
  loadingAgencies,
  error,
  success,
  onCreateInvestor,
  onUpdateInvestor,
  onDeleteInvestor,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onCreateAgency,
  onUpdateAgency,
  onDeleteAgency,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="Quản lý Danh mục">
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Thêm / sửa / xóa chủ đầu tư, dự án và đại lý để dùng khi tạo source.
        </Paragraph>
      </Card>

      <Tabs
        items={[
          {
            key: 'investors',
            label: 'Chủ đầu tư',
            children: (
              <InvestorManager
                investors={investors}
                loading={loadingInvestors}
                onCreate={onCreateInvestor}
                onUpdate={onUpdateInvestor}
                onDelete={onDeleteInvestor}
              />
            ),
          },
          {
            key: 'projects',
            label: 'Dự án',
            children: (
              <ProjectManager
                allProjects={allProjects}
                loadingProjects={loadingProjects}
                onCreate={onCreateProject}
                onUpdate={onUpdateProject}
                onDelete={onDeleteProject}
              />
            ),
          },
          {
            key: 'agencies',
            label: 'Đại lý',
            children: (
              <AgencyManager
                agencies={agencies}
                loading={loadingAgencies}
                onCreate={onCreateAgency}
                onUpdate={onUpdateAgency}
                onDelete={onDeleteAgency}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
