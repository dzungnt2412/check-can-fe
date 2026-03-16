function parseOptions(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number') {
          const text = String(item);
          return { label: text, value: text };
        }

        return {
          label: String(item?.label ?? item?.value ?? ''),
          value: String(item?.value ?? item?.label ?? ''),
        };
      })
      .filter((item) => item.value);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parseOptions(parsed);
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => ({ label: item, value: item }));
    }
  }

  return [];
}

export function normalizeSchemaField(item) {
  const key = item.field_key ?? item.key ?? '';
  return {
    id: item.id,
    schema_id: item.schema_id ?? item.schemaId,
    schema_key: item.schema_key ?? item.schemaKey ?? '',
    schema_name: item.schema_name ?? item.schemaName ?? '',
    field_key: key,
    field_label: item.field_label ?? item.label ?? key,
    data_type: item.data_type ?? 'string',
    input_type: item.input_type ?? 'text',
    required: Boolean(item.required),
    default_value: item.default_value,
    options: parseOptions(item.options),
    sort_order: item.sort_order ?? 999,
    status: item.status ?? (item.is_active ? 'active' : 'inactive'),
    is_active: item.is_active ?? item.status === 'active',
  };
}

export function sortSchemaFields(fields) {
  return [...fields].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
}

export function normalizeSchema(item) {
  return {
    id: item.id,
    schema_key: item.schema_key ?? item.key ?? '',
    schema_name: item.schema_name ?? item.name ?? '',
    status: item.status ?? (item.is_active ? 'active' : 'inactive'),
    is_active: item.is_active ?? item.status === 'active',
    fields_count: item.fields_count ?? item.fieldsCount ?? 0,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export function extractResponseData(response) {
  return response?.data?.data ?? response?.data ?? {};
}

export function parseSchemaFieldList(data, includeInactive = false) {
  const list = Array.isArray(data) ? data : data?.items || data?.fields || [];
  const mapped = list
    .map(normalizeSchemaField)
    .filter((item) => item.field_key);

  const filtered = includeInactive
    ? mapped
    : mapped.filter((item) => !item.status || item.status === 'active');

  return sortSchemaFields(filtered);
}

export function parseSchemaList(data) {
  const list = Array.isArray(data) ? data : data?.items || data?.schemas || [];
  return list.map(normalizeSchema);
}

export function shouldRequireOptions(inputType) {
  return ['select', 'radio', 'checkbox-group'].includes(String(inputType || '').toLowerCase());
}
