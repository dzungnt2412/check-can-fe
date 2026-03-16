import {
  Card,
  Table,
  Button,
  Space,
  Popconfirm,
  Tag,
  Typography,
  Tooltip,
} from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export default function SourceManager({
  sources,
  allProjects,
  agencies,
  loading,
  onDelete,
  onGoToConfig,
  onGoToDetail,
}) {

  const rows = sources.map((source) => {
    return {
      key: source.id,
      id: source.id,
      source_code: source.source_code || '-',
      source_name: source.source_name || '-',
      project: (
        <Space direction="vertical" size={0}>
          <span>{source.project_name || source.du_an || '-'}</span>
          {source.du_an && source.project_name !== source.du_an ? (
            <Text type="secondary" style={{ fontSize: 12 }}>du_an: {source.du_an}</Text>
          ) : null}
        </Space>
      ),
      agency: (
        <Space direction="vertical" size={0}>
          <span>{source.agency_name || source.dai_ly || '-'}</span>
          {source.dai_ly && source.agency_name !== source.dai_ly ? (
            <Text type="secondary" style={{ fontSize: 12 }}>dai_ly: {source.dai_ly}</Text>
          ) : null}
        </Space>
      ),
      sheet: (
        <Space direction="vertical" size={0}>
          <span>{source.sheet_name || '-'}</span>
          <Text type="secondary" style={{ fontSize: 12 }}>{source.spreadsheet_id || '-'}</Text>
        </Space>
      ),
      status: (
        <Tag color={source.is_active ? 'green' : 'default'}>
          {source.is_active ? 'Đang dùng' : 'Tắt'}
        </Tag>
      ),
      actions: (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button size="small" icon={<EyeOutlined />} onClick={() => onGoToDetail(source)} />
          </Tooltip>
          <Popconfirm title={`Xóa source "${source.source_name || source.source_code}"?`} onConfirm={() => onDelete(source.id)}>
            <Tooltip title="Xóa">
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    };
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, fixed: 'left' },
    { title: 'Mã source', dataIndex: 'source_code', key: 'source_code', width: 180 },
    { title: 'Tên source', dataIndex: 'source_name', key: 'source_name', width: 220 },
    { title: 'Dự án', dataIndex: 'project', key: 'project', width: 220 },
    { title: 'Đại lý', dataIndex: 'agency', key: 'agency', width: 220 },
    { title: 'Sheet', dataIndex: 'sheet', key: 'sheet', width: 240 },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 120 },
    { title: 'Hành động', dataIndex: 'actions', key: 'actions', width: 120, fixed: 'right' },
  ];

  return (
    <Card
      title="Source"
      extra={(
        <Button type="primary" icon={<PlusOutlined />} onClick={onGoToConfig}>
          Tạo source mới
        </Button>
      )}
    >
      <Table
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1460 }}
        locale={{ emptyText: 'Chưa có source nào.' }}
      />
    </Card>
  );
}