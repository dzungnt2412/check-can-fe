import { Alert, Card, Descriptions, Typography } from 'antd';

const { Text } = Typography;

function renderDynamicValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('vi-VN');
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed).toLocaleString('vi-VN');
    }
  }
  return String(value);
}

export default function UnitDetailCard({ detail, schemaFields, loading, error }) {
  if (error) {
    return <Alert type="error" showIcon message={error} />;
  }

  if (!detail && !loading) {
    return <Alert type="info" showIcon message="Không có dữ liệu unit" />;
  }

  return (
    <Card title="Chi tiết Unit" loading={loading}>
      {detail ? (
        <>
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label="unit_code">{detail.unit_code || '-'}</Descriptions.Item>
            <Descriptions.Item label="agency_id">{detail.agency_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="schema_id">{detail.schema_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="agency_name">{detail.agency_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="project_names">{(detail.project_names || []).join(', ') || '-'}</Descriptions.Item>
            <Descriptions.Item label="project_ids">{(detail.project_ids || []).join(', ') || '-'}</Descriptions.Item>
            <Descriptions.Item label="created_at">{detail.created_at || '-'}</Descriptions.Item>
            <Descriptions.Item label="updated_at">{detail.updated_at || '-'}</Descriptions.Item>
          </Descriptions>

          <Card
            type="inner"
            title="Thông tin chi tiết"
            style={{ marginTop: 16 }}
            extra={<Text type="secondary">{schemaFields.length} schema fields</Text>}
          >
            {schemaFields.length ? (
              <Descriptions bordered size="small" column={1}>
                {schemaFields.map((field) => {
                  const value = detail.dynamic_data?.[field.field_key];
                  const title = `${field.field_label || field.field_key}`;
                  return (
                    <Descriptions.Item key={field.id || field.field_key} label={title}>
                      {renderDynamicValue(value)}
                      {/* {field.required ? <Tag color="red" style={{ marginLeft: 8 }}>required</Tag> : null} */}
                    </Descriptions.Item>
                  );
                })}
              </Descriptions>
            ) : (
              <Text type="secondary">Không có schema field động.</Text>
            )}
          </Card>
        </>
      ) : null}
    </Card>
  );
}
