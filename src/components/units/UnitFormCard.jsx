import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import {
  isEmptyValue,
  normalizeDynamicValue,
  validateDynamicFields,
  validateFixedFields,
} from '../../utils/unitDynamicValidation';

const { Text } = Typography;

function DynamicFieldInput({ field, control }) {
  const name = `dynamic.${field.field_key}`;

  if (field.input_type === 'radio') {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field: controlledField }) => (
          <Radio.Group
            {...controlledField}
            value={controlledField.value ?? undefined}
            onChange={(event) => controlledField.onChange(event.target.value ?? '')}
            options={field.options || []}
          />
        )}
      />
    );
  }

  if (field.input_type === 'checkbox-group') {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field: controlledField }) => (
          <Checkbox.Group
            {...controlledField}
            value={Array.isArray(controlledField.value) ? controlledField.value : []}
            onChange={(values) => controlledField.onChange(values ?? [])}
            options={field.options || []}
          />
        )}
      />
    );
  }

  if (field.input_type === 'select' || field.options?.length) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field: controlledField }) => (
          <Select
            {...controlledField}
            value={controlledField.value ?? undefined}
            onChange={(val) => controlledField.onChange(val ?? '')}
            options={field.options || []}
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={`Chọn ${field.field_label || field.field_key}`}
            style={{ width: '100%' }}
          />
        )}
      />
    );
  }

  if (field.input_type === 'textarea') {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field: controlledField }) => (
          <Input.TextArea
            {...controlledField}
            value={controlledField.value ?? ''}
            rows={3}
            placeholder={field.field_label || field.field_key}
          />
        )}
      />
    );
  }

  if (field.data_type === 'number' || field.data_type === 'float' || field.data_type === 'integer' || field.data_type === 'int') {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field: controlledField }) => (
          <InputNumber
            {...controlledField}
            value={isEmptyValue(controlledField.value) ? undefined : Number(controlledField.value)}
            onChange={(val) => controlledField.onChange(val ?? '')}
            style={{ width: '100%' }}
            placeholder={field.field_label || field.field_key}
          />
        )}
      />
    );
  }

  if (field.data_type === 'boolean' || field.input_type === 'switch' || field.input_type === 'checkbox') {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field: controlledField }) => (
          <Switch
            checked={!!controlledField.value}
            onChange={(checked) => controlledField.onChange(checked)}
            checkedChildren="true"
            unCheckedChildren="false"
          />
        )}
      />
    );
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: controlledField }) => (
        <Input
          {...controlledField}
          value={controlledField.value ?? ''}
          placeholder={field.field_label || field.field_key}
        />
      )}
    />
  );
}

