import { useMemo } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  UndoOutlined,
} from '@ant-design/icons';

import { useUnits } from '../hooks/useUnits';
import UnitFormCard from './units/UnitFormCard';
import UnitDetailCard from './units/UnitDetailCard';

export default function UnitsPage({ projects, agencies }) {
  const units = useUnits();

  const projectOptions = useMemo(
    () => projects.map((item) => ({ value: item.id, label: item.name })),
    [projects]
  );

  const agencyOptions = useMemo(
    () => agencies.map((item) => ({ value: item.id, label: item.name })),
    [agencies]
  );

  function updateFilter(key, value) {
    units.setFilters((prev) => ({ ...prev, [key]: value ?? '' }));
  }

  async function handleSubmitForm(payload) {
    if (units.view.mode === 'create') {
      await units.submitCreate(payload);
      return;
    }

    if (units.view.mode === 'edit' && units.view.unitId) {
      await units.submitUpdate(units.view.unitId, payload);
    }
  }

  const dynamicKeys = useMemo(() => {
    const keySet = new Set();
    units.units.forEach((item) => {
      Object.keys(item.dynamic_data || {}).forEach((key) => keySet.add(key));
    });
    return [...keySet];
  }, [units.units]);

  const dynamicFieldLabelMap = useMemo(() => {
    const map = new Map();
    (units.allSchemaFields || []).forEach((field) => {
      if (!field.field_key) return;
      if (!map.has(field.field_key)) {
        map.set(field.field_key, field.field_label || field.field_key);
      }
    });
    return map;
  }, [units.allSchemaFields]);

  const dynamicFieldSortOrderMap = useMemo(() => {
    const map = new Map();
    (units.allSchemaFields || []).forEach((field) => {
      if (!field.field_key) return;
      if (!map.has(field.field_key)) {
        map.set(field.field_key, Number(field.sort_order ?? 9999));
      }
    });
    return map;
  }, [units.allSchemaFields]);

  const orderedDynamicKeys = useMemo(() => {
    return [...dynamicKeys].sort((a, b) => {
      const orderA = dynamicFieldSortOrderMap.get(a) ?? 9999;
      const orderB = dynamicFieldSortOrderMap.get(b) ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b);
    });
  }, [dynamicKeys, dynamicFieldSortOrderMap]);

  const columns = useMemo(() => {
    const dynamicColumns = orderedDynamicKeys.map((dynamicKey) => ({
      title: dynamicFieldLabelMap.get(dynamicKey) || dynamicKey,
      key: `dynamic_${dynamicKey}`,
      width: 180,
      render: (_, row) => {
        const value = row.dynamic_data?.[dynamicKey];
        if (value === undefined || value === null || value === '') return '-';
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
      },
    }));

    return [
      {
        title: 'STT',
        key: 'stt',
        width: 80,
        align: 'center',
        render: (_, __, index) => ((units.pagination.page - 1) * units.pagination.limit) + index + 1,
      },
      ...dynamicColumns,
      {
        title: 'Hành động',
        key: 'actions',
        width: 230,
        fixed: 'right',
        render: (_, row) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => units.openDetail(row.id)}>
              Chi tiết
            </Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => units.openEdit(row.id)}>
              Sửa
            </Button>
            <Popconfirm
              title={`Xóa unit ${row.unit_code}?`}
              onConfirm={() => units.removeUnit(row.id)}
              okButtonProps={{ loading: units.loadingDelete }}
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  }, [dynamicFieldLabelMap, orderedDynamicKeys, units]);

  if (units.view.mode === 'detail') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Space>
          <Button onClick={units.backToList}>Quay lại danh sách</Button>
          {units.detail?.id ? (
            <Button type="primary" icon={<EditOutlined />} onClick={() => units.openEdit(units.detail.id)}>
              Cập nhật
            </Button>
          ) : null}
        </Space>

        <UnitDetailCard
          detail={units.detail}
          schemaFields={units.schemaFields}
          loading={units.loadingDetail}
          error={units.detailError}
        />
      </div>
    );
  }

  if (units.view.mode === 'create' || units.view.mode === 'edit') {
    return (
      <UnitFormCard
        mode={units.view.mode}
        initialValues={units.view.mode === 'edit' ? units.detail : null}
        schemaFields={units.schemaFields}
        schemaOptions={units.schemaOptions}
        projectOptions={projectOptions}
        agencyOptions={agencyOptions}
        loadingSubmit={units.loadingSubmit}
        submitError={units.submitError}
        loadingSchemaFields={units.loadingSchemaFields}
        schemaError={units.schemaError}
        onSchemaChange={units.setSchemaFieldsBySchemaId}
        onCancel={units.backToList}
        onSubmit={handleSubmitForm}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="Quản lý Units"
        extra={(
          <Button type="primary" icon={<PlusOutlined />} onClick={units.openCreate}>
            Tạo unit
          </Button>
        )}
      >
        <Form layout="vertical">
          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item label="Mã căn">
                <Input
                  value={units.filters.unit_code}
                  onChange={(e) => updateFilter('unit_code', e.target.value)}
                  placeholder="Nhập mã căn"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Dự án">
                <Select
                  value={units.filters.project_id || undefined}
                  options={projectOptions}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => updateFilter('project_id', value)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Đại lý">
                <Select
                  value={units.filters.agency_id || undefined}
                  options={agencyOptions}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => updateFilter('agency_id', value)}
                />
              </Form.Item>
            </Col>

            {/* <Col xs={24} sm={8}>
              <Form.Item label="schema_id">
                <Select
                  value={units.filters.schema_id || undefined}
                  options={units.schemaOptions}
                  allowClear
                  showSearch
                  onChange={(value) => updateFilter('schema_id', value)}
                />
              </Form.Item>
            </Col> */}
          </Row>

          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={units.applyFilters}>
              Lọc
            </Button>
            <Button icon={<UndoOutlined />} onClick={units.resetFilters}>
              Reset
            </Button>
          </Space>
        </Form>
      </Card>

      {units.listError ? <Alert type="error" showIcon message={units.listError} /> : null}

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={units.units}
          loading={units.loadingList}
          scroll={{ x: 1700 }}
          locale={{
            emptyText: units.loadingList ? 'Đang tải...' : <Empty description="Không có unit" />,
          }}
          pagination={{
            current: units.pagination.page,
            pageSize: units.pagination.limit,
            total: units.pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `${total} bản ghi - ${units.pagination.totalPages} trang`,
            onChange: (page, pageSize) => units.fetchUnits(page, pageSize),
          }}
        />
      </Card>
    </div>
  );
}
