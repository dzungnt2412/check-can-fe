import { Card, Row, Col, Statistic, Steps, Button, Tag, Space, Typography } from 'antd';
import {
  BankOutlined, ProjectOutlined, TeamOutlined,
  PlusOutlined, AppstoreOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const STEPS = [
  { title: 'Inspect Sheet', description: 'Nhập link Google Sheet → bấm "Inspect" để lấy tabs.' },
  { title: 'Chọn tab & Preview', description: 'Chọn tab, set header/data row index, bấm "Preview".' },
  { title: 'Create Source', description: 'Điền source_code, source_name, chọn dự án và đại lý.' },
  { title: 'Mapping', description: 'Map từng schema field với cột nguồn tương ứng.' },
  { title: 'Save & Sync', description: 'Bấm "Save Mapping" rồi "Sync now" để đồng bộ dữ liệu.' },
];

export default function DashboardPage({
  investors,
  allProjects,
  agencies,
  loadingInvestors,
  loadingProjects,
  loadingAgencies,
  onGoToConfig,
  onGoToCatalog,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Welcome banner */}
      <Card style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)', border: '1px solid #bfdbfe' }}>
        <Title level={4} style={{ margin: 0 }}>Google Sheet Mapping Config</Title>
        <Paragraph type="secondary" style={{ marginBottom: 16, marginTop: 4 }}>
          Công cụ kết nối dữ liệu Google Sheet vào hệ thống backend một cách linh hoạt.
        </Paragraph>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={onGoToConfig}>
            Tạo Source mới
          </Button>
          <Button icon={<AppstoreOutlined />} onClick={onGoToCatalog}>
            Quản lý Danh mục
          </Button>
        </Space>
      </Card>

      {/* Stats */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Chủ đầu tư"
              value={loadingInvestors ? '-' : investors.length}
              prefix={<BankOutlined />}
              loading={loadingInvestors}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Dự án"
              value={loadingProjects ? '-' : allProjects.length}
              prefix={<ProjectOutlined />}
              loading={loadingProjects}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đại lý"
              value={loadingAgencies ? '-' : agencies.length}
              prefix={<TeamOutlined />}
              loading={loadingAgencies}
            />
          </Card>
        </Col>
      </Row>

      {/* How-to steps */}
      <Card title="Hướng dẫn sử dụng">
        <Steps
          direction="vertical"
          size="small"
          current={-1}
          items={STEPS.map((step) => ({
            title: step.title,
            description: step.description,
          }))}
        />
      </Card>

      {/* Catalog tags */}
      {allProjects.length > 0 || agencies.length > 0 ? (
        <Card title="Danh mục dùng trong Source">
          <Space size="small" wrap>
            {allProjects.map((project) => (
              <Tag key={`project-${project.id}`} color="blue">
                {project.name} <Text type="secondary" style={{ fontSize: 11 }}>(Dự án)</Text>
              </Tag>
            ))}
            {agencies.map((agency) => (
              <Tag key={`agency-${agency.id}`} color="green">
                {agency.name} <Text type="secondary" style={{ fontSize: 11 }}>(Đại lý)</Text>
              </Tag>
            ))}
          </Space>
        </Card>
      ) : null}
    </div>
  );
}

