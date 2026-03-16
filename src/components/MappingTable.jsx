import {
  Table,
  Card,
  Select,
  AutoComplete,
  InputNumber,
  Input,
  Switch,
  Empty,
  Spin,
  Tag,
  Typography,
  Space,
  Button,
  Tooltip,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

const TRANSFORM_OPTIONS = [
  'trim', 'uppercase', 'lowercase', 'parseViNumber', 'extractNumber', 'extractInteger',
];

const TRANSFORM_LABELS = {
  trim: 'trim',
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  parseViNumber: 'parseViNumber',
  extractNumber: 'extractNumber',
  extractInteger: 'extractInteger',
};

function createEmptyMapEntry(item = {}) {
  return {
    id: item.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    input: item.input || '',
    output: item.output || '',
  };
}

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
  outputSuggestions = [],
  disabled = false,
}) {
  const columns = [
    {
      title: 'Schema Field',
      dataIndex: 'schema_field_name',
      key: 'field',
      width: 260,
      fixed: 'left',
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
      width: 220,
      render: (_, record, index) => (
        <Select
          value={record.source_column_name || undefined}
          onChange={(val) => onChange(index, 'source_column_name', val ?? '')}
          placeholder="-- chọn header --"
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="label"
          allowClear
          disabled={disabled}
          options={headers.map((h) => ({ value: h, label: h }))}
        />
      ),
    },
    {
      title: 'source_column_index',
      key: 'source_column_index',
      width: 140,
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
      width: 180,
      render: (_, record, index) => (
        <Select
          value={record.transform_rule || undefined}
          onChange={(val) => onChange(index, 'transform_rule', val ?? '')}
          placeholder="-- none --"
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="label"
          allowClear
          disabled={disabled || record.value_map_enabled}
          options={TRANSFORM_OPTIONS.map((o) => ({ value: o, label: TRANSFORM_LABELS[o] || o }))}
        />
      ),
    },
    {
      title: 'default_value',
      key: 'default_value',
      width: 220,
      render: (_, record, index) => (
        <AutoComplete
          value={record.default_value || ''}
          onChange={(value) => onChange(index, 'default_value', value)}
          placeholder="Default"
          options={outputSuggestions}
          filterOption={(inputValue, option) => String(option?.value || '')
            .toLowerCase()
            .includes(String(inputValue || '').toLowerCase())}
          disabled={disabled || record.value_map_enabled}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Value Mapping',
      key: 'value_mapping',
      width: 520,
      render: (_, record, index) => {
        const entries = Array.isArray(record.value_map_entries) ? record.value_map_entries : [];
        const fallbackOutput = record.value_map_fallback || '';

        return (
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            <Space align="center" wrap>
              <Switch
                checked={!!record.fill_down_enabled}
                onChange={(checked) => onChange(index, 'fill_down_enabled', checked)}
                disabled={disabled}
              />
              <Text>Fill down</Text>

              <Switch
                checked={!!record.value_map_enabled}
                onChange={(checked) => {
                  onChange(index, 'value_map_enabled', checked);
                  if (checked && !entries.length) {
                    onChange(index, 'value_map_entries', [createEmptyMapEntry()]);
                  }
                }}
                disabled={disabled}
              />
              <Text>Bật map giá trị</Text>
              <Tooltip title="Backend sẽ map không phân biệt hoa thường, có trim">
                <Text type="secondary">(i)</Text>
              </Tooltip>
            </Space>

            {record.value_map_enabled ? (
              <>
                <Space wrap>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => onChange(index, 'value_map_entries', [...entries, createEmptyMapEntry()])}
                    disabled={disabled}
                  >
                    Thêm dòng
                  </Button>
                </Space>

                {entries.map((entry, entryIndex) => (
                  <Space key={entry.id || `${entryIndex}`} style={{ width: '100%' }} align="start">
                    <Input
                      value={entry.input || ''}
                      onChange={(event) => {
                        const nextEntries = [...entries];
                        nextEntries[entryIndex] = {
                          ...entry,
                          input: event.target.value,
                        };
                        onChange(index, 'value_map_entries', nextEntries);
                      }}
                      placeholder="Input (giá trị nguồn, vd: LK)"
                      disabled={disabled}
                    />

                    <AutoComplete
                      value={entry.output || ''}
                      onChange={(value) => {
                        const nextEntries = [...entries];
                        nextEntries[entryIndex] = {
                          ...entry,
                          output: value,
                        };
                        onChange(index, 'value_map_entries', nextEntries);
                      }}
                      placeholder="Output"
                      options={outputSuggestions}
                      filterOption={(inputValue, option) => String(option?.value || '')
                        .toLowerCase()
                        .includes(String(inputValue || '').toLowerCase())}
                      disabled={disabled}
                      style={{ width: 220 }}
                    />

                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        const nextEntries = entries.filter((_, idx) => idx !== entryIndex);
                        onChange(index, 'value_map_entries', nextEntries);
                      }}
                      disabled={disabled}
                    />
                  </Space>
                ))}

                <Input
                  value={fallbackOutput}
                  onChange={(event) => onChange(index, 'value_map_fallback', event.target.value)}
                  placeholder="Fallback output (*) - optional, vd: Khác"
                  disabled={disabled}
                />
              </>
            ) : null}
          </Space>
        );
      },
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
          showSearch
          optionFilterProp="label"
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
          scroll={{ x: 'max-content' }}
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
}
