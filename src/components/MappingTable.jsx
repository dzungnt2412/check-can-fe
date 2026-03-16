import { Table, Card, Select, InputNumber, Input, Switch, Empty, Spin, Tag, Typography } from 'antd';

const { Text } = Typography;

const TRANSFORM_OPTIONS = [
  'trim', 'uppercase', 'lowercase', 'parseViNumber', 'extractNumber', 'extractInteger',
];

export default function MappingTable({
  headers,
  schemas,
  selectedSchemaId,
  schemaFields,
  mappings,
  mappingLimitText,
  loadingSchemas,
  loadingSchema,
  errorSchema,
  onSelectSchema,
  onChange,
  disabled = false,
}) {
  const columns = [
    {
      title: 'Schema Field',
      dataIndex: 'schema_field_name',
      key: 'field',
      render: (name, record) => (
        <>
          <Text strong>{name || record.schema_field_id}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>schema_field_id: {record.schema_field_id}</Text>
        </>
      ),
    },
    {
      title: 'source_column_name',
      key: 'source_column_name',
      width: 180,
      render: (_, record, index) => (
        <Select
          value={record.source_column_name || undefined}
          onChange={(val) => onChange(index, 'source_column_name', val ?? '')}
          placeholder="-- chọn header --"
          style={{ width: '100%' }}
          allowClear
          disabled={disabled}
          options={headers.map((h) => ({ value: h, label: h }))}
        />
      ),
    },
    {
      title: 'source_column_index',
      key: 'source_column_index',
      width: 130,
      render: (_, record, index) => (
        <InputNumber
          value={record.source_column_index}
          onChange={(val) => onChange(index, 'source_column_index', val ?? 0)}
          min={0}
          style={{ width: '100%' }}
          placeholder="0-based"
          disabled={disabled}
        />
      ),
    },
    {
      title: 'transform_rule',
      key: 'transform_rule',
      width: 160,
      render: (_, record, index) => (
        <Select
          value={record.transform_rule || undefined}
          onChange={(val) => onChange(index, 'transform_rule', val ?? '')}
          placeholder="-- none --"
          style={{ width: '100%' }}
          allowClear
          disabled={disabled}
          options={TRANSFORM_OPTIONS.map((o) => ({ value: o, label: o }))}
        />
      ),
    },
    {
      title: 'default_value',
      key: 'default_value',
      width: 130,
      render: (_, record, index) => (
        <Input
          value={record.default_value || ''}
          onChange={(e) => onChange(index, 'default_value', e.target.value)}
          placeholder="default"
          disabled={disabled}
        />
      ),
    },
    {
      title: 'is_active',
      key: 'is_active',
      width: 90,
      render: (_, record, index) => (
        <Switch
          checked={!!record.is_active}
          onChange={(checked) => onChange(index, 'is_active', checked)}
          disabled={disabled}
        />
      ),
    },
  ];

  const cardExtra = (
    <Tag color="default">Mapping limit: {mappingLimitText}</Tag>
  );

  return (
    <Card title="4) Mapping Table" extra={cardExtra}>
      <Text type="secondary">Mỗi schema field map với cột nguồn tương ứng.</Text>

      <div style={{ marginTop: 12 }}>
        <Select
          value={selectedSchemaId || undefined}
          onChange={(value) => onSelectSchema(value ?? '')}
          placeholder="Chọn schema để map"
          style={{ width: '100%', maxWidth: 420 }}
          loading={loadingSchemas}
          disabled={disabled}
          options={schemas.map((schema) => ({
            value: String(schema.id),
            label: `${schema.schema_name}${schema.schema_key ? ` (${schema.schema_key})` : ''}`,
          }))}
        />
      </div>

      {loadingSchema ? (
        <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
      ) : errorSchema ? (
        <Text type="danger" style={{ display: 'block', marginTop: 12 }}>{errorSchema}</Text>
      ) : !selectedSchemaId ? (
        <Empty description="Chọn schema để hiển thị mapping fields." style={{ marginTop: 16 }} />
      ) : !schemaFields.length ? (
        <Empty description="Chưa có schema fields." style={{ marginTop: 16 }} />
      ) : (
        <Table
          columns={columns}
          dataSource={mappings.map((m) => ({ ...m, key: m.schema_field_id }))}
          pagination={false}
          size="small"
          scroll={{ x: 900 }}
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
}
