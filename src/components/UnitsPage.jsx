import { useMemo, useState } from 'react';
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tabs,
  Tooltip,
} from 'antd';
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  UpOutlined,
  UndoOutlined,
} from '@ant-design/icons';

import { useUnits } from '../hooks/useUnits';
import UnitFormCard from './units/UnitFormCard';
import UnitDetailCard from './units/UnitDetailCard';
import { useAuth } from '../contexts/AuthContext';

function renderCellValue(value) {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return value.toLocaleString('vi-VN');
  return String(value);
}

export default function UnitsPage({ agencies = [], allProjects = [], investors = [] }) {
  const { role } = useAuth();
  const isSuperAdmin = role === 'super_admin';
  const units = useUnits();
  const [activeTab, setActiveTab] = useState('list');

  const agencyOptions = useMemo(
    () => agencies.map((item) => ({ value: item.id, label: item.name })),
    [agencies]
  );

  const projectOptions = useMemo(
    () => allProjects.map((item) => ({ value: item.id, label: item.name })),
    [allProjects]
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

  const displayKeyList = useMemo(() => {
    if (units.visibleDisplayCatalogs.length > 0) {
      return units.visibleDisplayCatalogs.map((item) => item.catalog_field_key);
    }

    const keySet = new Set();
    units.visibleUnits.forEach((item) => {
      Object.keys(item.dynamic_data || {}).forEach((key) => keySet.add(key));
    });
    return [...keySet];
  }, [units.visibleDisplayCatalogs, units.visibleUnits]);

  const displayStyleMap = useMemo(() => {
    const map = new Map();
    units.visibleDisplayCatalogs.forEach((item) => {
      map.set(item.catalog_field_key, {
        bg_color: item.bg_color || '',
        text_color: item.text_color || '',
        label: item.field_label || item.catalog_field_key,
      });
    });
    return map;
  }, [units.visibleDisplayCatalogs]);

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

  const sortDirectionOptions = [
    { value: 'asc', label: 'Tăng dần (asc)' },
    { value: 'desc', label: 'Giảm dần (desc)' },
  ];

  const filterTypeOptions = [
    { value: 'input', label: 'input' },
    { value: 'select', label: 'select' },
  ];

  const primarySortSelectOptions = useMemo(
    () => (units.resolvedPrimarySortFilters || []).map((item) => ({
      value: `${item.catalog_field_key}__${item.sort_direction}`,
      label: `${item.label || item.catalog_field_key} (${item.sort_direction})`,
      sort_field_key: item.catalog_field_key,
      sort_direction: item.sort_direction,
    })),
    [units.resolvedPrimarySortFilters]
  );


  const selectedSortValue = useMemo(() => {
    if (!units.selectedSort?.catalog_field_key || !units.selectedSort?.sort_direction) return undefined;
    return `${units.selectedSort.catalog_field_key}__${units.selectedSort.sort_direction}`;
  }, [units.selectedSort]);

  const appliedFilterTags = useMemo(() => {
    const tags = [];
    const maCan = String(units.filters.ma_can || '').trim();
    if (maCan) {
      tags.push(`Mã căn: ${maCan}`);
    }

    const projectId = String(units.filters.project_id || '').trim();
    if (projectId) {
      const project = allProjects.find((item) => String(item.id) === projectId);
      tags.push(`Dự án: ${project?.name || `ID ${projectId}`}`);
    }

    const agencyId = String(units.filters.agency_id || '').trim();
    if (agencyId) {
      const agency = agencies.find((item) => String(item.id) === agencyId);
      tags.push(`Đại lý: ${agency?.name || agencyId}`);
    }

    const schemaId = String(units.filters.schema_id || '').trim();
    if (schemaId) {
      const schema = (units.schemaOptions || []).find((item) => String(item.value) === schemaId);
      tags.push(`Schema: ${schema?.label || schemaId}`);
    }

    const dynamicConfigByKey = new Map((units.resolvedCatalogFilterConfigs || []).map((item) => [item.catalog_field_key, item]));
    (units.filters.catalog_filters || []).forEach((item) => {
      const fieldKey = String(item.catalog_field_key || '').trim();
      const value = String(item.value || '').trim();
      if (!fieldKey || !value) return;

      const config = dynamicConfigByKey.get(fieldKey);
      const displayLabel = config?.label || fieldKey;

      if (config?.filter_type === 'select' && config.select_options) {
        const selectedOption = config.select_options.find((opt) => opt.option_value === value);
        if (selectedOption) {
          tags.push(`${displayLabel}: ${selectedOption.option_label}`);
          return;
        }
      }

      tags.push(`${displayLabel}: ${value}`);
    });

    return tags;
  }, [units.filters, units.resolvedCatalogFilterConfigs, units.schemaOptions, agencies, allProjects]);

  const columns = useMemo(() => {
    const dynamicColumns = displayKeyList.map((dynamicKey) => ({
      title: displayStyleMap.get(dynamicKey)?.label || dynamicFieldLabelMap.get(dynamicKey) || dynamicKey,
      key: `dynamic_${dynamicKey}`,
      width: 180,
      render: (_, row) => {
        const value = row.dynamic_data?.[dynamicKey];
        const styleCfg = displayStyleMap.get(dynamicKey);

        return (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 6px',
              borderRadius: 6,
              background: styleCfg?.bg_color || 'transparent',
              color: styleCfg?.text_color || 'inherit',
            }}
          >
            {renderCellValue(value)}
          </span>
        );
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
      {
        title: 'Dự án',
        key: 'project_names',
        width: 220,
        render: (_, row) => {
          const names = Array.isArray(row.project_names) ? row.project_names : [];

          if (!names.length) return '-';

          return (
            <Space size={[4, 4]} wrap>
              {names.map((name) => (
                <Tag color="blue" key={`${row.id}_${name}`}>
                  {name}
                </Tag>
              ))}
            </Space>
          );
        },
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
  }, [displayKeyList, displayStyleMap, dynamicFieldLabelMap, units]);

  const configRoleOptions = [
    { value: 'super_admin', label: 'super_admin' },
    { value: 'admin', label: 'admin' },
    { value: 'sale', label: 'sale' },
  ];

  const operatorOptions = [
    { value: 'eq', label: 'eq' },
    { value: 'neq', label: 'neq' },
  ];

  const effectOptions = [
    { value: 'show', label: 'show' },
    { value: 'hide', label: 'hide' },
  ];

  function handleSortOptionChange(value) {
    if (!value) {
      units.setSortFilter(null);
      return;
    }

    const [sortFieldKey, sortDirection] = String(value).split('__');
    units.setSortFilter({
      catalog_field_key: sortFieldKey,
      sort_direction: sortDirection,
    });
  }

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

  function renderListTab() {
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
                    value={units.filters.ma_can}
                    onChange={(e) => updateFilter('ma_can', e.target.value)}
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
                    placeholder="Chọn dự án"
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

              <Col xs={24} sm={8}>
                <Form.Item label="Sắp xếp chính theo role">
                  <Select
                    value={selectedSortValue}
                    options={primarySortSelectOptions}
                    allowClear
                    placeholder="Chọn sort"
                    onChange={handleSortOptionChange}
                  />
                </Form.Item>
              </Col>

              {(units.resolvedCatalogFilterConfigs || []).map((config) => {
                const value = units.catalogFilterValueMap.get(config.catalog_field_key) || '';
                const isSelect = config.filter_type === 'select';
                const options = (config.select_options || []).map((option) => ({
                  value: option.option_value,
                  label: option.option_label || option.option_value,
                }));

                return (
                  <Col xs={24} sm={8} key={`dynamic_filter_${config.catalog_field_key}`}>
                    <Form.Item label={config.label || config.catalog_field_key}>
                      {isSelect ? (
                        <Select
                          value={value || undefined}
                          options={options}
                          allowClear
                          placeholder={config.placeholder || 'Chọn giá trị lọc'}
                          onChange={(nextValue) => units.upsertCatalogFilterByField(config.catalog_field_key, nextValue || '')}
                        />
                      ) : (
                        <Input
                          value={value}
                          placeholder={config.placeholder || 'Nhập giá trị lọc'}
                          onChange={(e) => units.upsertCatalogFilterByField(config.catalog_field_key, e.target.value)}
                        />
                      )}
                    </Form.Item>
                  </Col>
                );
              })}

              <Col span={24}>
                <Form.Item label="Lọc theo catalog fields (nâng cao/legacy)" style={{ marginBottom: 8 }}>
                  <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    {(units.filters.catalog_filters || []).map((item) => (
                      <Row gutter={8} key={item.row_id}>
                        <Col xs={24} md={11}>
                          <Select
                            value={item.catalog_field_key || undefined}
                            placeholder="Chọn field catalog"
                            options={units.filterCatalogFieldOptions}
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

        <Card size="small" title="Bộ lọc đang áp dụng" bodyStyle={{ paddingTop: 12 }}>
          <Space wrap>
            {units.effectiveActiveSort ? (
              <Tag color="blue">
                Sort: {units.effectiveActiveSort.label || units.effectiveActiveSort.catalog_field_key}
                {' '}
                ({units.effectiveActiveSort.sort_direction})
              </Tag>
            ) : null}
            {appliedFilterTags.length === 0 ? <Tag>Chưa có bộ lọc catalog</Tag> : null}
            {appliedFilterTags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            <Tag color="geekblue">visible_count: {units.visibleCountFromList}</Tag>
          </Space>
        </Card>

        {units.listError ? <Alert type="error" showIcon message={units.listError} /> : null}
        {units.catalogFieldError ? <Alert type="error" showIcon message={units.catalogFieldError} /> : null}

        <Card>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={units.visibleUnits}
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

  function renderDisplayConfigTab() {
    return (
      <Card title="Cấu hình catalog hiển thị theo role">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space wrap>
            <span>Role:</span>
            <Select
              value={units.configRole}
              options={configRoleOptions}
              onChange={(value) => units.setConfigRole(value)}
              style={{ width: 180 }}
            />
            <Button onClick={() => units.fetchDisplayConfigByRole(units.configRole)} loading={units.loadingDisplayConfig}>
              Tải cấu hình
            </Button>
          </Space>

          {units.displayConfigError ? <Alert type="error" showIcon message={units.displayConfigError} /> : null}
          {units.displayConfigSuccess ? <Alert type="success" showIcon message={units.displayConfigSuccess} /> : null}

          {(units.displayConfigItems || []).map((row, index, list) => (
            <Row key={row.row_id} gutter={8} align="middle">
              <Col xs={24} md={8}>
                <Select
                  value={row.catalog_field_key || undefined}
                  placeholder="Catalog field"
                  options={units.catalogFieldOptions}
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => units.updateDisplayConfigItem(row.row_id, { catalog_field_key: value || '' })}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={12} md={3}>
                <Switch
                  checked={row.is_visible !== false}
                  checkedChildren="Hiện"
                  unCheckedChildren="Ẩn"
                  onChange={(checked) => units.updateDisplayConfigItem(row.row_id, { is_visible: checked })}
                />
              </Col>
              <Col xs={12} md={3}>
                <Space>
                  <Button
                    icon={<UpOutlined />}
                    onClick={() => units.moveDisplayConfigItem(row.row_id, 'up')}
                    disabled={index === 0}
                  />
                  <Button
                    icon={<DownOutlined />}
                    onClick={() => units.moveDisplayConfigItem(row.row_id, 'down')}
                    disabled={index === list.length - 1}
                  />
                </Space>
              </Col>
              <Col xs={12} md={4}>
                <Input
                  value={row.bg_color}
                  placeholder="BG color (#FFF200)"
                  onChange={(e) => units.updateDisplayConfigItem(row.row_id, { bg_color: e.target.value })}
                />
              </Col>
              <Col xs={12} md={4}>
                <Input
                  value={row.text_color}
                  placeholder="Text color (#000000)"
                  onChange={(e) => units.updateDisplayConfigItem(row.row_id, { text_color: e.target.value })}
                />
              </Col>
              <Col xs={24} md={2}>
                <Button danger icon={<DeleteOutlined />} onClick={() => units.removeDisplayConfigItem(row.row_id)}>
                  Xóa
                </Button>
              </Col>
            </Row>
          ))}

          <Space>
            <Button icon={<PlusOutlined />} onClick={units.addDisplayConfigItem}>Thêm catalog</Button>
          </Space>

          <Divider style={{ margin: '8px 0' }} />

          <Card size="small" title="Bộ lọc chính (sort)">
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {(units.primarySortFilterItems || []).map((row, index, list) => (
                <Row key={row.row_id} gutter={8} align="middle">
                  <Col xs={24} md={7}>
                    <Select
                      value={row.catalog_field_key || undefined}
                      placeholder="Catalog field"
                      options={units.catalogFieldOptions}
                      showSearch
                      optionFilterProp="label"
                      onChange={(value) => units.updatePrimarySortFilterItem(row.row_id, { catalog_field_key: value || '' })}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col xs={12} md={4}>
                    <Select
                      value={row.sort_direction || 'asc'}
                      options={sortDirectionOptions}
                      onChange={(value) => units.updatePrimarySortFilterItem(row.row_id, { sort_direction: value })}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col xs={24} md={5}>
                    <Input
                      value={row.label}
                      placeholder="Label hiển thị"
                      onChange={(e) => units.updatePrimarySortFilterItem(row.row_id, { label: e.target.value })}
                    />
                  </Col>
                  <Col xs={12} md={3}>
                    <Input
                      value={row.sort_order}
                      placeholder="sort_order"
                      onChange={(e) => units.updatePrimarySortFilterItem(row.row_id, { sort_order: e.target.value })}
                    />
                  </Col>
                  <Col xs={12} md={2}>
                    <Switch
                      checked={row.is_active !== false}
                      checkedChildren="On"
                      unCheckedChildren="Off"
                      onChange={(checked) => units.updatePrimarySortFilterItem(row.row_id, { is_active: checked })}
                    />
                  </Col>
                  <Col xs={12} md={2}>
                    <Space>
                      <Button
                        icon={<UpOutlined />}
                        onClick={() => units.movePrimarySortFilterItem(row.row_id, 'up')}
                        disabled={index === 0}
                      />
                      <Button
                        icon={<DownOutlined />}
                        onClick={() => units.movePrimarySortFilterItem(row.row_id, 'down')}
                        disabled={index === list.length - 1}
                      />
                    </Space>
                  </Col>
                  <Col xs={12} md={1}>
                    <Button danger icon={<DeleteOutlined />} onClick={() => units.removePrimarySortFilterItem(row.row_id)} />
                  </Col>
                </Row>
              ))}

              <Button icon={<PlusOutlined />} onClick={units.addPrimarySortFilterItem}>Thêm sort filter</Button>
            </Space>
          </Card>

          <Card size="small" title="Bộ lọc catalog cho role">
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {(units.catalogFilterConfigItems || []).map((row, index, list) => (
                <Card key={row.row_id} size="small" type="inner" title={`Filter #${index + 1}`}>
                  <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    <Row gutter={8} align="middle">
                      <Col xs={24} md={7}>
                        <Select
                          value={row.catalog_field_key || undefined}
                          placeholder="Catalog field"
                          options={units.catalogFieldOptions}
                          showSearch
                          optionFilterProp="label"
                          onChange={(value) => units.updateCatalogFilterConfigItem(row.row_id, { catalog_field_key: value || '' })}
                          style={{ width: '100%' }}
                        />
                      </Col>
                      <Col xs={12} md={4}>
                        <Select
                          value={row.filter_type || 'input'}
                          options={filterTypeOptions}
                          onChange={(value) => units.updateCatalogFilterConfigItem(row.row_id, { filter_type: value })}
                          style={{ width: '100%' }}
                        />
                      </Col>
                      <Col xs={24} md={5}>
                        <Input
                          value={row.label}
                          placeholder="Label hiển thị"
                          onChange={(e) => units.updateCatalogFilterConfigItem(row.row_id, { label: e.target.value })}
                        />
                      </Col>
                      <Col xs={24} md={5}>
                        <Input
                          value={row.placeholder}
                          placeholder="Placeholder"
                          onChange={(e) => units.updateCatalogFilterConfigItem(row.row_id, { placeholder: e.target.value })}
                        />
                      </Col>
                      <Col xs={12} md={2}>
                        <Input
                          value={row.sort_order}
                          placeholder="sort_order"
                          onChange={(e) => units.updateCatalogFilterConfigItem(row.row_id, { sort_order: e.target.value })}
                        />
                      </Col>
                      <Col xs={12} md={1}>
                        <Switch
                          checked={row.is_active !== false}
                          checkedChildren="On"
                          unCheckedChildren="Off"
                          onChange={(checked) => units.updateCatalogFilterConfigItem(row.row_id, { is_active: checked })}
                        />
                      </Col>
                    </Row>

                    <Space>
                      <Button
                        icon={<UpOutlined />}
                        onClick={() => units.moveCatalogFilterConfigItem(row.row_id, 'up')}
                        disabled={index === 0}
                      />
                      <Button
                        icon={<DownOutlined />}
                        onClick={() => units.moveCatalogFilterConfigItem(row.row_id, 'down')}
                        disabled={index === list.length - 1}
                      />
                      <Button danger icon={<DeleteOutlined />} onClick={() => units.removeCatalogFilterConfigItem(row.row_id)}>
                        Xóa filter
                      </Button>
                    </Space>

                    {row.filter_type === 'select' ? (
                      <Card size="small" type="inner" title="Select options">
                        <Space direction="vertical" style={{ width: '100%' }} size={8}>
                          {(row.select_options || []).map((option) => (
                            <Row gutter={8} key={option.row_id}>
                              <Col xs={24} md={7}>
                                <Input
                                  value={option.option_label}
                                  placeholder="option_label"
                                  onChange={(e) => units.updateCatalogFilterSelectOption(row.row_id, option.row_id, { option_label: e.target.value })}
                                />
                              </Col>
                              <Col xs={24} md={6}>
                                <Input
                                  value={option.option_value}
                                  placeholder="option_value"
                                  onChange={(e) => units.updateCatalogFilterSelectOption(row.row_id, option.row_id, { option_value: e.target.value })}
                                />
                              </Col>
                              <Col xs={12} md={4}>
                                <Input
                                  type="number"
                                  value={option.range_min === null ? '' : option.range_min}
                                  placeholder="range_min (trống được)"
                                  onChange={(e) => units.updateCatalogFilterSelectOption(row.row_id, option.row_id, { range_min: e.target.value === '' ? null : Number(e.target.value) })}
                                />
                              </Col>
                              <Col xs={12} md={4}>
                                <Input
                                  type="number"
                                  value={option.range_max === null ? '' : option.range_max}
                                  placeholder="range_max (trống được)"
                                  onChange={(e) => units.updateCatalogFilterSelectOption(row.row_id, option.row_id, { range_max: e.target.value === '' ? null : Number(e.target.value) })}
                                />
                              </Col>
                              <Col xs={12} md={2}>
                                <Input
                                  value={option.sort_order}
                                  placeholder="sort_order"
                                  onChange={(e) => units.updateCatalogFilterSelectOption(row.row_id, option.row_id, { sort_order: e.target.value })}
                                />
                              </Col>
                              <Col xs={12} md={1}>
                                <Button
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => units.removeCatalogFilterSelectOption(row.row_id, option.row_id)}
                                />
                              </Col>
                            </Row>
                          ))}

                          <Button icon={<PlusOutlined />} onClick={() => units.addCatalogFilterSelectOption(row.row_id)}>
                            Thêm option
                          </Button>
                        </Space>
                      </Card>
                    ) : null}
                  </Space>
                </Card>
              ))}

              <Button icon={<PlusOutlined />} onClick={units.addCatalogFilterConfigItem}>Thêm catalog filter config</Button>
            </Space>
          </Card>

          <Space>
            <Button type="primary" loading={units.savingDisplayConfig} onClick={units.saveDisplayConfigByRole}>
              Lưu cấu hình
            </Button>
          </Space>
        </Space>
      </Card>
    );
  }

  function renderVisibilityRulesTab() {
    return (
      <Card title="Cấu hình visibility rules theo role">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space wrap>
            <span>Role:</span>
            <Select
              value={units.configRole}
              options={configRoleOptions}
              onChange={(value) => units.setConfigRole(value)}
              style={{ width: 180 }}
            />
            <Button onClick={() => units.fetchDisplayConfigByRole(units.configRole)} loading={units.loadingDisplayConfig}>
              Tải cấu hình
            </Button>
          </Space>

          {(units.visibilityRuleItems || []).map((row, index, list) => (
            <Row key={row.row_id} gutter={8} align="middle">
              <Col xs={24} md={7}>
                <Select
                  value={row.catalog_field_key || undefined}
                  placeholder="Catalog field"
                  options={units.catalogFieldOptions}
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => units.updateVisibilityRuleItem(row.row_id, { catalog_field_key: value || '' })}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={12} md={3}>
                <Select
                  value={row.operator}
                  options={operatorOptions}
                  onChange={(value) => units.updateVisibilityRuleItem(row.row_id, { operator: value })}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} md={6}>
                <Input
                  value={row.compare_value}
                  placeholder="compare_value"
                  onChange={(e) => units.updateVisibilityRuleItem(row.row_id, { compare_value: e.target.value })}
                />
              </Col>
              <Col xs={12} md={3}>
                <Select
                  value={row.effect}
                  options={effectOptions}
                  onChange={(value) => units.updateVisibilityRuleItem(row.row_id, { effect: value })}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={12} md={3}>
                <Space>
                  <Button
                    icon={<UpOutlined />}
                    onClick={() => units.moveVisibilityRuleItem(row.row_id, 'up')}
                    disabled={index === 0}
                  />
                  <Button
                    icon={<DownOutlined />}
                    onClick={() => units.moveVisibilityRuleItem(row.row_id, 'down')}
                    disabled={index === list.length - 1}
                  />
                </Space>
              </Col>
              <Col xs={24} md={2}>
                <Button danger icon={<DeleteOutlined />} onClick={() => units.removeVisibilityRuleItem(row.row_id)}>
                  Xóa
                </Button>
              </Col>
            </Row>
          ))}

          <Space>
            <Button icon={<PlusOutlined />} onClick={units.addVisibilityRuleItem}>Thêm rule</Button>
            <Button type="primary" loading={units.savingDisplayConfig} onClick={units.saveDisplayConfigByRole}>
              Lưu rules
            </Button>
          </Space>
        </Space>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {isSuperAdmin ? (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'list', label: 'Danh sách Units', children: renderListTab() },
            { key: 'display-config', label: 'Cấu hình Catalog Theo Role', children: renderDisplayConfigTab() },
            { key: 'visibility-rules', label: 'Cấu hình Visibility Rules', children: renderVisibilityRulesTab() },
          ]}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {renderListTab()}
        </div>
      )}
    </div>
  );
}
