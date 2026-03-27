import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Carousel,
  Col,
  Drawer,
  Grid,
  Image,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ApartmentOutlined,
  BarsOutlined,
  BellOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  FireFilled,
  HomeOutlined,
  LeftOutlined,
  LogoutOutlined,
  MenuOutlined,
  NotificationOutlined,
  PartitionOutlined,
  PhoneFilled,
  PictureOutlined,
  PlayCircleFilled,
  RightOutlined,
  ReloadOutlined,
  ShareAltOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import headerLogo from '../assets/images/logo.png';

const { Title, Text, Paragraph } = Typography;

const MASTER_PLAN_IMAGE =
  'https://s3-hfx03.fptcloud.com/admin-bds/odoo/image_a8db675e6b8a0ab5d0e7e34f017871713150038c';
const AMENITY_VIDEO_THUMB =
  'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1400&q=80';

const OVERVIEW_IMAGE = 'https://s3-hfx03.fptcloud.com/admin-bds/odoo/image_a8db675e6b8a0ab5d0e7e34f017871713150038c';
const OVERVIEW_ITEMS = [
  'Tên dự án: Vinhomes Ocean Park 3 - The Crown',
  'Chủ đầu tư: Vinhomes',
  'Vị trí: Xã Nghĩa Trụ, Long Hưng, Văn Giang, Hưng Yên',
  'Loại hình : Liền kề, Song Lập, Đơn Lập, Shophouse',
  'Hình thức sở hữu: Sở hữu lâu dài hoặc 50 năm',
  'Tổng diện tích: 294ha',
  'Mật độ xây dựng: 35%',
  'Quy mô phát triển: 8.458 căn nhà ở thấp tầng',
  'Thời điểm khởi công: Quý II/2022',
  'Tiến độ: Đang xây dựng',
];

const ZONING_TABS = [
  'TỔNG MẶT BẰNG TIỆN ÍCH',
  'PHÂN KHU LẠCH VÂN',
  'PHÂN KHU UYÊN MÂY',
  'PHÂN KHU ĐÀO NGỌC',
  'PHÂN KHU TỊNH VÂN',
  'MẶT BẰNG CAO ỐC',
];

const PRODUCT_SLIDES = [
  [
    {
      name: 'Liền kề',
      image: 'https://images.unsplash.com/photo-1600607687644-c7f34b5f8d08?auto=format&fit=crop&w=1600&q=80',
      quantity: '2.500 căn',
      area: '50 m² đến 191,5 m²',
    },
    {
      name: 'Shophouse',
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
      quantity: '760 căn',
      area: '56 m² đến 253,6 m²',
    },
    {
      name: 'Biệt thự đơn lập',
      image: 'https://images.unsplash.com/photo-1464037890953-1c1b62d1f1a9?auto=format&fit=crop&w=1600&q=80',
      quantity: '244 căn',
      area: '180 m² đến 603,8 m²',
    },
  ],
  [
    {
      name: 'Liền kề sân vườn',
      image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80',
      quantity: '220 căn',
      area: '70 m² đến 210 m²',
    },
    {
      name: 'Nhà phố thương mại',
      image: 'https://images.unsplash.com/photo-1529429617124-aee3ce5231c0?auto=format&fit=crop&w=1600&q=80',
      quantity: '180 căn',
      area: '60 m² đến 180 m²',
    },
    {
      name: 'Biệt thự song lập',
      image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80',
      quantity: '120 căn',
      area: '200 m² đến 480 m²',
    },
  ],
];

const AMENITY_ITEMS = [
  {
    title: 'PHỐ ĐI BỘ BỜ BIỂN',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'RESORT 5 SAO',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'SUỐI KHOÁNG CAO CẤP',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'VƯỜN SỨC KHỎE',
    image: 'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?auto=format&fit=crop&w=900&q=80',
  },
];

