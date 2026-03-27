import { useEffect } from 'react';
import {
  Button,
  Layout,
  Menu,
  App as AntdApp,
  Space,
  Tag,
  theme,
} from 'antd';
import {
  DashboardOutlined,
  LogoutOutlined,
  SettingOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useSheetMapping } from './hooks/useSheetMapping';
import { useInvestors } from './hooks/useInvestors';
import { useAuth } from './contexts/AuthContext';
import DashboardScreen from './pages/DashboardScreen';
import CatalogScreen from './pages/CatalogScreen';
import SourcesScreen from './pages/SourcesScreen';
import SourceCreateScreen from './pages/SourceCreateScreen';
import SourceDetailScreen from './pages/SourceDetailScreen';
import UnitsScreen from './pages/UnitsScreen';
import SchemasScreen from './pages/SchemasScreen';
import LoginScreen from './pages/LoginScreen';
import SaleProjectsScreen from './pages/SaleProjectsScreen';
import SaleCheckCanScreen from './pages/SaleCheckCanScreen';
import SaleProjectDetailScreen from './pages/SaleProjectDetailScreen';

const { Header, Content } = Layout;

const NAV_ITEMS = [
  { key: '/dashboard', label: 'Dashboard', icon: <DashboardOutlined />, roles: ['super_admin'] },
  { key: '/catalog', label: 'Quản lý Danh mục', icon: <AppstoreOutlined />, roles: ['super_admin'] },
  { key: '/sources', label: 'Quản lý Nguồn căn', icon: <SettingOutlined />, roles: ['super_admin'] },
  { key: '/units', label: 'Quản lý Căn', icon: <AppstoreOutlined />, roles: ['super_admin'] },
  { key: '/schemas', label: 'Quản lý Schema', icon: <SettingOutlined />, roles: ['super_admin'] },
];

function hasAccess(roles, role) {
  return roles.includes(role);
}

function getMenuKey(pathname) {
  if (pathname.startsWith('/sources')) return '/sources';
  if (pathname.startsWith('/catalog')) return '/catalog';
  if (pathname.startsWith('/units')) return '/units';
  if (pathname.startsWith('/schemas')) return '/schemas';
  return '/dashboard';
}

function AppShell() {
  const { user, role, logout } = useAuth();
  const { notification } = AntdApp.useApp();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  const canViewAdmin = hasAccess(['super_admin'], role);
  const canViewSale = hasAccess(['sale', 'admin'], role);
  const defaultPath = canViewAdmin ? '/dashboard' : '/sale/projects';
  const navItems = NAV_ITEMS.filter((item) => hasAccess(item.roles, role));

  const catalog = useInvestors({
    canReadInvestors: canViewAdmin || canViewSale,
    canReadProjects: canViewAdmin || canViewSale,
    canReadAgencies: canViewAdmin || canViewSale,
    canReadSources: canViewAdmin,
  });
  const mapping = useSheetMapping();

  if (canViewSale) {
    return (
      <Routes>
        <Route
          path="/sale/projects"
          element={
            <SaleProjectsScreen
              user={user}
              allProjects={catalog.allProjects}
              investors={catalog.investors}
              loading={catalog.loadingProjects}
              loadingInvestors={catalog.loadingInvestors}
              onLogout={logout}
            />
          }
        />
        <Route
          path="/sale/projects/:projectId"
          element={
            <SaleProjectDetailScreen
              user={user}
              allProjects={catalog.allProjects}
              onLogout={logout}
            />
          }
        />
        <Route
          path="/sale/check-can"
          element={<SaleCheckCanScreen user={user} onLogout={logout} />}
        />
        <Route path="/" element={<Navigate to="/sale/projects" replace />} />
        <Route path="*" element={<Navigate to="/sale/projects" replace />} />
      </Routes>
    );
  }

  useEffect(() => {
    const isAllowedPath =
      (location.pathname.startsWith('/dashboard') && canViewAdmin) ||
      (location.pathname.startsWith('/catalog') && canViewAdmin) ||
      (location.pathname.startsWith('/sources') && canViewAdmin) ||
      (location.pathname.startsWith('/schemas') && canViewAdmin) ||
      (location.pathname.startsWith('/units') && canViewAdmin) ||
      location.pathname === '/';

    if (!isAllowedPath) {
      navigate(defaultPath, { replace: true });
    }
  }, [location.pathname, canViewAdmin, defaultPath, navigate]);

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
          items={navItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, border: 'none', lineHeight: '63px' }}
        />
        <Space>
          <Tag color="blue">{user?.username || 'user'} | {role}</Tag>
          <Button icon={<LogoutOutlined />} onClick={logout}>Đăng xuất</Button>
        </Space>
      </Header>

      <Content style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px', width: '100%' }}>
        <Routes>
          <Route path="/" element={<Navigate to={defaultPath} replace />} />
          <Route
            path="/dashboard"
            element={
              canViewAdmin ? (
                <DashboardScreen
                  catalog={catalog}
                  onGoToCreateSource={() => navigate('/sources/create')}
                  onGoToCatalog={() => navigate('/catalog')}
                />
              ) : <Navigate to={defaultPath} replace />
            }
          />
          <Route
            path="/catalog"
            element={canViewAdmin ? <CatalogScreen catalog={catalog} /> : <Navigate to={defaultPath} replace />}
          />
          <Route
            path="/sources"
            element={canViewAdmin ? <SourcesScreen catalog={catalog} /> : <Navigate to={defaultPath} replace />}
          />
          <Route
            path="/sources/create"
            element={canViewAdmin ? <SourceCreateScreen catalog={catalog} mapping={mapping} /> : <Navigate to={defaultPath} replace />}
          />
          <Route
            path="/sources/:sourceId"
            element={canViewAdmin ? <SourceDetailScreen catalog={catalog} mapping={mapping} /> : <Navigate to={defaultPath} replace />}
          />
          <Route
            path="/units"
            element={canViewAdmin ? <UnitsScreen catalog={catalog} /> : <Navigate to={defaultPath} replace />}
          />
          <Route
            path="/schemas"
            element={canViewAdmin ? <SchemasScreen /> : <Navigate to={defaultPath} replace />}
          />
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <AntdApp>
      <AppShell />
    </AntdApp>
  );
}
