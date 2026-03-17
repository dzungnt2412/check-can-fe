import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card, Form, Input, Select, Button, Alert, Row, Col, Descriptions, Typography, Space, InputNumber, Divider,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

const DATA_CONDITION_OPERATORS = [
  { value: 'eq', label: 'Bằng (=)' },
  { value: 'ne', label: 'Khác (!=)' },
  { value: 'contains', label: 'Chứa' },
  { value: 'empty', label: 'Rỗng' },
  { value: 'not_empty', label: 'Không rỗng' },
];

const DATA_VALUE_REQUIRED_OPERATORS = new Set(['eq', 'ne', 'contains']);

const optionalEnum = (values) =>
  z.preprocess(
    (value) => (String(value ?? '').trim() === '' ? undefined : value),
    z.enum(values).optional()
  );

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

function buildSourceCodeFromName(sourceName) {
  return normalizeSlug(sourceName || '');
}

function buildSourceNameFromAgency(agencyName) {
  return String(agencyName || '').trim().toUpperCase();
}

function parseDataConditionDefaults(dataCondition, prefix) {
  const hasColumnIndex =
    dataCondition?.column_index !== undefined &&
    dataCondition?.column_index !== null &&
    String(dataCondition.column_index).trim() !== '';

  const parsedColumnIndex = hasColumnIndex ? Number(dataCondition.column_index) : '';

  return {
    [`${prefix}_field_type`]: hasColumnIndex ? 'column_index' : 'column_name',
    [`${prefix}_column_name`]: String(dataCondition?.column_name || ''),
    [`${prefix}_column_index`]:
      hasColumnIndex && Number.isFinite(parsedColumnIndex) ? parsedColumnIndex : '',
    [`${prefix}_operator`]: String(dataCondition?.operator || ''),
    [`${prefix}_value`]: String(dataCondition?.value ?? ''),
  };
}

function buildDataConditionPayload(values, prefix, { disabled = false } = {}) {
  if (disabled) return undefined;

  const fieldType = String(values[`${prefix}_field_type`] || '').trim();
  const operator = String(values[`${prefix}_operator`] || '').trim();
  const columnName = String(values[`${prefix}_column_name`] || '').trim();
  const rawColumnIndex = values[`${prefix}_column_index`];
  const hasColumnIndex =
    rawColumnIndex !== undefined &&
    rawColumnIndex !== null &&
    String(rawColumnIndex).trim() !== '';
  const columnIndex = hasColumnIndex ? Number(rawColumnIndex) : null;
  const conditionValue = String(values[`${prefix}_value`] ?? '').trim();

  if (!operator) return undefined;
  if (fieldType === 'column_index') {
    if (!hasColumnIndex || !Number.isInteger(columnIndex) || columnIndex < 0) {
      return undefined;
    }
  } else if (!columnName) {
    return undefined;
  }

  if (DATA_VALUE_REQUIRED_OPERATORS.has(operator) && !conditionValue) {
    return undefined;
  }

  const payload = {
    operator,
  };

  if (fieldType === 'column_index') {
    payload.column_index = columnIndex;
  } else {
    payload.column_name = columnName;
  }

  if (conditionValue) {
    payload.value = conditionValue;
  }

  return payload;
}

const sourceSchema = z.object({
  source_code: z.string().optional(),
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
  data_start_condition_field_type: optionalEnum(['column_name', 'column_index']),
  data_start_condition_column_name: z.string().optional(),
  data_start_condition_column_index: z.union([z.string(), z.number()]).optional(),
  data_start_condition_operator: optionalEnum(['eq', 'ne', 'contains', 'empty', 'not_empty']),
  data_start_condition_value: z.string().optional(),
  data_end_condition_field_type: optionalEnum(['column_name', 'column_index']),
  data_end_condition_column_name: z.string().optional(),
  data_end_condition_column_index: z.union([z.string(), z.number()]).optional(),
  data_end_condition_operator: optionalEnum(['eq', 'ne', 'contains', 'empty', 'not_empty']),
  data_end_condition_value: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasAgencyId = Number(data.agency_id) > 0;
  const hasAgencyText = !!data.dai_ly?.trim();

  if (!hasAgencyId && !hasAgencyText) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cần chọn Đại lý hoặc nhập dai_ly',
      path: ['agency_id'],
    });
  }

});

