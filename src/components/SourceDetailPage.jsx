import {
  Tag, Space, Typography,
} from 'antd';

const { Title, Text } = Typography;

export default function SourceDetailPage({
  source,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Space align="center" wrap>
        <Title level={5} style={{ margin: 0 }}>
          {source.source_name || source.source_code}
        </Title>
        <Tag color={source.is_active ? 'green' : 'default'}>
          {source.is_active ? 'Đang dùng' : 'Tắt'}
        </Tag>
      </Space>
      <Text type="secondary">source_code: {source.source_code || '-'}</Text>
    </div>
  );
}
