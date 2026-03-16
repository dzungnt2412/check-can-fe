import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card, Form, Input, Select, Button, Alert, Row, Col, Descriptions, Typography, Space, InputNumber, Divider,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function buildSourceCode(agencyName, projectName) {
  const agency = normalizeSlug(agencyName);
  const project = normalizeSlug(projectName);
  return [agency, project].filter(Boolean).join('_');
}

function buildSourceName(agencyName, projectName) {
  const agency = String(agencyName || '').trim().toUpperCase();
  const project = String(projectName || '').trim();
  return [agency, project].filter(Boolean).join(' ');
}

const sourceSchema = z.object({
  source_code: z.string().min(1, 'Bắt buộc'),
  source_name: z.string().min(1, 'Bắt buộc'),
  project_id: z.union([z.string(), z.number()]).optional(),
  agency_id: z.union([z.string(), z.number()]).optional(),
  du_an: z.string().optional(),
  dai_ly: z.string().optional(),
  spreadsheet_id: z.string().optional(),
  spreadsheet_url: z.string().optional(),
  sheet_name: z.string().optional(),
  gid: z.string().optional(),
  header_row_index: z.union([z.string(), z.number()]).optional(),
  data_start_row_index: z.union([z.string(), z.number()]).optional(),
  data_end_row_index: z.union([z.string(), z.number()]).optional(),
}).superRefine((data, ctx) => {
  const hasProjectId = Number(data.project_id) > 0;
  const hasAgencyId = Number(data.agency_id) > 0;
  const hasProjectText = !!data.du_an?.trim();
  const hasAgencyText = !!data.dai_ly?.trim();

  if (!hasProjectId && !hasProjectText) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cần chọn Dự án hoặc nhập du_an',
      path: ['project_id'],
    });
  }

  if (!hasAgencyId && !hasAgencyText) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cần chọn Đại lý hoặc nhập dai_ly',
      path: ['agency_id'],
    });
  }
});

function buildDefaults(mode, initialValues) {
  if (mode === 'edit' && initialValues) {
    return {
      source_code: initialValues.source_code || '',
      source_name: initialValues.source_name || '',
      project_id: initialValues.project_id || '',
      agency_id: initialValues.agency_id || '',
      du_an: initialValues.du_an || '',
      dai_ly: initialValues.dai_ly || '',
      spreadsheet_id: initialValues.spreadsheet_id || '',
      spreadsheet_url: initialValues.spreadsheet_url || '',
      sheet_name: initialValues.sheet_name || '',
      gid: String(initialValues.gid ?? ''),
      header_row_index: initialValues.header_row_index ?? 0,
      data_start_row_index: initialValues.data_start_row_index ?? '',
      data_end_row_index: initialValues.data_end_row_index ?? '',
    };
  }
  return {
    source_code: '',
    source_name: '',
    project_id: '',
    agency_id: '',
    du_an: '',
    dai_ly: '',
  };
}

