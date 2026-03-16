import { shouldRequireOptions } from './schemaFieldMapper';

export function isEmptyValue(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

export function normalizeDynamicValue(field, value) {
  if (isEmptyValue(value)) return undefined;

  const type = String(field?.data_type || '').toLowerCase();

  if (type === 'number' || type === 'float') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }

  if (type === 'integer' || type === 'int') {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : value;
  }

  if (type === 'boolean') {
    if (typeof value === 'boolean') return value;
    if (String(value).toLowerCase() === 'true') return true;
    if (String(value).toLowerCase() === 'false') return false;
    return value;
  }

  return value;
}

export function validateFixedFields(values) {
  const errors = {};

  if (!values.unit_code?.trim()) {
    errors.unit_code = 'unit_code là bắt buộc';
  }

  if (!Number(values.agency_id)) {
    errors.agency_id = 'agency_id là bắt buộc';
  }

  if (!Number(values.schema_id)) {
    errors.schema_id = 'schema_id là bắt buộc';
  }

  return errors;
}

export function validateDynamicFields(values, schemaFields) {
  const errors = {};

  schemaFields.forEach((field) => {
    const key = field.field_key;
    const value = values.dynamic?.[key];
    const label = field.field_label || key;
    const type = String(field.data_type || '').toLowerCase();

    if (field.required && isEmptyValue(value)) {
      errors[`dynamic.${key}`] = `${label} là bắt buộc`;
      return;
    }

    if (isEmptyValue(value)) return;

    if ((type === 'number' || type === 'float') && !Number.isFinite(Number(value))) {
      errors[`dynamic.${key}`] = `${label} phải là số`;
      return;
    }

    if ((type === 'integer' || type === 'int') && !Number.isInteger(Number(value))) {
      errors[`dynamic.${key}`] = `${label} phải là số nguyên`;
      return;
    }

    if (type === 'boolean') {
      const lower = String(value).toLowerCase();
      if (!(typeof value === 'boolean' || lower === 'true' || lower === 'false')) {
        errors[`dynamic.${key}`] = `${label} phải là true/false`;
        return;
      }
    }

    if (field.options?.length) {
      const allowed = field.options.map((item) => String(item.value));
      if (field.input_type === 'checkbox-group') {
        const selectedValues = Array.isArray(value) ? value.map((item) => String(item)) : [];
        const hasInvalid = selectedValues.some((item) => !allowed.includes(item));
        if (hasInvalid) {
          errors[`dynamic.${key}`] = `${label} không hợp lệ theo options`;
        }
      } else if (!allowed.includes(String(value))) {
        errors[`dynamic.${key}`] = `${label} không hợp lệ theo options`;
      }
    }
  });

  return errors;
}

export function parseOptionsInput(text) {
  if (!text || !String(text).trim()) return [];

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      return { ok: false, message: 'options phải là JSON array' };
    }

    const options = parsed
      .map((item) => ({
        label: String(item?.label ?? item?.value ?? '').trim(),
        value: String(item?.value ?? item?.label ?? '').trim(),
      }))
      .filter((item) => item.value);

    return { ok: true, options };
  } catch {
    return { ok: false, message: 'options phải là JSON hợp lệ' };
  }
}

export function validateSchemaFieldInput(payload, existingFields = [], currentFieldId = null) {
  if (!payload.field_key?.trim()) {
    return { ok: false, message: 'field_key là bắt buộc' };
  }

  const duplicated = existingFields.find(
    (item) =>
      String(item.field_key).trim().toLowerCase() === String(payload.field_key).trim().toLowerCase()
      && String(item.id) !== String(currentFieldId || '')
  );

  if (duplicated) {
    return { ok: false, message: 'field_key phải unique trong cùng schema' };
  }

  if (shouldRequireOptions(payload.input_type)) {
    if (!Array.isArray(payload.options) || !payload.options.length) {
      return { ok: false, message: 'options là bắt buộc cho input_type này' };
    }
  }

  return { ok: true };
}
