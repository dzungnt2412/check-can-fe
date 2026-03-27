import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Grid,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  HeartFilled,
  BellOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  LogoutOutlined,
  ReloadOutlined,
  PictureOutlined,
  TagsOutlined,
  SearchOutlined,
  ShopOutlined,
  MenuOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import headerLogo from '../assets/images/logo.png';

const { Title, Text } = Typography;

const PROJECT_IMAGES = [
  'https://s3-hfx03.fptcloud.com/admin-bds/odoo/OCP3.jpg_1d2dd88d3dcd0aa69ff79dcf2b778c5e00f99339',
];


function getProjectNameFontSize(name = '') {
  const length = String(name || '').trim().length;
  if (length > 38) return 22;
  if (length > 28) return 26;
  return 30;
}

function normalizeProjects(allProjects = [], agencies = [], useFallback = true) {
  const agencyMap = new Map((agencies || []).map((item) => [String(item.id), item]));

  // if (!allProjects.length) {
  //   if (!useFallback) return [];

  //   return FALLBACK_PROJECTS.map((item, idx) => {
  //     const agency = agencies[idx % Math.max(agencies.length, 1)];
  //     return {
  //       ...item,
  //       agency_id: agency?.id,
  //       agency_name: String(agency?.name || 'Đại lý mặc định').toUpperCase(),
  //     };
  //   });
  // }

  return allProjects.map((item, idx) => ({
    id: item.id || idx + 1,
    name: String(item.name || item.project_name || `Du an ${idx + 1}`).toUpperCase(),
    investor: item.investor_name || item.investor || 'Chưa cập nhật',
    investor_id: item.investor_id,
    location: item.location || item.address || item.province || ' Văn Lâm, Hưng Yên',
    description: item.description || 'Vinhomes Ocean Park 3 - “Quận nghỉ dưỡng” của Thành phố điểm đến Ocean City',
    type: idx % 4 === 0 ? 'DỰ ÁN CAO TẦNG' : 'DỰ ÁN THẤP TẦNG',
    agency_id: item.agency_id,
    agency_name: String(item.agency_name || agencyMap.get(String(item.agency_id))?.name || 'Đại lý mặc định').toUpperCase(),
  }));
}

