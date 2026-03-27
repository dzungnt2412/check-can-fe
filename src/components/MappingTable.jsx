import {
  Table,
  Card,
  Select,
  Checkbox,
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

const REQUIRED_MAPPING_FIELD_KEYS = new Set(['ma_can', 'du_an']);

function createEmptyMapEntry(item = {}) {
  return {
    id: item.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    input: item.input || '',
    output: item.output || '',
  };
}

function createEmptyColorRule(item = {}) {
  return {
    id: item.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    bgColor: item.bgColor || '',
    textColor: item.textColor || '',
    matchBy: item.matchBy || 'both',
    value: item.value || '',
  };
}

function getRuleMatchBy(rule) {
  if (rule?.matchBy) return rule.matchBy;
  const hasBg = Boolean(String(rule?.bgColor || '').trim());
  const hasText = Boolean(String(rule?.textColor || '').trim());
  if (hasBg && hasText) return 'both';
  if (hasBg) return 'bg';
  if (hasText) return 'text';
  return 'both';
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
          <Space size={6} align="center" wrap>
            <Text strong>{name || record.schema_field_id}</Text>
            {REQUIRED_MAPPING_FIELD_KEYS.has(String(record.schema_field_key || '').trim().toLowerCase()) ? (
              <Tag color="red">Bắt buộc</Tag>
            ) : null}
          </Space>
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
      width: 760,
      render: (_, record, index) => {
        const entries = Array.isArray(record.value_map_entries) ? record.value_map_entries : [];
        const fallbackOutput = record.value_map_fallback || '';
        const colorRules = Array.isArray(record.source_color_value_map)
          ? record.source_color_value_map
          : [];
        const mapMode =
          record.map_mode ||
          (colorRules.length ? 'color' : (record.value_map_enabled ? 'data' : 'none'));

        return (
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            <Space align="center" wrap>
              <Switch
                checked={!!record.fill_down_enabled}
                onChange={(checked) => onChange(index, 'fill_down_enabled', checked)}
                disabled={disabled}
              />
              <Text>Fill down</Text>

              <Text>Kiểu map</Text>
              <Select
                value={mapMode}
                onChange={(mode) => {
                  const nextMode = mode || 'none';
                  onChange(index, 'map_mode', nextMode);

                  if (nextMode === 'data') {
                    onChange(index, 'value_map_enabled', true);
                    if (!entries.length) {
                      onChange(index, 'value_map_entries', [createEmptyMapEntry()]);
                    }
                  } else {
                    onChange(index, 'value_map_enabled', false);
                  }

                  if (nextMode === 'color' && !colorRules.length) {
                    onChange(index, 'source_color_value_map', [createEmptyColorRule()]);
                  }
                }}
                style={{ width: 170 }}
                disabled={disabled}
                options={[
                  { value: 'none', label: 'Không map' },
                  { value: 'data', label: 'Map theo data' },
                  { value: 'color', label: 'Map theo màu' },
                ]}
              />

              <Tooltip title="Backend sẽ map không phân biệt hoa thường, có trim">
                <Text type="secondary">(i)</Text>
              </Tooltip>
            </Space>

            {mapMode === 'color' ? (
              <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: 10 }}>
              <Space wrap style={{ marginBottom: 8 }}>
                <Text strong>Map theo màu</Text>
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => onChange(index, 'source_color_value_map', [...colorRules, createEmptyColorRule()])}
                  disabled={disabled}
                >
                  Add rule
                </Button>
                <Tooltip title="Có thể chỉ nhập BG hoặc Text color, miễn có value.">
                  <Text type="secondary">(i)</Text>
                </Tooltip>
              </Space>

              {colorRules.map((rule, ruleIndex) => {
                const ruleMatchBy = getRuleMatchBy(rule);
                const useBg = ruleMatchBy === 'bg' || ruleMatchBy === 'both';
                const useText = ruleMatchBy === 'text' || ruleMatchBy === 'both';

                return (
                  <div
                    key={rule.id || `${ruleIndex}`}
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                      <Space wrap align="start" style={{ width: '100%' }}>
                        <Space direction="vertical" size={6}>
                          <Space align="center">
                            <Checkbox
                              checked={useBg}
                              onChange={(event) => {
                                const nextUseBg = event.target.checked;
                                const nextUseText = useText;
                                const nextRules = [...colorRules];
                                const nextRule = {
                                  ...rule,
                                  matchBy:
                                    nextUseBg && nextUseText
                                      ? 'both'
                                      : (nextUseBg ? 'bg' : (nextUseText ? 'text' : '')),
                                };

                                if (!nextUseBg) {
                                  nextRule.bgColor = '';
                                }

                                nextRules[ruleIndex] = nextRule;
                                onChange(index, 'source_color_value_map', nextRules);
                              }}
                              style={{ width: 70 }}
                              disabled={disabled}
                            >
                              BG
                            </Checkbox>
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                border: '1px solid #d9d9d9',
                                backgroundColor: rule.bgColor || '#fff',
                              }}
                            />
                            <Input
                              value={rule.bgColor || ''}
                              onChange={(event) => {
                                const nextRules = [...colorRules];
                                nextRules[ruleIndex] = {
                                  ...rule,
                                  bgColor: event.target.value,
                                };
                                onChange(index, 'source_color_value_map', nextRules);
                              }}
                              placeholder="BG #FFF200"
                              style={{ width: 140 }}
                              disabled={disabled || !useBg}
                            />
                          </Space>

                          <Space align="center">
                            <Checkbox
                              checked={useText}
                              onChange={(event) => {
                                const nextUseBg = useBg;
                                const nextUseText = event.target.checked;
                                const nextRules = [...colorRules];
                                const nextRule = {
                                  ...rule,
                                  matchBy:
                                    nextUseBg && nextUseText
                                      ? 'both'
                                      : (nextUseBg ? 'bg' : (nextUseText ? 'text' : '')),
                                };

                                if (!nextUseText) {
                                  nextRule.textColor = '';
                                }

                                nextRules[ruleIndex] = nextRule;
                                onChange(index, 'source_color_value_map', nextRules);
                              }}
                              style={{ width: 70 }}
                              disabled={disabled}
                            >
                              Text
                            </Checkbox>
                            <div
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                border: '1px solid #d9d9d9',
                                backgroundColor: rule.textColor || '#fff',
                              }}
                            />
                            <Input
                              value={rule.textColor || ''}
                              onChange={(event) => {
                                const nextRules = [...colorRules];
                                nextRules[ruleIndex] = {
                                  ...rule,
                                  textColor: event.target.value,
                                };
                                onChange(index, 'source_color_value_map', nextRules);
                              }}
                              placeholder="Text #000000"
                              style={{ width: 140 }}
                              disabled={disabled || !useText}
                            />
                          </Space>
                        </Space>

                        <AutoComplete
                          value={rule.value || ''}
                          onChange={(value) => {
                            const nextRules = [...colorRules];
                            nextRules[ruleIndex] = {
                              ...rule,
                              value,
                            };
                            onChange(index, 'source_color_value_map', nextRules);
                          }}
                          placeholder="Giá trị lưu"
                          options={outputSuggestions}
                          style={{ width: 180 }}
                          disabled={disabled}
                        />

                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            const nextRules = colorRules.filter((_, idx) => idx !== ruleIndex);
                            onChange(index, 'source_color_value_map', nextRules);
                          }}
                          disabled={disabled}
                        />
                      </Space>
                    </Space>
                  </div>
                );
              })}

              {!colorRules.length ? (
                <Text type="secondary">Chưa có rule màu.</Text>
              ) : null}
              </div>
            ) : null}

            {mapMode === 'data' && record.value_map_enabled ? (
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

            {mapMode === 'none' ? (
              <Text type="secondary">Chọn kiểu map để cấu hình rule.</Text>
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

      <div style={{ marginTop: 12, marginBottom: 12 }}>
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