const ADVISORS = [
  { name: 'GDDA Mr Dũng', phone: '0935257339' },
  { name: 'Admin Ms Phương', phone: '0394155716' },
];

const HERO_SLIDES = [
  {
    image: 'https://s3-hfx03.fptcloud.com/admin-bds/odoo/image_a8db675e6b8a0ab5d0e7e34f017871713150038c',
  },
  {
    image: 'https://s3-hfx03.fptcloud.com/admin-bds/odoo/image_441dc2abfde5110a397358edd0d601ab5eab9ded',
  },
  {
    image: 'https://s3-hfx03.fptcloud.com/admin-bds/odoo/image_db5683f33ba4aca2acc6afba140465839e2a8c90',
  }
];

const QUICK_LINKS = [
  { label: 'Tổng quan', icon: <FireFilled style={{ color: '#f59e0b' }} /> },
  { label: 'Vị trí', icon: <EnvironmentOutlined /> },
  { label: 'Ảnh 360', icon: <CameraOutlined /> },
  { label: 'Phân khu', icon: <PartitionOutlined /> },
  { label: 'Mặt bằng quỹ căn', icon: <PictureOutlined /> },
  { label: 'Quỹ căn', icon: <ShopOutlined /> },
  { label: 'Chính sách bán hàng', icon: <BarsOutlined /> },
  { label: 'Góc nhìn chuyên gia', icon: <HomeOutlined /> },
  { label: 'Tiến độ', icon: <NotificationOutlined /> },
  { label: 'Tài liệu', icon: <FileTextOutlined /> },
  { label: 'Tin tức', icon: <FileTextOutlined /> },
];

const PROJECT_METRICS = [
  {
    title: 'Sản phẩm',
    value: '5792 biệt thự | 404 TMDV',
    icon: <ApartmentOutlined style={{ color: '#fff', fontSize: 18 }} />,
  },
  {
    title: 'Thiết kế',
    value: '4 tầng',
    icon: <PictureOutlined style={{ color: '#fff', fontSize: 18 }} />,
  },
  {
    title: 'Quy mô',
    value: '512,16 ha',
    icon: <BarsOutlined style={{ color: '#fff', fontSize: 18 }} />,
  },
];


const ACTIVE_TAB = ZONING_TABS[0];

function ProjectMediaPanel({ title, subtitle, image }) {
  return (
    <section
      style={{
        background: 'linear-gradient(110deg, rgba(132, 9, 9, 0.96), rgba(172, 20, 20, 0.92))',
        borderRadius: 10,
        padding: 22,
        marginTop: 28,
        boxShadow: '0 8px 24px rgba(127, 29, 29, 0.22)',
      }}
    >
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} lg={10}>
          <Title level={2} style={{ color: '#f3c66f', marginBottom: 12, fontSize: 36 }}>
            {title}
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.92)', marginBottom: 0, fontSize: 15 }}>
            {subtitle}
          </Paragraph>
        </Col>
        <Col xs={24} lg={14}>
          <div style={{ position: 'relative' }}>
            <Image
              src={image}
              alt={title}
              preview={false}
              style={{ width: '100%', borderRadius: 14, border: '1px solid rgba(255,255,255,0.45)' }}
            />
            <Button
              type="text"
              shape="circle"
              icon={<PlayCircleFilled style={{ fontSize: 66, color: 'rgba(17,24,39,0.75)' }} />}
              style={{
                position: 'absolute',
                inset: 0,
                width: 90,
                height: 90,
                margin: 'auto',
                background: 'transparent',
              }}
            />
          </div>
        </Col>
      </Row>
    </section>
  );
}