export default function SaleProjectsScreen({
  user,
  allProjects = [],
  investors = [],
  loading = false,
  loadingInvestors = false,
  onLogout,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [investorFilter, setInvestorFilter] = useState();
  const [projectFilter, setProjectFilter] = useState();
  const [statusFilter, setStatusFilter] = useState();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const projects = useMemo(() => normalizeProjects(allProjects, [], true), [allProjects]);
  const sidebarProjects = useMemo(() => normalizeProjects(allProjects, [], false), [allProjects]);

  const investorOptions = useMemo(
    () => (investors || []).map((item) => ({
      value: item.id,
      label: String(item.name || '').toUpperCase(),
      rawName: String(item.name || '').trim(),
    })),
    [investors]
  );

  const projectOptions = useMemo(
    () => projects.map((item) => ({ value: item.id, label: item.name })),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const selectedInvestor = investorOptions.find((item) => String(item.value) === String(investorFilter));

    return projects.filter((item) => {
      const passSearch = !searchText || item.name.toLowerCase().includes(searchText.toLowerCase());
      const passInvestor = !investorFilter || (
        String(item.investor_id) === String(investorFilter)
        || String(item.investor || '').trim().toLowerCase() === String(selectedInvestor?.rawName || '').toLowerCase()
      );
      const passProject = !projectFilter || String(item.id) === String(projectFilter);
      const passStatus = !statusFilter || (statusFilter === 'selling' ? item.id % 2 === 0 : item.id % 2 !== 0);
      return passSearch && passInvestor && passProject && passStatus;
    });
  }, [projects, searchText, investorFilter, projectFilter, statusFilter, investorOptions]);

  const sidebarListProjects = sidebarProjects;

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '10px 12px' : '10px 20px',
        }}
      >
        {isMobile ? (
          <div style={{ maxWidth: 1600, margin: '0 auto', display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Space size={6} align="center">
                <img
                  src={headerLogo}
                  alt="Roman Property"
                  style={{ height: 28, width: 'auto', display: 'block' }}
                />
              </Space>
              <Space size={4} align="center">
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 30,
                    padding: '0 10px',
                    borderRadius: 999,
                    background: '#f3f4f6',
                    color: '#111827',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: '#86efac' }} />
                  86 online
                </div>
                <Button type="text" icon={<ReloadOutlined />} style={{ color: '#94a3b8' }} />
                <div style={{ position: 'relative' }}>
                  <Button type="text" icon={<BellOutlined />} style={{ color: '#94a3b8' }} />
                  <span
                    style={{
                      position: 'absolute',
                      top: 1,
                      right: 3,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 999,
                      background: '#f43f5e',
                      color: '#fff',
                      fontSize: 10,
                      lineHeight: '16px',
                      textAlign: 'center',
                      fontWeight: 700,
                      paddingInline: 4,
                    }}
                  >
                    22
                  </span>
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    border: '1px solid #d1d5db',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f97316',
                    fontWeight: 700,
                    fontSize: 12,
                    background: '#fff',
                  }}
                >
                  {(user?.username || 'S').slice(0, 1).toUpperCase()}
                </div>
              </Space>

              <Button
                icon={<MenuOutlined />}
                onClick={() => setIsMobileMenuOpen(true)}
                type="text"
                style={{ color: '#94a3b8' }}
              />
            </div>

            <Drawer
              open={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
              placement="right"
              title="Menu"
              width={280}
            >
              <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Link
                    to="/sale/projects"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 8,
                      color: '#111827',
                      fontWeight: location.pathname === '/sale/projects' ? 700 : 500,
                      background: location.pathname === '/sale/projects' ? '#eff6ff' : 'transparent',
                    }}
                  >
                    DỰ ÁN
                  </Link>
                  <Link
                    to="/sale/check-can"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 8,
                      color: '#111827',
                      fontWeight: location.pathname === '/sale/check-can' ? 700 : 500,
                      background: location.pathname === '/sale/check-can' ? '#eff6ff' : 'transparent',
                    }}
                  >
                    QUỸ CĂN
                  </Link>
                </Space>

                <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                  <Button
                    block
                    icon={<LogoutOutlined />}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                  >
                    Đăng xuất
                  </Button>
                </div>
              </div>
            </Drawer>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1600, margin: '0 auto' }}>
            <Space size={28} align="center">
              <Space size={8} align="center">
                <img
                  src={headerLogo}
                  alt="Roman Property"
                  style={{ height: 42, width: 'auto', display: 'block' }}
                />
              </Space>
              <Space size={24} wrap>
                <Text style={{ fontWeight: 700 }}>GIỚI THIỆU</Text>
                <Link to="/sale/projects" style={{ color: '#111827' }}>
                  <Text
                    style={{
                      fontWeight: 700,
                      textDecoration: location.pathname === '/sale/projects' ? 'underline' : 'none',
                    }}
                  >
                    DỰ ÁN
                  </Text>
                </Link>
                <Link to="/sale/check-can" style={{ color: '#111827' }}>
                  <Text
                    style={{
                      fontWeight: 700,
                      textDecoration: location.pathname === '/sale/check-can' ? 'underline' : 'none',
                    }}
                  >
                    QUỸ CĂN
                  </Text>
                </Link>
                <Text style={{ fontWeight: 700 }}>TIN TỨC</Text>
              </Space>
            </Space>

            <Space>
              <Tag color="blue">{user?.username || 'sale'}</Tag>
              <Button
                icon={<LogoutOutlined />}
                onClick={onLogout}
                style={{ background: '#d99800', color: '#fff', borderColor: '#d99800', fontWeight: 700 }}
              >
                Đăng xuất
              </Button>
            </Space>
          </div>
        )}
      </header>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: isMobile ? '14px 12px 20px' : '18px 24px 28px' }}>
        <Title level={2} style={{ textAlign: 'center', marginTop: 4, marginBottom: 10, fontWeight: 700, fontSize: isMobile ? 30 : 45 }}>DANH SÁCH DỰ ÁN</Title>

        <Row gutter={8} justify="center" style={{ marginBottom: 14 }}>
          <Col xs={24} md={8}>
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Tim kiem du an..."
              prefix={<SearchOutlined />}
              style={{ height: 38 }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              prefix={<ShopOutlined />}
              placeholder="Chọn chủ đầu tư"
              value={investorFilter}
              onChange={setInvestorFilter}
              options={investorOptions}
              style={{ width: '100%' }}
              loading={loadingInvestors}
            />
          </Col>
          <Col xs={12} md={3}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              prefix={<FilterOutlined />}
              placeholder="Chọn dự án"
              value={projectFilter}
              onChange={setProjectFilter}
              options={projectOptions}
              style={{ width: '100%' }}
              loading={loading}
            />
          </Col>
          <Col xs={12} md={3}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              prefix={<PictureOutlined />}
              placeholder="Chọn loại hình"
              options={[{ value: 'highrise', label: 'Cao tầng' }, { value: 'lowrise', label: 'Thấp tầng' }]}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={3}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              prefix={<TagsOutlined />}
              placeholder="Chọn trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: 'selling', label: 'Đang bán' }, { value: 'new', label: 'Mới' }]}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>

        <Row gutter={[14, 14]} align="top">
          <Col xs={24} xl={18}>
            {loading ? (
              <Card><Spin /></Card>
            ) : filteredProjects.length === 0 ? (
              <Card><Empty description="Khong co du an phu hop" /></Card>
            ) : (
              <Row gutter={[12, 12]} align="stretch">
                {filteredProjects.map((project, idx) => (
                  <Col xs={24} md={12} xxl={8} key={project.id} style={{ display: 'flex' }}>
                    {(() => {
                      const isHovered = hoveredProjectId === project.id;
                      return (
                    <Card
                      styles={{
                        body: {
                          padding: 10,
                          display: 'flex',
                          flexDirection: 'column',
                          flex: 1,
                        },
                      }}
                      style={{
                        borderRadius: 10,
                        overflow: 'hidden',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'transform 120ms ease, box-shadow 120ms ease',
                        transform: 'none',
                        boxShadow: isHovered
                          ? '0 12px 28px rgba(15,23,42,0.18)'
                          : '0 4px 14px rgba(15,23,42,0.12)',
                      }}
                      onMouseEnter={() => setHoveredProjectId(project.id)}
                      onMouseLeave={() => setHoveredProjectId(null)}
                      onClick={() => navigate(`/sale/projects/${project.id}`)}
                      cover={(
                        <div style={{ position: 'relative' }}>
                          <img
                            src={PROJECT_IMAGES[idx % PROJECT_IMAGES.length]}
                            alt={project.name}
                            style={{
                              width: '100%',
                              height: isMobile ? 180 : 220,
                              objectFit: 'cover',
                              transition: 'transform 200ms ease',
                              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                            }}
                          />
                          <HeartFilled style={{ position: 'absolute', top: 12, right: 12, color: '#fff', fontSize: 22, opacity: 0.9 }} />


                        </div>
                      )}
                    >
                      <Space direction="vertical" size={6} style={{ width: '100%', height: '100%' }}>
                        <Space align="start" style={{ width: '100%', justifyContent: 'space-between', gap: 12 }}>
                          <Text
                            style={{
                              fontSize: isMobile ? 18 : 20,
                              fontWeight: 600,
                              lineHeight: 1.25,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: isMobile ? 24 : 26,
                            }}
                          >
                            {project.name}
                          </Text>
                          <Button
                            type="text"
                            icon={<ExportOutlined />}
                            style={{ color: '#f59e0b', padding: 4, border: '1px solid #fde68a', borderRadius: 6 }}
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/sale/projects/${project.id}`);
                            }}
                          />
                        </Space>
                        <Text
                          type="secondary"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: 44,
                          }}
                        >
                          {project.description}
                        </Text>
                        <Space size={6} align="start" style={{ marginTop: 'auto' }}>
                          <EnvironmentOutlined style={{ color: '#9ca3af' }} />
                          <Text
                            type="secondary"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: 44,
                            }}
                          >
                            {project.location}
                          </Text>
                        </Space>
                      </Space>
                    </Card>
                      );
                    })()}
                  </Col>
                ))}
              </Row>
            )}
          </Col>

          <Col xs={24} xl={6}>
            <Card
              title={<span style={{ color: '#fff', fontWeight: 700 }}>DỰ ÁN ĐANG BÁN CHẠY</span>}
              styles={{
                header: { background: '#1e4f8f' },
                body: { paddingTop: 10 },
              }}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div>
                  <Text style={{ color: '#1e4f8f', fontWeight: 700 }}>Danh sách dự án</Text>
                  <div style={{ marginTop: 8, display: 'grid', gap: 8, borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
                    {sidebarListProjects.length
                      ? sidebarListProjects.map((item) => <Text key={`sidebar-${item.id}`} strong>{item.name}</Text>)
                      : <Text type="secondary">Chưa có dữ liệu dự án từ API</Text>}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
