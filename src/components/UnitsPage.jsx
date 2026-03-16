import { useMemo } from 'react';
import {
  Alert,
  AutoComplete,
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
  Tooltip,
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

export default function UnitsPage({ agencies, allProjects = [], investors = [] }) {
  const units = useUnits();

  const agencyOptions = useMemo(
    () => agencies.map((item) => ({ value: item.id, label: item.name })),
    [agencies]
  );

  function updateFilter(key, value) {
    units.updateFilter(key, value);
  }

  function addCatalogFilter() {
    units.addCatalogFilter();
  }

  function updateCatalogFilter(rowId, patch) {
    units.updateCatalogFilter(rowId, patch);
  }

  function removeCatalogFilter(rowId) {
    units.removeCatalogFilter(rowId);
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

  const catalogValueSuggestions = useMemo(() => {
    const names = [
      ...allProjects.map((item) => item?.name),
      ...investors.map((item) => item?.name),
      ...agencies.map((item) => item?.name),
    ]
      .map((name) => String(name || '').trim())
      .filter(Boolean);

    return Array.from(new Set(names)).map((value) => ({ value }));
  }, [allProjects, investors, agencies]);

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
        width: 120,
        align: 'center',
        fixed: 'right',
        render: (_, row) => (
          <Space size={4}>
            <Tooltip title="Chi tiết">
              <Button size="small" icon={<EyeOutlined />} onClick={() => units.openDetail(row.id)} />
            </Tooltip>
            <Tooltip title="Sửa">
              <Button size="small" icon={<EditOutlined />} onClick={() => units.openEdit(row.id)} />
            </Tooltip>
            <Popconfirm
              title={`Xóa unit ${row.unit_code}?`}
              onConfirm={() => units.removeUnit(row.id)}
              okButtonProps={{ loading: units.loadingDelete }}
            >
              <Tooltip title="Xóa">
                <Button danger size="small" icon={<DeleteOutlined />} />
              </Tooltip>
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

            <Col xs={24} sm={8}>
              <Form.Item label="schema_id">
                <Select
                  value={units.filters.schema_id || undefined}
                  options={units.schemaOptions}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => updateFilter('schema_id', value)}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Lọc theo catalog fields" style={{ marginBottom: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  {(units.filters.catalog_filters || []).map((item) => (
                    <Row gutter={8} key={item.row_id}>
                      <Col xs={24} md={11}>
                        <Select
                          value={item.catalog_field_key || undefined}
                          placeholder="Chọn field catalog"
                          options={units.catalogFieldOptions}
                          loading={units.loadingCatalogFields}
                          allowClear
                          showSearch
                          optionFilterProp="label"
                          onChange={(value) => {
                            updateCatalogFilter(item.row_id, {
                              catalog_field_key: value || '',
                            });
                          }}
                        />
                      </Col>
                      <Col xs={24} md={11}>
                        <AutoComplete
                          value={item.value}
                          options={catalogValueSuggestions}
                          filterOption={(inputValue, option) => String(option?.value || '')
                            .toLowerCase()
                            .includes(String(inputValue || '').toLowerCase())}
                          placeholder="Nhập giá trị tìm kiếm"
                          onChange={(value) => updateCatalogFilter(item.row_id, { value })}
                          style={{ width: '100%' }}
                        />
                      </Col>
                      <Col xs={24} md={2}>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeCatalogFilter(item.row_id)}
                        >
                          Xóa
                        </Button>
                      </Col>
                    </Row>
                  ))}

                  <Button icon={<PlusOutlined />} onClick={addCatalogFilter}>
                    Thêm điều kiện
                  </Button>
                </Space>
              </Form.Item>
            </Col>
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
      {units.catalogFieldError ? <Alert type="error" showIcon message={units.catalogFieldError} /> : null}

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
