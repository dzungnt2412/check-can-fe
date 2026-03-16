import { useEffect } from 'react';
import {
  Layout,
  Menu,
  App as AntdApp,
  theme,
} from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useSheetMapping } from './hooks/useSheetMapping';
import { useInvestors } from './hooks/useInvestors';
import DashboardScreen from './pages/DashboardScreen';
import CatalogScreen from './pages/CatalogScreen';
import SourcesScreen from './pages/SourcesScreen';
import SourceCreateScreen from './pages/SourceCreateScreen';
import SourceDetailScreen from './pages/SourceDetailScreen';
import UnitsScreen from './pages/UnitsScreen';
import SchemasScreen from './pages/SchemasScreen';

const { Header, Content } = Layout;

const NAV_ITEMS = [
  { key: '/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/catalog', label: 'Quản lý Danh mục', icon: <AppstoreOutlined /> },
  { key: '/sources', label: 'Quản lý Nguồn căn', icon: <SettingOutlined /> },
  { key: '/units', label: 'Quản lý Căn', icon: <AppstoreOutlined /> },
  { key: '/schemas', label: 'Quản lý Schema', icon: <SettingOutlined /> },
];

function getMenuKey(pathname) {
  if (pathname.startsWith('/sources')) return '/sources';
  if (pathname.startsWith('/catalog')) return '/catalog';
  if (pathname.startsWith('/units')) return '/units';
  if (pathname.startsWith('/schemas')) return '/schemas';
  return '/dashboard';
}

function AppShell() {
  const { notification } = AntdApp.useApp();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  const catalog = useInvestors();
  const mapping = useSheetMapping();

  useEffect(() => {
    if (mapping.successMessage) {
      notification.success({ message: mapping.successMessage, duration: 3 });
      mapping.setSuccessMessage('');
    }
  }, [mapping.successMessage]);

  useEffect(() => {
    if (mapping.errorMapping) {
      notification.error({ message: mapping.errorMapping, duration: 4 });
      mapping.setErrorMapping('');
    }
  }, [mapping.errorMapping]);

  useEffect(() => {
    if (!catalog.success && !catalog.error) return;
    if (catalog.success) notification.success({ message: catalog.success, duration: 3 });
    if (catalog.error) notification.error({ message: catalog.error, duration: 4 });
    catalog.setSuccess('');
    catalog.setError('');
  }, [catalog.success, catalog.error]);

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <Header
        style={{
          position: 'sticky', top: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '0 24px', background: '#fff',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 16, color: token.colorPrimary, whiteSpace: 'nowrap' }}>
          SheetMapper
        </span>
        <Menu
          mode="horizontal"
          selectedKeys={[getMenuKey(location.pathname)]}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, border: 'none', lineHeight: '63px' }}
        />
      </Header>

      <Content style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px', width: '100%' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <DashboardScreen
                catalog={catalog}
                onGoToCreateSource={() => navigate('/sources/create')}
                onGoToCatalog={() => navigate('/catalog')}
              />
            }
          />
          <Route path="/catalog" element={<CatalogScreen catalog={catalog} />} />
          <Route path="/sources" element={<SourcesScreen catalog={catalog} />} />
          <Route path="/sources/create" element={<SourceCreateScreen catalog={catalog} mapping={mapping} />} />
          <Route path="/sources/:sourceId" element={<SourceDetailScreen catalog={catalog} mapping={mapping} />} />
          <Route path="/units" element={<UnitsScreen catalog={catalog} />} />
          <Route path="/schemas" element={<SchemasScreen />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default function App() {
  return (
    <AntdApp>
      <AppShell />
    </AntdApp>
  );
}