export default function SourceForm({
  spreadsheetId,
  selectedSheetName,
  selectedGid,
  headerRowIndex,
  dataStartRowIndex,
  dataEndRowIndex,
  mode = 'create',
  initialValues = null,
  onCancel,
  loading,
  allProjects,
  agencies,
  loadingProjects,
  loadingAgencies,
  onSubmit,
  onGoToCatalog,
  disabled = false,
  showEditActions = true,
}) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sourceSchema),
    defaultValues: buildDefaults(mode, initialValues),
  });

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      reset(buildDefaults(mode, initialValues));
    }
  }, [mode, initialValues, reset]);

  const isEditMode = mode === 'edit';
  const hasNoProjects = !loadingProjects && allProjects.length === 0;
  const hasNoAgencies = !loadingAgencies && agencies.length === 0;

  function tryAutoFill({
    nextProjectId,
    nextAgencyId,
    nextFallbackProject,
    nextFallbackAgency,
  } = {}) {
    const projectId = nextProjectId ?? getValues('project_id');
    const agencyId = nextAgencyId ?? getValues('agency_id');
    const fallbackProject = nextFallbackProject ?? getValues('du_an');
    const fallbackAgency = nextFallbackAgency ?? getValues('dai_ly');

    const projectOption = allProjects.find((item) => String(item.id) === String(projectId));
    const agencyOption = agencies.find((item) => String(item.id) === String(agencyId));

    const projectName = projectOption?.name || fallbackProject || '';
    const agencyName = agencyOption?.name || fallbackAgency || '';

    if (!projectName || !agencyName) return;

    const nextCode = buildSourceCode(agencyName, projectName);
    const nextName = buildSourceName(agencyName, projectName);

    setValue('source_code', nextCode, { shouldDirty: true, shouldValidate: true });
    setValue('source_name', nextName, { shouldDirty: true, shouldValidate: true });
  }

  const fallbackProjectRegister = register('du_an', {
    onChange: (event) => {
      tryAutoFill({ nextFallbackProject: event?.target?.value || '' });
    },
  });

  const fallbackAgencyRegister = register('dai_ly', {
    onChange: (event) => {
      tryAutoFill({ nextFallbackAgency: event?.target?.value || '' });
    },
  });

  const submitDisabled = disabled || (!isEditMode && (!spreadsheetId || !selectedSheetName));

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Form layout="vertical" component={false}>
        <Card title="3) Create Source">
          <Text type="secondary">
            {isEditMode ? 'Cập nhật thông tin source.' : 'Tạo source metadata cho backend.'}
          </Text>

          {hasNoProjects || hasNoAgencies ? (
            <Alert
              type="warning"
              style={{ marginTop: 12 }}
              message={(
                <>
                  Chưa đủ danh mục để tạo source bằng ID.{' '}
                  <Button type="link" size="small" style={{ padding: 0 }} onClick={onGoToCatalog}>
                    Tạo dự án / đại lý
                  </Button>
                </>
              )}
            />
          ) : null}

          <div style={{ marginTop: 16, pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.7 : 1 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="source_code *"
                  validateStatus={errors.source_code ? 'error' : ''}
                  help={errors.source_code?.message}
                >
                  <Controller
                    name="source_code"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ''}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="source_name *"
                  validateStatus={errors.source_name ? 'error' : ''}
                  help={errors.source_name?.message}
                >
                  <Controller
                    name="source_name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ''}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    )}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  label="Dự án *"
                  validateStatus={errors.project_id ? 'error' : ''}
                  help={errors.project_id?.message}
                >
                  <Controller
                    name="project_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        value={field.value || undefined}
                        onChange={(val) => {
                          field.onChange(val ?? '');
                          tryAutoFill({ nextProjectId: val ?? '' });
                        }}
                        loading={loadingProjects}
                        disabled={loadingProjects || disabled}
                        allowClear
                        placeholder="-- Chọn dự án --"
                        style={{ width: '100%' }}
                        options={allProjects.map((p) => ({ value: p.id, label: p.name }))}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Đại lý *"
                  validateStatus={errors.agency_id ? 'error' : ''}
                  help={errors.agency_id?.message}
                >
                  <Controller
                    name="agency_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        value={field.value || undefined}
                        onChange={(val) => {
                          field.onChange(val ?? '');
                          tryAutoFill({ nextAgencyId: val ?? '' });
                        }}
                        loading={loadingAgencies}
                        disabled={loadingAgencies || disabled}
                        allowClear
                        placeholder="-- Chọn đại lý --"
                        style={{ width: '100%' }}
                        options={agencies.map((a) => ({ value: a.id, label: a.name }))}
                      />
                    )}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Fallback du_an">
                  <Input {...fallbackProjectRegister} placeholder="Nhập khi chưa có project_id" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Fallback dai_ly">
                  <Input {...fallbackAgencyRegister} placeholder="Nhập khi chưa có agency_id" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {!isEditMode ? (
            <>
              <Descriptions
                bordered
                size="small"
                column={{ xs: 1, sm: 2 }}
                style={{ marginBottom: 16 }}
                title={<Text type="secondary" style={{ fontSize: 12 }}>Tự động lấy từ Sheet Inspector</Text>}
              >
                <Descriptions.Item label="spreadsheet_id">{spreadsheetId || <Text type="danger">Chưa có</Text>}</Descriptions.Item>
                <Descriptions.Item label="sheet_name">{selectedSheetName || <Text type="danger">Chưa chọn tab</Text>}</Descriptions.Item>
                <Descriptions.Item label="gid">{selectedGid || '-'}</Descriptions.Item>
                <Descriptions.Item label="header_row_index">{headerRowIndex}</Descriptions.Item>
                <Descriptions.Item label="data_start_row_index">{dataStartRowIndex || '-'}</Descriptions.Item>
                <Descriptions.Item label="data_end_row_index">{dataEndRowIndex || '-'}</Descriptions.Item>
              </Descriptions>

              <Space>
                <Button
                  htmlType="submit"
                  type="primary"
                  icon={<PlusOutlined />}
                  loading={loading}
                  disabled={submitDisabled}
                  style={{ background: '#16a34a', borderColor: '#16a34a' }}
                >
                  Create Source
                </Button>
                {submitDisabled ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Cần inspect và chọn sheet tab trước.
                  </Text>
                ) : null}
              </Space>
            </>
          ) : null}
        </Card>

        {isEditMode ? (
          <Card title="Thông tin Sheet">
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Chỉnh sửa thông tin liên kết Google Sheets.
            </Text>

            <Row gutter={16} style={{ pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.7 : 1 }}>
              <Col xs={24} sm={12}>
                <Form.Item label="spreadsheet_id">
                  <Controller
                    name="spreadsheet_id"
                    control={control}
                    render={({ field }) => <Input {...field} value={field.value || ''} placeholder="Spreadsheet ID" />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="spreadsheet_url">
                  <Controller
                    name="spreadsheet_url"
                    control={control}
                    render={({ field }) => <Input {...field} value={field.value || ''} placeholder="URL Google Sheets" />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="sheet_name">
                  <Controller
                    name="sheet_name"
                    control={control}
                    render={({ field }) => <Input {...field} value={field.value || ''} placeholder="Tên sheet tab" />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="gid">
                  <Controller
                    name="gid"
                    control={control}
                    render={({ field }) => <Input {...field} value={field.value || ''} placeholder="GID của sheet" />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="header_row_index">
                  <Controller
                    name="header_row_index"
                    control={control}
                    render={({ field }) => <InputNumber {...field} value={field.value ?? 0} min={0} style={{ width: '100%' }} />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="data_start_row_index">
                  <Controller
                    name="data_start_row_index"
                    control={control}
                    render={({ field }) => <InputNumber {...field} value={field.value ?? ''} min={0} style={{ width: '100%' }} />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="data_end_row_index">
                  <Controller
                    name="data_end_row_index"
                    control={control}
                    render={({ field }) => <InputNumber {...field} value={field.value ?? ''} min={0} style={{ width: '100%' }} />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: '8px 0 16px' }} />

            {showEditActions ? (
              <Space>
                <Button
                  htmlType="submit"
                  type="primary"
                  icon={<EditOutlined />}
                  loading={loading}
                  disabled={disabled}
                >
                  Cập nhật Source
                </Button>
                {onCancel ? (
                  <Button onClick={onCancel}>Huỷ</Button>
                ) : null}
              </Space>
            ) : null}
          </Card>
        ) : null}
      </Form>
    </form>
  );
}
