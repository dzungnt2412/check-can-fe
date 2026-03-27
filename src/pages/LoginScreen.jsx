import { Alert, Button, Card, Form, Grid, Input, Space, Typography } from 'antd';
import { LockOutlined, LoginOutlined, QuestionCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import headerLogo from '../assets/images/logo.png';

const { Title, Text, Link } = Typography;
const BRAND_PRIMARY = '#062b43';
const BRAND_GRADIENT = 'radial-gradient(circle at 25% 75%, #031a2a 0%, #062b43 52%, #0b3d5d 100%)';

export default function LoginScreen() {
  const { login } = useAuth();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(values) {
    setLoading(true);
    setError('');

    try {
      await login(values.username, values.password);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? 12 : 24,
        background: '#f3f4f6',
      }}
    >
      <Card
        styles={{ body: { padding: 0 } }}
        style={{
          width: '100%',
          maxWidth: 1180,
          borderRadius: isMobile ? 14 : 22,
          overflow: 'hidden',
          boxShadow: '0 18px 40px rgba(15,23,42,0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: isMobile ? 0 : 468, flexDirection: isMobile ? 'column' : 'row' }}>
          <div
            style={{
              flex: isMobile ? '1 1 auto' : '0 1 50%',
              minHeight: isMobile ? 220 : 320,
              position: 'relative',
              marginRight: isMobile ? 0 : -14,
              zIndex: 2,
              background: BRAND_GRADIENT,
              color: '#ffffff',
              padding: isMobile ? '28px 20px' : '64px 72px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderTopRightRadius: isMobile ? 0 : '78px 44%',
              borderBottomRightRadius: isMobile ? '38px 24%' : '78px 44%',
            }}
          >
            <Space size={12} style={{ marginBottom: 18 }} align="center">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={headerLogo}
                  alt="Roman Property"
                  style={{ height: isMobile ? 28 : 90, width: 'auto', display: 'block' }}
                />
              </div>
            </Space>

            <Title level={2} style={{ color: '#e5e7eb', margin: 0, maxWidth: 470, lineHeight: 1.25, fontSize: isMobile ? 24 : 30 }}>
              Nền tảng công nghệ hỗ trợ kinh doanh BĐS hàng đầu Việt Nam
            </Title>
          </div>

          <div
            style={{
              flex: '1 1 50%',
              padding: isMobile ? '24px 16px 20px' : '84px 48px 84px 76px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div style={{ width: '100%', maxWidth: 520 }}>
              <Text style={{ display: 'block', textAlign: 'center', marginBottom: 16, fontSize: isMobile ? 20 : 22, fontWeight: 600 }}>
                Đăng nhập để tiếp tục
              </Text>

              {error ? <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} /> : null}

              <Form layout="vertical" onFinish={handleSubmit} autoComplete="off" requiredMark={false}>
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
                >
                  <Input
                    size="large"
                    prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                    placeholder="Tên đăng nhập"
                    style={{ height: 46, borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                  style={{ marginBottom: 12 }}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                    placeholder="Mật khẩu"
                    style={{ height: 46, borderRadius: 8 }}
                  />
                </Form.Item>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    marginBottom: 16,
                    fontSize: 14,
                    gap: 8,
                    flexWrap: isMobile ? 'nowrap' : 'wrap',
                  }}
                >
                  <Space size={6}>
                    <QuestionCircleOutlined style={{ color: BRAND_PRIMARY }} />
                    <Link href="#" style={{ color: BRAND_PRIMARY }}>Quên mật khẩu?</Link>
                  </Space>

                  <Space size={4}>
                    <Text type="secondary">Chưa có tài khoản?</Text>
                    <Link href="#" style={{ color: BRAND_PRIMARY, fontWeight: 600 }}>Đăng ký ngay!</Link>
                  </Space>
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  icon={<LoginOutlined />}
                  style={{ height: 42, borderRadius: 8, fontWeight: 600 }}
                >
                  Đăng nhập
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