export default function UnitFormCard({
  mode,
  initialValues,
  schemaFields,
  schemaOptions,
  agencyOptions,
  loadingSubmit,
  submitError,
  loadingSchemaFields,
  schemaError,
  onSchemaChange,
  onCancel,
  onSubmit,
}) {
  const {
    register,
    control,
    reset,
    setValue,
    getValues,
    unregister,
    setError,
    clearErrors,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      unit_code: '',
      agency_id: '',
      schema_id: '',
      dynamic: {},
    },
  });

  useEffect(() => {
    const dynamicDefaults = {};
    schemaFields.forEach((field) => {
      dynamicDefaults[field.field_key] =
        initialValues?.dynamic_data?.[field.field_key] ?? field.default_value ?? '';
    });

    reset({
      unit_code: initialValues?.unit_code ?? '',
      agency_id: initialValues?.agency_id ?? '',
      schema_id: initialValues?.schema_id ?? '',
      dynamic: dynamicDefaults,
    });
  }, [initialValues, mode, reset]);

  useEffect(() => {
    const currentDynamic = getValues('dynamic') || {};
    const currentKeys = new Set(Object.keys(currentDynamic));
    const validKeys = new Set(schemaFields.map((field) => field.field_key));

    schemaFields.forEach((field) => {
      const key = field.field_key;
      const currentValue = currentDynamic[key];

      if (!isEmptyValue(currentValue)) return;

      const initialValue = initialValues?.dynamic_data?.[key];
      if (!isEmptyValue(initialValue)) {
        setValue(`dynamic.${key}`, initialValue);
        return;
      }

      if (!isEmptyValue(field.default_value)) {
        setValue(`dynamic.${key}`, field.default_value);
      }
    });

    currentKeys.forEach((key) => {
      if (!validKeys.has(key)) {
        unregister(`dynamic.${key}`);
      }
    });
  }, [schemaFields, initialValues, getValues, setValue, unregister]);

  const selectedSchemaId = watch('schema_id');

  useEffect(() => {
    onSchemaChange?.(selectedSchemaId || '');
  }, [selectedSchemaId, onSchemaChange]);

  const title = mode === 'create' ? 'Tạo Unit' : 'Cập nhật Unit';

  const orderedSchemaFields = useMemo(
    () => [...schemaFields].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)),
    [schemaFields]
  );

  function validateFixed(values) {
    const errorsMap = validateFixedFields(values);
    Object.entries(errorsMap).forEach(([name, message]) => {
      setError(name, { type: 'manual', message });
    });
    return Object.keys(errorsMap).length === 0;
  }

  function validateDynamic(values) {
    const errorsMap = validateDynamicFields(values, orderedSchemaFields);
    Object.entries(errorsMap).forEach(([name, message]) => {
      setError(name, { type: 'manual', message });
    });
    return Object.keys(errorsMap).length === 0;
  }

  function handleInternalSubmit(values) {
    clearErrors();
    const fixedValid = validateFixed(values);
    const dynamicValid = validateDynamic(values);
    if (!fixedValid || !dynamicValid) return;

    const validKeys = new Set(orderedSchemaFields.map((item) => item.field_key));
    const dynamic_data = Object.entries(values.dynamic || {}).reduce((acc, [key, value]) => {
      if (!validKeys.has(key)) return acc;
      if (isEmptyValue(value)) return acc;
      const field = orderedSchemaFields.find((item) => item.field_key === key);
      acc[key] = normalizeDynamicValue(field, value);
      return acc;
    }, {});

    onSubmit({
      unit_code: values.unit_code.trim(),
      agency_id: Number(values.agency_id),
      schema_id: Number(values.schema_id),
      dynamic_data,
    });
  }

  return (
    <Card title={title}>
      {submitError ? <Alert type="error" showIcon style={{ marginBottom: 12 }} message={submitError} /> : null}

      <form onSubmit={handleSubmit(handleInternalSubmit)}>
        <Form layout="vertical" component={false}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="unit_code *"
                validateStatus={errors.unit_code ? 'error' : ''}
                help={errors.unit_code?.message}
              >
                <Input {...register('unit_code')} placeholder="VD: A1-01" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="schema_id *"
                validateStatus={errors.schema_id ? 'error' : ''}
                help={errors.schema_id?.message}
              >
                <Controller
                  name="schema_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onChange={(value) => field.onChange(value ?? '')}
                      options={schemaOptions}
                      showSearch
                      optionFilterProp="label"
                      allowClear
                      placeholder="Chọn schema_id"
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="agency_id *"
                validateStatus={errors.agency_id ? 'error' : ''}
                help={errors.agency_id?.message}
              >
                <Controller
                  name="agency_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onChange={(value) => field.onChange(value ?? '')}
                      options={agencyOptions}
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder="Chọn agency"
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </Form.Item>
            </Col>

          </Row>

          <Card
            type="inner"
            title="dynamic_data"
            style={{ marginBottom: 16 }}
            loading={loadingSchemaFields}
            extra={<Text type="secondary">{orderedSchemaFields.length} fields</Text>}
          >
            {schemaError ? (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 12 }}
                message={schemaError}
              />
            ) : null}

            {!orderedSchemaFields.length ? (
              <Text type="secondary">Chọn schema_id để render field động.</Text>
            ) : (
              <Row gutter={16}>
                {orderedSchemaFields.map((field) => {
                  const error = errors?.dynamic?.[field.field_key]?.message;
                  const label = (
                    <Space size={6}>
                      <span>{field.field_label || field.field_key}</span>
                      <Tag>{field.data_type}</Tag>
                      {field.required ? <Tag color="red">required</Tag> : null}
                    </Space>
                  );

                  return (
                    <Col xs={24} sm={12} key={field.id || field.field_key}>
                      <Form.Item
                        label={label}
                        validateStatus={error ? 'error' : ''}
                        help={error}
                      >
                        <DynamicFieldInput field={field} control={control} />
                      </Form.Item>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>

          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loadingSubmit}
            >
              {mode === 'create' ? 'Tạo Unit' : 'Cập nhật Unit'}
            </Button>
            <Button onClick={onCancel}>Quay lại</Button>
          </Space>
        </Form>
      </form>
    </Card>
  );
}
