import { useMemo, useState } from 'react';
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useSchemaManagement } from '../hooks/useSchemaManagement';

const { Text } = Typography;

const DATA_TYPE_OPTIONS = [
  { value: 'string', label: 'string' },
  { value: 'number', label: 'number' },
  { value: 'integer', label: 'integer' },
  { value: 'boolean', label: 'boolean' },
  { value: 'date', label: 'date' },
];

const INPUT_TYPE_OPTIONS = [
  { value: 'text', label: 'text' },
  { value: 'textarea', label: 'textarea' },
  { value: 'number', label: 'number' },
  { value: 'select', label: 'select' },
  { value: 'radio', label: 'radio' },
  { value: 'checkbox-group', label: 'checkbox-group' },
  { value: 'switch', label: 'switch' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'active' },
  { value: 'inactive', label: 'inactive' },
];

const FIELD_KEY_RULE = /^[a-z0-9_-]+$/;

export default function SchemaManagementPage() {
  const { message } = AntdApp.useApp();
  const schema = useSchemaManagement();

  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [schemaModalMode, setSchemaModalMode] = useState('create');
  const [editingSchema, setEditingSchema] = useState(null);
  const [schemaForm] = Form.useForm();

  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogModalMode, setCatalogModalMode] = useState('create');
  const [editingCatalog, setEditingCatalog] = useState(null);
  const [catalogForm] = Form.useForm();

  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [attachForm] = Form.useForm();

  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [editingSchemaField, setEditingSchemaField] = useState(null);
  const [overrideForm] = Form.useForm();

  const schemaRows = useMemo(
    () => schema.schemas.map((item) => ({ ...item, key: item.id })),
    [schema.schemas]
  );

  const catalogRows = useMemo(
    () => schema.filteredCatalogs.map((item) => ({ ...item, key: item.id })),
    [schema.filteredCatalogs]
  );

  const schemaFieldRows = useMemo(
    () => schema.schemaFields.map((item) => ({ ...item, key: item.id })),
    [schema.schemaFields]
  );

  function openCreateSchema() {
    setSchemaModalMode('create');
    setEditingSchema(null);
    schemaForm.setFieldsValue({ schema_key: '', schema_name: '', status: 'active' });
    setSchemaModalOpen(true);
  }

  function openEditSchema(row) {
    setSchemaModalMode('edit');
    setEditingSchema(row);
    schemaForm.setFieldsValue({
      schema_key: row.schema_key,
      schema_name: row.schema_name,
      status: row.status || 'active',
    });
    setSchemaModalOpen(true);
  }

  async function submitSchema() {
    const values = await schemaForm.validateFields();
    const result = schemaModalMode === 'create'
      ? await schema.createSchema(values)
      : await schema.updateSchema(editingSchema.id, values);

    if (result.ok) {
      message.success(result.message);
      setSchemaModalOpen(false);
    } else {
      message.error(result.message);
    }
  }

  async function deleteSchema(id) {
    const result = await schema.removeSchema(id);
    if (result.ok) message.success(result.message);
    else message.error(result.message);
  }

  function openCreateCatalog() {
    setCatalogModalMode('create');
    setEditingCatalog(null);
    catalogForm.setFieldsValue({
      field_key: '',
      field_label: '',
      data_type: 'string',
      input_type: 'text',
      optionsText: '',
      status: 'active',
    });
    setCatalogModalOpen(true);
  }

  function openEditCatalog(row) {
    setCatalogModalMode('edit');
    setEditingCatalog(row);
    catalogForm.setFieldsValue({
      field_key: row.field_key,
      field_label: row.field_label,
      data_type: row.data_type,
      input_type: row.input_type,
      optionsText: schema.optionsToText(row.options),
      status: row.status || 'active',
    });
    setCatalogModalOpen(true);
  }

  async function submitCatalog() {
    const values = await catalogForm.validateFields();
    const result = catalogModalMode === 'create'
      ? await schema.createCatalogField(values)
      : await schema.updateCatalogField(editingCatalog.id, values);

    if (result.ok) {
      message.success(result.message);
      setCatalogModalOpen(false);
    } else {
      message.error(result.message);
    }
  }

  async function deleteCatalog(id) {
    const result = await schema.removeCatalogField(id);
    if (result.ok) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  }

  function openAttachModal(catalogFieldId = null) {
    if (!schema.selectedSchemaId) {
      message.warning('Vui lòng chọn schema trước khi attach field');
      return;
    }

    attachForm.setFieldsValue({
      catalog_field_id: catalogFieldId || undefined,
      required: false,
      default_value: '',
      optionsText: '',
      sort_order: schema.schemaFields.length + 1,
      status: 'active',
    });
    setAttachModalOpen(true);
  }

  async function submitAttach() {
    const values = await attachForm.validateFields();
    const result = await schema.attachCatalogToSchema(values);

    if (result.ok) {
      message.success(result.message);
      setAttachModalOpen(false);
    } else {
      message.error(result.message);
    }
  }

  function openEditSchemaField(row) {
    setEditingSchemaField(row);
    overrideForm.setFieldsValue({
      required: Boolean(row.required),
      default_value: row.default_value ?? '',
      optionsText: schema.optionsToText(row.options),
      sort_order: row.sort_order,
      status: row.status || 'active',
    });
    setOverrideModalOpen(true);
  }

  async function submitOverride() {
    const values = await overrideForm.validateFields();
    const result = await schema.updateSchemaField(editingSchemaField.id, values);

    if (result.ok) {
      message.success(result.message);
      setOverrideModalOpen(false);
    } else {
      message.error(result.message);
    }
  }

  async function deleteSchemaField(id) {
    const result = await schema.removeSchemaField(id);
    if (result.ok) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  }

  async function moveSchemaField(id, direction) {
    const result = await schema.moveSchemaField(id, direction);
    if (!result.ok && result.message) {
      message.error(result.message);
    }
  }

  const schemaColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'schema_key', dataIndex: 'schema_key', key: 'schema_key', width: 180 },
    { title: 'schema_name', dataIndex: 'schema_name', key: 'schema_name', width: 220 },
    {
      title: 'status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => <Tag color={value === 'active' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 220,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => schema.setSelectedSchemaId(row.id)}>
            Chọn
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditSchema(row)}>
            Sửa
          </Button>
          <Popconfirm
            title={`Xóa schema ${row.schema_name}?`}
            onConfirm={() => deleteSchema(row.id)}
            okButtonProps={{ loading: schema.loadingSubmitSchema }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const catalogColumns = [
    { title: 'field_key', dataIndex: 'field_key', key: 'field_key', width: 160 },
    { title: 'field_label', dataIndex: 'field_label', key: 'field_label', width: 180 },
    { title: 'data_type', dataIndex: 'data_type', key: 'data_type', width: 120 },
    { title: 'input_type', dataIndex: 'input_type', key: 'input_type', width: 130 },
    {
      title: 'status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => <Tag color={value === 'active' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 260,
      render: (_, row) => (
        <Space>
          <Button size="small" icon={<LinkOutlined />} onClick={() => openAttachModal(row.id)} disabled={!schema.selectedSchemaId}>
            Add vào schema
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditCatalog(row)}>
            Sửa
          </Button>
          <Popconfirm
            title={`Xóa catalog field ${row.field_key}?`}
            onConfirm={() => deleteCatalog(row.id)}
            okButtonProps={{ loading: schema.loadingSubmitCatalog }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const schemaFieldColumns = [
    { title: 'sort_order', dataIndex: 'sort_order', key: 'sort_order', width: 90 },
    { title: 'field_key', dataIndex: 'field_key', key: 'field_key', width: 160 },
    { title: 'field_label', dataIndex: 'field_label', key: 'field_label', width: 180 },
    {
      title: 'required',
      dataIndex: 'required',
      key: 'required',
      width: 90,
      render: (value) => (value ? <Tag color="red">required</Tag> : <Tag>optional</Tag>),
    },
    {
      title: 'status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => <Tag color={value === 'active' ? 'green' : 'default'}>{value}</Tag>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 300,
      render: (_, row, index) => (
        <Space>
          <Button
            size="small"
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            loading={schema.loadingReorder}
            onClick={() => moveSchemaField(row.id, 'up')}
          />
          <Button
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={index === schemaFieldRows.length - 1}
            loading={schema.loadingReorder}
            onClick={() => moveSchemaField(row.id, 'down')}
          />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditSchemaField(row)}>
            Sửa override
          </Button>
          <Popconfirm
            title={`Xóa field ${row.field_key} khỏi schema?`}
            onConfirm={() => deleteSchemaField(row.id)}
            okButtonProps={{ loading: schema.loadingSubmitField }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {schema.schemaError ? <Alert type="error" showIcon message={schema.schemaError} /> : null}
      {schema.catalogError ? <Alert type="error" showIcon message={schema.catalogError} /> : null}
      {schema.fieldError ? <Alert type="error" showIcon message={schema.fieldError} /> : null}

      <Card
        title="Schema Management"
        extra={(
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateSchema}>
            Tạo schema
          </Button>
        )}
      >
        <Table
          rowKey="id"
          dataSource={schemaRows}
          columns={schemaColumns}
          loading={schema.loadingSchemas}
          locale={{ emptyText: <Empty description="Chưa có schema" /> }}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 920 }}
          rowClassName={(row) => (String(row.id) === String(schema.selectedSchemaId) ? 'ant-table-row-selected' : '')}
        />
      </Card>

      <Card
        title="Field Catalog dùng chung"
        extra={(
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCatalog}>
            Tạo field catalog
          </Button>
        )}
      >
        <Input.Search
          allowClear
          placeholder="Tìm theo field_key / field_label"
          value={schema.catalogSearch}
          onChange={(event) => schema.setCatalogSearch(event.target.value)}
          style={{ marginBottom: 12 }}
        />

        <Table
          rowKey="id"
          dataSource={catalogRows}
          columns={catalogColumns}
          loading={schema.loadingCatalogs}
          locale={{ emptyText: <Empty description="Chưa có field catalog" /> }}
          pagination={{ pageSize: 6 }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Card
        title={(
          <Space>
            <span>Fields của schema hiện tại</span>
            {schema.selectedSchema ? (
              <Text type="secondary">
                {schema.selectedSchema.schema_name} ({schema.selectedSchema.schema_key})
              </Text>
            ) : null}
          </Space>
        )}
        extra={(
          <Space>
            <Space>
              <Text type="secondary">Hiện inactive</Text>
              <Switch
                checked={schema.includeInactive}
                onChange={(checked) => schema.setIncludeInactive(checked)}
              />
            </Space>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={() => openAttachModal()}
              disabled={!schema.selectedSchemaId}
            >
              Add field vào schema
            </Button>
          </Space>
        )}
      >
        <Table
          rowKey="id"
          dataSource={schemaFieldRows}
          columns={schemaFieldColumns}
          loading={schema.loadingFields}
          locale={{ emptyText: <Empty description="Chưa có field nào attach vào schema" /> }}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 980 }}
        />
      </Card>

      <Modal
        title={schemaModalMode === 'create' ? 'Tạo schema' : 'Cập nhật schema'}
        open={schemaModalOpen}
        onCancel={() => setSchemaModalOpen(false)}
        onOk={submitSchema}
        confirmLoading={schema.loadingSubmitSchema}
      >
        <Form layout="vertical" form={schemaForm}>
          <Form.Item
            label="schema_key"
            name="schema_key"
            rules={[{ required: true, message: 'schema_key là bắt buộc' }]}
          >
            <Input placeholder="VD: default" />
          </Form.Item>
          <Form.Item
            label="schema_name"
            name="schema_name"
            rules={[{ required: true, message: 'schema_name là bắt buộc' }]}
          >
            <Input placeholder="VD: Default Schema" />
          </Form.Item>
          <Form.Item label="status" name="status">
            <Select showSearch optionFilterProp="label" options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={catalogModalMode === 'create' ? 'Tạo field catalog' : 'Cập nhật field catalog'}
        open={catalogModalOpen}
        onCancel={() => setCatalogModalOpen(false)}
        onOk={submitCatalog}
        confirmLoading={schema.loadingSubmitCatalog}
        width={760}
      >
        <Form layout="vertical" form={catalogForm}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="field_key"
                name="field_key"
                rules={[
                  { required: true, message: 'field_key là bắt buộc' },
                  {
                    validator: (_, value) => {
                      if (!value || FIELD_KEY_RULE.test(String(value).trim())) return Promise.resolve();
                      return Promise.reject(new Error('field_key chỉ cho phép a-z, 0-9, _ và -'));
                    },
                  },
                ]}
              >
                <Input placeholder="VD: huong_nha" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="field_label"
                name="field_label"
                rules={[{ required: true, message: 'field_label là bắt buộc' }]}
              >
                <Input placeholder="VD: Hướng nhà" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="data_type" name="data_type" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label" options={DATA_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="input_type" name="input_type" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label" options={INPUT_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="status" name="status">
                <Select showSearch optionFilterProp="label" options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="options (JSON array hoặc để trống)" name="optionsText">
            <Input.TextArea
              rows={4}
              placeholder={'[\n  {"value":"Đông","label":"Đông"},\n  {"value":"Tây","label":"Tây"}\n]'}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add field vào schema"
        open={attachModalOpen}
        onCancel={() => setAttachModalOpen(false)}
        onOk={submitAttach}
        confirmLoading={schema.loadingAttachField}
        width={760}
      >
        <Form layout="vertical" form={attachForm}>
          <Form.Item
            label="catalog_field_id"
            name="catalog_field_id"
            rules={[{ required: true, message: 'Vui lòng chọn field catalog' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={schema.fieldCatalogs.map((item) => ({
                value: item.id,
                label: `${item.field_key} - ${item.field_label}`,
              }))}
              placeholder="Chọn field catalog"
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="required" name="required" valuePropName="checked">
                <Switch checkedChildren="true" unCheckedChildren="false" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="sort_order" name="sort_order" rules={[{ required: true, message: 'sort_order là bắt buộc' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="status" name="status">
                <Select showSearch optionFilterProp="label" options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="default_value" name="default_value">
            <Input placeholder="Giá trị mặc định override" />
          </Form.Item>

          <Form.Item label="options override (JSON array hoặc để trống)" name="optionsText">
            <Input.TextArea
              rows={4}
              placeholder={'[\n  {"value":"Đông","label":"Đông"},\n  {"value":"Tây","label":"Tây"}\n]'}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Cập nhật override schema field"
        open={overrideModalOpen}
        onCancel={() => setOverrideModalOpen(false)}
        onOk={submitOverride}
        confirmLoading={schema.loadingSubmitField}
        width={760}
      >
        <Form layout="vertical" form={overrideForm}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="required" name="required" valuePropName="checked">
                <Switch checkedChildren="true" unCheckedChildren="false" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="sort_order" name="sort_order" rules={[{ required: true, message: 'sort_order là bắt buộc' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="status" name="status">
                <Select showSearch optionFilterProp="label" options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="default_value" name="default_value">
            <Input placeholder="Giá trị mặc định override" />
          </Form.Item>

          <Form.Item label="options override (JSON array hoặc để trống)" name="optionsText">
            <Input.TextArea
              rows={4}
              placeholder={'[\n  {"value":"Đông","label":"Đông"},\n  {"value":"Tây","label":"Tây"}\n]'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