export default function SaleProjectDetailScreen({ user, allProjects = [], onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeQuickLink, setActiveQuickLink] = useState('Tổng quan');
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [productSlideIndex, setProductSlideIndex] = useState(0);
  const heroCarouselRef = useRef(null);
  const productCarouselRef = useRef(null);

  useEffect(() => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const currentProject = useMemo(() => {
    if (!allProjects?.length) {
      return {
        id: projectId,
        name: 'VINHOMES HẢI VÂN BAY',
        location: 'Vịnh Nam Chơn (Làng Vân), Liên Chiểu, TP. Đà Nẵng',
      };
    }

    const matched = allProjects.find((item) => String(item.id) === String(projectId));
    if (!matched) {
      return {
        id: projectId,
        name: 'VINHOMES HẢI VÂN BAY',
        location: 'Vịnh Nam Chơn (Làng Vân), Liên Chiểu, TP. Đà Nẵng',
      };
    }

    return {
      id: matched.id,
      name: String(matched.name || matched.project_name || 'VINHOMES HẢI VÂN BAY').toUpperCase(),
      location: matched.location || matched.address || 'Vịnh Nam Chơn (Làng Vân), Liên Chiểu, TP. Đà Nẵng',
    };
  }, [allProjects, projectId]);

  return (
    <div style={{ minHeight: '100vh', background: '#ececec', paddingBottom: 40 }}>
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
                      fontWeight: 700,
                      background: '#eff6ff',
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
                  <Text style={{ fontWeight: 700, textDecoration: 'underline' }}>
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

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '16px 12px' : '24px 18px' }}>
        <section style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <Space size={8} wrap>
              <Link to="/sale/projects" style={{ color: '#111827', fontWeight: 600 }}>
                Trang chủ
              </Link>
              <Text style={{ color: '#9ca3af' }}>/</Text>
              <Text style={{ color: '#6b7280', fontWeight: 600 }}>Chi tiết dự án</Text>
            </Space>
            <Space size={8} wrap>
              <Tag
                style={{
                  marginInlineEnd: 0,
                  borderRadius: 999,
                  border: '1px solid #f2b840',
                  color: '#a16207',
                  background: '#fff7e6',
                  fontWeight: 700,
                  padding: '2px 10px',
                }}
              >
                Sắp mở bán
              </Tag>
              <Button size="small" type="text" icon={<ShareAltOutlined />} style={{ color: '#6b7280', fontWeight: 700 }}>
                Chia sẻ
              </Button>
            </Space>
          </div>

          <Card
            bodyStyle={{ padding: isMobile ? 14 : 18 }}
            style={{ borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}
          >
            <Title level={2} style={{ marginBottom: 8, color: '#0f3f75', fontSize: isMobile ? 30 : 42 }}>
              {currentProject.name}
            </Title>
            <Text style={{ color: '#374151', fontSize: 14 }}>
              Theo dõi thông tin chi tiết về bảng giá, mặt bằng, tiến độ và chính sách bán hàng dự án {currentProject.name}.
            </Text>
          </Card>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 12,
              marginBottom: 14,
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: 10,
            }}
          >
            {QUICK_LINKS.map((item) => {
              const isActive = item.label === activeQuickLink;
              return (
                <Button
                  key={item.label}
                  type="text"
                  size="small"
                  onClick={() => {
                    setActiveQuickLink(item.label);
                    if (item.label !== 'Quỹ căn') return;

                    const selectedProjectId = Number(currentProject?.id);
                    if (Number.isInteger(selectedProjectId) && selectedProjectId > 0) {
                      navigate(`/sale/check-can?project_id=${selectedProjectId}`);
                      return;
                    }

                    navigate('/sale/check-can');
                  }}
                  style={{
                    color: isActive ? '#d97706' : '#374151',
                    fontWeight: isActive ? 700 : 500,
                    paddingInline: 4,
                    borderBottom: isActive ? '2px solid #f59e0b' : '2px solid transparent',
                    borderRadius: 0,
                  }}
                  icon={item.icon}
                >
                  {item.label}
                </Button>
              );
            })}
          </div>

          <div
            style={{
              position: 'relative',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <Carousel
              ref={heroCarouselRef}
              dots={false}
              beforeChange={(_, next) => setHeroSlideIndex(next)}
            >
              {HERO_SLIDES.map((slide) => (
                <div key={slide.image}>
                  <div style={{ position: 'relative' }}>
                    <Image
                      src={slide.image}
                      alt={slide.heading}
                      preview={false}
                      style={{ width: '100%', height: isMobile ? 240 : 560, objectFit: 'cover', opacity: 0.95, display: 'block' }}
                    />
                  </div>
                </div>
              ))}
            </Carousel>

            <Button
              shape="circle"
              icon={<LeftOutlined />}
              onClick={() => heroCarouselRef.current?.prev()}
              style={{
                position: 'absolute',
                left: 18,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(15, 23, 42, 0.36)',
                color: '#fff',
                borderColor: 'transparent',
              }}
            />
            <Button
              shape="circle"
              icon={<RightOutlined />}
              onClick={() => heroCarouselRef.current?.next()}
              style={{
                position: 'absolute',
                right: 18,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(15, 23, 42, 0.36)',
                color: '#fff',
                borderColor: 'transparent',
              }}
            />

            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 14,
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {HERO_SLIDES.map((_, idx) => {
                const isActive = idx === heroSlideIndex;
                return (
                  <Button
                    key={`hero-dot-${idx + 1}`}
                    shape="circle"
                    size="small"
                    onClick={() => heroCarouselRef.current?.goTo(idx)}
                    style={{
                      width: 24,
                      minWidth: 24,
                      height: 24,
                      border: 'none',
                      background: isActive ? '#f59e0b' : 'rgba(255,255,255,0.75)',
                      color: isActive ? '#111827' : '#374151',
                      fontWeight: 700,
                    }}
                  >
                    {idx + 1}
                  </Button>
                );
              })}
            </div>
          </div>

          <Row gutter={[12, 12]} style={{ marginTop: 14 }} align="stretch">
            {PROJECT_METRICS.map((metric) => {
              const isLongValue = String(metric.value || '').length > 20;
              const valueFontSize = isMobile
                ? (isLongValue ? 16 : 18)
                : (isLongValue ? 18 : 20);

              return (
              <Col xs={24} md={8} key={metric.title} style={{ display: 'flex' }}>
                <Card
                  bodyStyle={{ padding: isMobile ? '12px 14px' : '14px 16px', height: '100%' }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 14,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                  }}
                >
                  <Space align="start" size={12} style={{ width: '100%' }}>
                    <div
                      style={{
                        width: isMobile ? 44 : 44,
                        height: isMobile ? 44 : 44,
                        borderRadius: 999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(150deg, #c2410c, #b91c1c)',
                        boxShadow: '0 8px 20px rgba(153, 27, 27, 0.24)',
                      }}
                    >
                      {metric.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Text style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>{metric.title}</Text>
                      <div
                        style={{
                          marginTop: 4,
                          color: '#991b1b',
                          fontWeight: 800,
                          fontSize: valueFontSize,
                          lineHeight: 1.2,
                        }}
                      >
                        {metric.value}
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
              );
            })}
          </Row>
        </section>

        <section style={{ marginTop: 32 }}>
          <div
            style={{
              background: '#1f3041',
              borderRadius: 18,
              padding: isMobile ? 16 : 24,
              boxShadow: '0 14px 36px rgba(15,23,42,0.22)',
              overflow: 'hidden',
              border: '1px solid #dfe4ea',
            }}
          >
            <Row gutter={[20, 20]} align="middle">
              <Col xs={24} lg={11}>
                <div style={{ borderBottom: '4px solid #f97316', display: 'inline-block', marginBottom: 12 }}>
                  <Title level={2} style={{ color: '#f97316', margin: 0, fontSize: isMobile ? 24 : 28, fontWeight: 800 }}>
                    Tổng quan dự án
                  </Title>
                </div>
                <ul
                  style={{
                    paddingLeft: 20,
                    margin: 0,
                    color: '#f1f5f9',
                    fontSize: 16,
                    lineHeight: 1.65,
                    fontWeight: 600,
                  }}
                >
                  {OVERVIEW_ITEMS.map((item) => (
                    <li key={item} style={{ marginBottom: 8 }}>{item}</li>
                  ))}
                </ul>
              </Col>
              <Col xs={24} lg={13}>
                <div
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: '#0f172a',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Image
                    src={OVERVIEW_IMAGE}
                    alt={`Tổng quan ${currentProject.name}`}
                    preview={false}
                    style={{ width: '100%', display: 'block', objectFit: 'cover', minHeight: isMobile ? 220 : 420 }}
                  />
                </div>
              </Col>
            </Row>
          </div>
        </section>

        <div style={{ textAlign: 'center', marginBottom: 16, marginTop: 36 }}>
          <Title level={2} style={{ color: '#0f172a', marginBottom: 6 }}>
            Mặt bằng
          </Title>
          <Text style={{ color: '#6b7280' }}>Thiết kế chi tiết các tầng</Text>
        </div>

        <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
          {ZONING_TABS.map((label) => {
            const isActive = label === ACTIVE_TAB;
            return (
              <Tag
                key={label}
                style={{
                  marginInlineEnd: 0,
                  borderRadius: 999,
                  padding: '8px 12px',
                  border: isActive ? 'none' : '1px solid #d1d5db',
                  background: isActive ? '#e8aa5f' : '#f3f4f6',
                  color: isActive ? '#fff' : '#4b5563',
                  fontWeight: 700,
                  cursor: 'default',
                }}
              >
                {label}
              </Tag>
            );
          })}
        </Space>


          <Image 
            src={MASTER_PLAN_IMAGE}
            alt="Master Plan"
            preview={false}
            style={{ width: '100%', borderRadius: 8, maxHeight: isMobile ? 360 : 650, objectFit: 'cover' }}
          />
     

        <section style={{ marginTop: 36 }}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <Title level={2} style={{ color: '#0f172a', marginBottom: 6 }}>
              Sản phẩm
            </Title>
            <Text style={{ color: '#6b7280' }}>Đa dạng lựa chọn cho mọi nhu cầu</Text>
          </div>

          <div style={{ position: 'relative', padding: isMobile ? '0 0 24px' : '0 32px 28px' }}>
            <Carousel
              ref={productCarouselRef}
              dots={false}
              autoplay
              beforeChange={(_, next) => setProductSlideIndex(next)}
            >
              {PRODUCT_SLIDES.map((group, groupIdx) => (
                <div key={`group-${groupIdx}`}>
                  <Row gutter={[18, 18]}>
                    {group.map((item) => (
                      <Col xs={24} md={8} key={item.name}>
                        <Card
                          hoverable
                          bodyStyle={{ padding: 16 }}
                          cover={(
                            <Image
                              src={item.image}
                              alt={item.name}
                              preview={false}
                              style={{ height: isMobile ? 220 : 280, objectFit: 'cover', display: 'block' }}
                            />
                          )}
                          style={{
                            borderRadius: 14,
                            border: '1px solid #f3f4f6',
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 10 }}>{item.name}</div>
                          <div style={{ color: '#374151', fontWeight: 600, lineHeight: 1.6 }}>
                            <div>
                              - Số lượng: <span style={{ fontWeight: 800 }}>{item.quantity}</span>
                            </div>
                            <div>
                              - Diện tích: <span style={{ fontWeight: 800 }}>{item.area}</span>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              ))}
            </Carousel>

            {!isMobile && (
              <>
                <Button
                  shape="circle"
                  icon={<LeftOutlined />}
                  onClick={() => productCarouselRef.current?.prev()}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '45%',
                    transform: 'translate(-50%, -50%)',
                    width: 44,
                    height: 44,
                    background: '#f3f4f6',
                    borderColor: '#e5e7eb',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                    color: '#111827',
                  }}
                />
                <Button
                  shape="circle"
                  icon={<RightOutlined />}
                  onClick={() => productCarouselRef.current?.next()}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '45%',
                    transform: 'translate(50%, -50%)',
                    width: 44,
                    height: 44,
                    background: '#f3f4f6',
                    borderColor: '#e5e7eb',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                    color: '#111827',
                  }}
                />
              </>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 10,
                marginTop: 18,
              }}
            >
              {PRODUCT_SLIDES.map((_, idx) => {
                const isActive = idx === productSlideIndex;
                return (
                  <span
                    key={`product-dot-${idx}`}
                    onClick={() => productCarouselRef.current?.goTo(idx)}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: isActive ? '#f97316' : '#d1d5db',
                      boxShadow: isActive ? '0 0 0 4px rgba(249,115,22,0.15)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-block',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </section>



        <section style={{ marginTop: 34 }}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <Title level={2} style={{ color: '#0f172a', marginBottom: 6 }}>
              Tiện ích
            </Title>
            <Text style={{ color: '#6b7280' }}>Hệ thống tiện ích đẳng cấp</Text>
          </div>

          <Row gutter={[14, 14]}>
            {AMENITY_ITEMS.map((item) => (
              <Col xs={24} sm={12} lg={6} key={item.title}>
                <Card
                  bodyStyle={{ padding: 8 }}
                  style={{
                    borderRadius: 10,
                    border: '2px solid #a21c1c',
                    background: '#9f1111',
                  }}
                  cover={<Image src={item.image} alt={item.title} preview={false} style={{ height: 140, objectFit: 'cover' }} />}
                >
                  <Text style={{ color: '#fff', fontWeight: 700, textAlign: 'center', display: 'block' }}>{item.title}</Text>
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ textAlign: 'center', marginTop: 12, color: '#6b7280', fontWeight: 600 }}>15 / 20</div>
        </section>

        <ProjectMediaPanel
          title="Thiên hạ đệ nhất hùng quan - Vinhomes Hải Vân Bay"
          subtitle="Vị trí Vinhomes Hải Vân Bay được xem là viên ngọc quý hiếm còn sót lại trên bán đảo bất động sản nghỉ dưỡng ven biển miền Trung."
          image={AMENITY_VIDEO_THUMB}
        />

        <section style={{ marginTop: 34 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <Title level={2} style={{ color: '#0f172a', marginBottom: 4 }}>
              Liên hệ tư vấn
            </Title>
            <Text style={{ color: '#6b7280' }}>Đội ngũ chuyên viên sẵn sàng hỗ trợ bạn 24 / 7</Text>
          </div>

          <Row gutter={[18, 18]} justify="center">
            {ADVISORS.map((advisor) => (
              <Col xs={24} sm={12} md={10} lg={8} key={advisor.phone}>
                <Card style={{ borderRadius: 12, textAlign: 'center' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      margin: '0 auto 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(160deg, #a94c2d, #d48d4a)',
                      color: '#fff',
                    }}
                  >
                    <PhoneFilled />
                  </div>
                  <Text style={{ color: '#cc7a29', fontWeight: 700 }}>{advisor.name}</Text>
                  <div style={{ marginTop: 8, marginBottom: 10, fontSize: 30, color: '#8b1111', fontWeight: 700 }}>
                    {advisor.phone}
                  </div>
                  <Button
                    type="primary"
                    shape="round"
                    icon={<EnvironmentOutlined />}
                    href={`tel:${advisor.phone}`}
                    style={{
                      background: '#e2a35e',
                      borderColor: '#e2a35e',
                      fontWeight: 700,
                    }}
                  >
                    Liên hệ ngay
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      </main>
    </div>
  );
}