function buildDefaults(mode, initialValues) {
  const dataStartConditionDefaults = parseDataConditionDefaults(initialValues?.data_start_condition, 'data_start_condition');
  const dataEndConditionDefaults = parseDataConditionDefaults(initialValues?.data_end_condition, 'data_end_condition');

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
      ...dataStartConditionDefaults,
      ...dataEndConditionDefaults,
    };
  }
  return {
    source_code: '',
    source_name: '',
    agency_id: '',
    dai_ly: '',
    data_start_condition_field_type: 'column_name',
    data_start_condition_column_name: '',
    data_start_condition_column_index: '',
    data_start_condition_operator: '',
    data_start_condition_value: '',
    data_end_condition_field_type: 'column_name',
    data_end_condition_column_name: '',
    data_end_condition_column_index: '',
    data_end_condition_operator: '',
    data_end_condition_value: '',
  };
}

function hasDataConditionValue(dataCondition) {
  if (!dataCondition) return false;

  const valuesToCheck = [
    dataCondition.operator,
    dataCondition.column_name,
    dataCondition.column_index,
    dataCondition.value,
  ];

  return valuesToCheck.some((item) => String(item ?? '').trim() !== '');
}

export default function SourceForm({
  sheetUrl,
  spreadsheetId,
  selectedSheetName,
  selectedGid,
  headerRowIndex,
  dataStartRowIndex,
  dataEndRowIndex,
  headers = [],
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
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sourceSchema),
    defaultValues: buildDefaults(mode, initialValues),
    shouldFocusError: false,
  });

  const [isDataStartConditionEnabled, setIsDataStartConditionEnabled] = useState(() =>
    hasDataConditionValue(initialValues?.data_start_condition)
  );
  const [isDataEndConditionEnabled, setIsDataEndConditionEnabled] = useState(() =>
    hasDataConditionValue(initialValues?.data_end_condition)
  );

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      reset(buildDefaults(mode, initialValues));
    }
  }, [mode, initialValues, reset]);

  useEffect(() => {
    setIsDataStartConditionEnabled(hasDataConditionValue(initialValues?.data_start_condition));
    setIsDataEndConditionEnabled(hasDataConditionValue(initialValues?.data_end_condition));
  }, [initialValues]);

  // Sync các giá trị từ Sheet Inspector vào form khi đang edit
  useEffect(() => {
    if (mode !== 'edit') return;

    if (sheetUrl !== undefined) setValue('spreadsheet_url', sheetUrl ?? '');
    if (spreadsheetId !== undefined) setValue('spreadsheet_id', spreadsheetId ?? '');
    if (selectedSheetName !== undefined) setValue('sheet_name', selectedSheetName ?? '');
    if (selectedGid !== undefined) setValue('gid', String(selectedGid ?? ''));
    if (headerRowIndex !== undefined) setValue('header_row_index', headerRowIndex ?? 0);
    if (dataStartRowIndex !== undefined) setValue('data_start_row_index', dataStartRowIndex ?? '');
    if (dataEndRowIndex !== undefined) setValue('data_end_row_index', dataEndRowIndex ?? '');
  }, [mode, sheetUrl, spreadsheetId, selectedSheetName, selectedGid, headerRowIndex, dataStartRowIndex, dataEndRowIndex, setValue]);

  const isEditMode = mode === 'edit';
  const hasNoAgencies = !loadingAgencies && agencies.length === 0;
  const dataStartConditionFieldType = watch('data_start_condition_field_type') || 'column_name';
  const dataStartConditionOperator = watch('data_start_condition_operator') || '';
  const dataStartRowIndexInForm = watch('data_start_row_index');
  const isDataStartConditionDisabled = isEditMode
    ? String(dataStartRowIndexInForm ?? '').trim() !== ''
    : String(dataStartRowIndex ?? '').trim() !== '';
  const isDataStartValueRequired = DATA_VALUE_REQUIRED_OPERATORS.has(dataStartConditionOperator);

  const dataEndConditionFieldType = watch('data_end_condition_field_type') || 'column_name';
  const dataEndConditionOperator = watch('data_end_condition_operator') || '';
  const dataEndRowIndexInForm = watch('data_end_row_index');
  const isDataEndConditionDisabled = isEditMode
    ? String(dataEndRowIndexInForm ?? '').trim() !== ''
    : String(dataEndRowIndex ?? '').trim() !== '';
  const isDataEndValueRequired = DATA_VALUE_REQUIRED_OPERATORS.has(dataEndConditionOperator);

  function tryAutoFillFromAgency(agencyName) {
    if (isEditMode) return;

    const nextName = buildSourceNameFromAgency(agencyName);
    if (!nextName) return;

    setValue('source_name', nextName, {
      shouldDirty: true,
      shouldValidate: true,
    });

    setValue('source_code', buildSourceCodeFromName(nextName), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  const fallbackAgencyRegister = register('dai_ly', {
    onChange: (event) => {
      tryAutoFillFromAgency(event?.target?.value || '');
    },
  });

  const submitDisabled = disabled || (!isEditMode && (!spreadsheetId || !selectedSheetName));

  useEffect(() => {
    if (!isDataStartConditionDisabled) return;

    setValue('data_start_condition_field_type', 'column_name');
    setValue('data_start_condition_column_name', '');
    setValue('data_start_condition_column_index', '');
    setValue('data_start_condition_operator', '');
    setValue('data_start_condition_value', '');
  }, [isDataStartConditionDisabled, setValue]);

  useEffect(() => {
    if (!isDataEndConditionDisabled) return;

    setValue('data_end_condition_field_type', 'column_name');
    setValue('data_end_condition_column_name', '');
    setValue('data_end_condition_column_index', '');
    setValue('data_end_condition_operator', '');
    setValue('data_end_condition_value', '');
  }, [isDataEndConditionDisabled, setValue]);

  useEffect(() => {
    if (isDataStartConditionEnabled) return;

    setValue('data_start_condition_field_type', 'column_name');
    setValue('data_start_condition_column_name', '');
    setValue('data_start_condition_column_index', '');
    setValue('data_start_condition_operator', '');
    setValue('data_start_condition_value', '');
  }, [isDataStartConditionEnabled, setValue]);

  useEffect(() => {
    if (isDataEndConditionEnabled) return;

    setValue('data_end_condition_field_type', 'column_name');
    setValue('data_end_condition_column_name', '');
    setValue('data_end_condition_column_index', '');
    setValue('data_end_condition_operator', '');
    setValue('data_end_condition_value', '');
  }, [isDataEndConditionEnabled, setValue]);

  const handleFormSubmit = handleSubmit((values) => {
    const dataStartCondition = buildDataConditionPayload(values, 'data_start_condition', {
      disabled: isDataStartConditionDisabled || !isDataStartConditionEnabled,
    });
    const dataEndCondition = buildDataConditionPayload(values, 'data_end_condition', {
      disabled: isDataEndConditionDisabled || !isDataEndConditionEnabled,
    });

    onSubmit({
      ...values,
      data_start_condition: dataStartCondition ?? null,
      data_end_condition: dataEndCondition ?? null,
    });
  });

  return (
    <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Form layout="vertical" component={false}>
        <Card title="3) Create Source">
          <Text type="secondary">
            {isEditMode ? 'Cập nhật thông tin source.' : 'Tạo source metadata cho backend.'}
          </Text>

          {hasNoAgencies ? (
            <Alert
              type="warning"
              style={{ marginTop: 12 }}
              message={(
                <>
                  Chưa đủ danh mục để tạo source bằng ID đại lý.{' '}
                  <Button type="link" size="small" style={{ padding: 0 }} onClick={onGoToCatalog}>
                    Tạo đại lý
                  </Button>
                </>
              )}
            />
          ) : null}

          <div style={{ marginTop: 16, pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.7 : 1 }}>
            <Row gutter={16}>
              <Col xs={24} sm={24}>
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
                        onChange={(event) => {
                          const nextName = event.target.value;
                          field.onChange(nextName);

                          if (!isEditMode) {
                            setValue('source_code', buildSourceCodeFromName(nextName), {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }
                        }}
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

                          const agencyOption = agencies.find(
                            (item) => String(item.id) === String(val)
                          );
                          tryAutoFillFromAgency(agencyOption?.name || '');
                        }}
                        loading={loadingAgencies}
                        disabled={loadingAgencies || disabled}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        placeholder="-- Chọn đại lý --"
                        style={{ width: '100%' }}
                        options={agencies.map((a) => ({ value: a.id, label: a.name }))}
                      />
                    )}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Fallback dai_ly">
                  <Input {...fallbackAgencyRegister} placeholder="Nhập khi chưa có agency_id" />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Card
                  size="small"
                  title="Điều kiện bắt đầu (tuỳ chọn)"
                  extra={
                    <Space>
                      {isDataStartConditionDisabled ? (
                        <Text type="secondary">Đang bị vô hiệu</Text>
                      ) : null}
                      <Button
                        size="small"
                        type={isDataStartConditionEnabled ? 'default' : 'primary'}
                        disabled={disabled || isDataStartConditionDisabled}
                        onClick={() => setIsDataStartConditionEnabled((prev) => !prev)}
                      >
                        {isDataStartConditionEnabled ? 'Bỏ chọn' : 'Chọn điều kiện'}
                      </Button>
                    </Space>
                  }
                >
                  {isDataStartConditionDisabled ? (
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 12 }}
                      message="Đang dùng data_start_row_index nên data_start_condition được tắt."
                    />
                  ) : null}

                  {isDataStartConditionEnabled ? (
                    <Row gutter={12}>
                      <Col xs={24} sm={8}>
                        <Form.Item
                          label="Kiểu cột"
                          validateStatus={errors.data_start_condition_field_type ? 'error' : ''}
                          help={errors.data_start_condition_field_type?.message}
                        >
                          <Controller
                            name="data_start_condition_field_type"
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                value={field.value || 'column_name'}
                                disabled={disabled || isDataStartConditionDisabled}
                                options={[
                                  { value: 'column_name', label: 'column_name' },
                                  { value: 'column_index', label: 'column_index (0-based)' },
                                ]}
                                onChange={(value) => {
                                  field.onChange(value);
                                  setValue('data_start_condition_column_name', '');
                                  setValue('data_start_condition_column_index', '');
                                }}
                              />
                            )}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={8}>
                        {dataStartConditionFieldType === 'column_index' ? (
                          <Form.Item
                            label="column_index (0-based)"
                            validateStatus={errors.data_start_condition_column_index ? 'error' : ''}
                            help={errors.data_start_condition_column_index?.message}
                          >
                            <Controller
                              name="data_start_condition_column_index"
                              control={control}
                              render={({ field }) => (
                                <InputNumber
                                  {...field}
                                  value={field.value === '' ? null : field.value}
                                  onChange={(value) => field.onChange(value ?? '')}
                                  min={0}
                                  precision={0}
                                  style={{ width: '100%' }}
                                  disabled={disabled || isDataStartConditionDisabled}
                                />
                              )}
                            />
                          </Form.Item>
                        ) : (
                          <Form.Item
                            label="column_name"
                            validateStatus={errors.data_start_condition_column_name ? 'error' : ''}
                            help={errors.data_start_condition_column_name?.message}
                          >
                            <Controller
                              name="data_start_condition_column_name"
                              control={control}
                              render={({ field }) => (
                                <Select
                                  value={field.value || undefined}
                                  onChange={(value) => field.onChange(value ?? '')}
                                  placeholder="Chọn header"
                                  disabled={disabled || isDataStartConditionDisabled}
                                  allowClear
                                  showSearch
                                  optionFilterProp="label"
                                  options={headers.map((header) => ({
                                    value: String(header),
                                    label: String(header),
                                  }))}
                                />
                              )}
                            />
                          </Form.Item>
                        )}
                      </Col>

                      <Col xs={24} sm={8}>
                        <Form.Item
                          label="Toán tử"
                          validateStatus={errors.data_start_condition_operator ? 'error' : ''}
                          help={errors.data_start_condition_operator?.message}
                        >
                          <Controller
                            name="data_start_condition_operator"
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                value={field.value || undefined}
                                placeholder="Chọn operator"
                                disabled={disabled || isDataStartConditionDisabled}
                                options={DATA_CONDITION_OPERATORS}
                                onChange={(value) => {
                                  field.onChange(value);
                                  if (!DATA_VALUE_REQUIRED_OPERATORS.has(value)) {
                                    setValue('data_start_condition_value', '');
                                  }
                                }}
                                allowClear
                              />
                            )}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24}>
                        <Form.Item
                          label={`value${isDataStartValueRequired ? ' *' : ''}`}
                          validateStatus={errors.data_start_condition_value ? 'error' : ''}
                          help={errors.data_start_condition_value?.message}
                        >
                          <Controller
                            name="data_start_condition_value"
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                value={field.value || ''}
                                placeholder="Nhập giá trị so sánh"
                                disabled={
                                  disabled ||
                                  isDataStartConditionDisabled ||
                                  !isDataStartValueRequired
                                }
                              />
                            )}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  ) : (
                    <Text type="secondary">
                      Nhấn “Chọn điều kiện” để cấu hình điều kiện bắt đầu đọc dữ liệu.
                    </Text>
                  )}
                </Card>
              </Col>

              <Col xs={24}>
                <Card
                  size="small"
                  title="Điều kiện kết thúc (tuỳ chọn)"
                  extra={
                    <Space>
                      {isDataEndConditionDisabled ? (
                        <Text type="secondary">Đang bị vô hiệu</Text>
                      ) : null}
                      <Button
                        size="small"
                        type={isDataEndConditionEnabled ? 'default' : 'primary'}
                        disabled={disabled || isDataEndConditionDisabled}
                        onClick={() => setIsDataEndConditionEnabled((prev) => !prev)}
                      >
                        {isDataEndConditionEnabled ? 'Bỏ chọn' : 'Chọn điều kiện'}
                      </Button>
                    </Space>
                  }
                >
                  {isDataEndConditionDisabled ? (
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 12 }}
                      message="Đang dùng data_end_row_index nên data_end_condition được tắt."
                    />
                  ) : null}

                  {isDataEndConditionEnabled ? (
                    <Row gutter={12}>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Kiểu cột"
                        validateStatus={errors.data_end_condition_field_type ? 'error' : ''}
                        help={errors.data_end_condition_field_type?.message}
                      >
                        <Controller
                          name="data_end_condition_field_type"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              value={field.value || 'column_name'}
                              disabled={disabled || isDataEndConditionDisabled}
                              options={[
                                { value: 'column_name', label: 'column_name' },
                                { value: 'column_index', label: 'column_index (0-based)' },
                              ]}
                              onChange={(value) => {
                                field.onChange(value);
                                setValue('data_end_condition_column_name', '');
                                setValue('data_end_condition_column_index', '');
                              }}
                            />
                          )}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={8}>
                      {dataEndConditionFieldType === 'column_index' ? (
                        <Form.Item
                          label="column_index (0-based)"
                          validateStatus={errors.data_end_condition_column_index ? 'error' : ''}
                          help={errors.data_end_condition_column_index?.message}
                        >
                          <Controller
                            name="data_end_condition_column_index"
                            control={control}
                            render={({ field }) => (
                              <InputNumber
                                {...field}
                                value={field.value === '' ? null : field.value}
                                onChange={(value) => field.onChange(value ?? '')}
                                min={0}
                                precision={0}
                                style={{ width: '100%' }}
                                disabled={disabled || isDataEndConditionDisabled}
                              />
                            )}
                          />
                        </Form.Item>
                      ) : (
                        <Form.Item
                          label="column_name"
                          validateStatus={errors.data_end_condition_column_name ? 'error' : ''}
                          help={errors.data_end_condition_column_name?.message}
                        >
                          <Controller
                            name="data_end_condition_column_name"
                            control={control}
                            render={({ field }) => (
                              <Select
                                value={field.value || undefined}
                                onChange={(value) => field.onChange(value ?? '')}
                                placeholder="Chọn header"
                                disabled={disabled || isDataEndConditionDisabled}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                options={headers.map((header) => ({
                                  value: String(header),
                                  label: String(header),
                                }))}
                              />
                            )}
                          />
                        </Form.Item>
                      )}
                    </Col>

                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Toán tử"
                        validateStatus={errors.data_end_condition_operator ? 'error' : ''}
                        help={errors.data_end_condition_operator?.message}
                      >
                        <Controller
                          name="data_end_condition_operator"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              value={field.value || undefined}
                              placeholder="Chọn operator"
                              disabled={disabled || isDataEndConditionDisabled}
                              options={DATA_CONDITION_OPERATORS}
                              onChange={(value) => {
                                field.onChange(value);
                                if (!DATA_VALUE_REQUIRED_OPERATORS.has(value)) {
                                  setValue('data_end_condition_value', '');
                                }
                              }}
                              allowClear
                            />
                          )}
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24}>
                      <Form.Item
                        label={`value${isDataEndValueRequired ? ' *' : ''}`}
                        validateStatus={errors.data_end_condition_value ? 'error' : ''}
                        help={errors.data_end_condition_value?.message}
                      >
                        <Controller
                          name="data_end_condition_value"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              value={field.value || ''}
                              placeholder="Nhập giá trị so sánh"
                              disabled={
                                disabled ||
                                isDataEndConditionDisabled ||
                                !isDataEndValueRequired
                              }
                            />
                          )}
                        />
                      </Form.Item>
                    </Col>
                    </Row>
                  ) : (
                    <Text type="secondary">
                      Nhấn “Chọn điều kiện” để cấu hình điều kiện dừng đọc dữ liệu.
                    </Text>
                  )}
                </Card>
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
