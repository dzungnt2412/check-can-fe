import { useCallback, useEffect, useMemo, useState } from 'react';
import { fieldCatalogApi, schemaApi, schemaFieldApi } from '../api';
import {
  extractResponseData,
  normalizeSchema,
  parseSchemaList,
} from '../utils/schemaFieldMapper';
import { parseOptionsInput } from '../utils/unitDynamicValidation';

const FIELD_KEY_REGEX = /^[a-z0-9_-]+$/;

function normalizeStatus(value, fallback = 'active') {
  return value || fallback;
}

function parseOptionsValue(value) {
  if (value === null || value === undefined || value === '') return null;

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number') {
          const text = String(item).trim();
          return { label: text, value: text };
        }

        const label = String(item?.label ?? item?.value ?? '').trim();
        const val = String(item?.value ?? item?.label ?? '').trim();
        if (!label && !val) return null;
        return { label: label || val, value: val || label };
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      return parseOptionsValue(parsed);
    } catch {
      return text
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => ({ label: item, value: item }));
    }
  }

  return null;
}

function optionsToText(options) {
  if (!options || !options.length) return '';
  return JSON.stringify(options, null, 2);
}

function parseCatalogList(data) {
  const list = Array.isArray(data)
    ? data
    : data?.items || data?.catalogs || data?.fields || [];

  return list.map((item) => ({
    id: item.id,
    field_key: item.field_key ?? item.key ?? '',
    field_label: item.field_label ?? item.label ?? item.name ?? '',
    data_type: item.data_type ?? 'string',
    input_type: item.input_type ?? 'text',
    options: parseOptionsValue(item.options),
    status: normalizeStatus(item.status, item.is_active ? 'active' : 'inactive'),
    is_active: item.is_active ?? item.status === 'active',
    raw: item,
  }));
}

function parseSchemaFieldList(data) {
  const list = Array.isArray(data)
    ? data
    : data?.items || data?.schemaFields || data?.fields || [];

  return list
    .map((item) => {
      const catalog = item.field_catalog || item.catalog_field || item.catalog || {};
      return {
        id: item.id,
        schema_id: item.schema_id ?? item.schemaId,
        catalog_field_id:
          item.catalog_field_id
          ?? item.field_catalog_id
          ?? item.catalogFieldId
          ?? catalog.id,
        field_key:
          item.field_key
          ?? item.schema_field_key
          ?? catalog.field_key
          ?? catalog.key
          ?? '',
        field_label:
          item.field_label
          ?? item.schema_field_label
          ?? catalog.field_label
          ?? catalog.label
          ?? '',
        data_type: item.data_type ?? catalog.data_type ?? 'string',
        input_type: item.input_type ?? catalog.input_type ?? 'text',
        required: Boolean(item.required),
        default_value: item.default_value ?? null,
        options: parseOptionsValue(item.options),
        sort_order: item.sort_order ?? 999,
        status: normalizeStatus(item.status, item.is_active ? 'active' : 'inactive'),
        is_active: item.is_active ?? item.status === 'active',
      };
    })
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
}

function parseOptionsFromForm(optionsText) {
  if (!optionsText || !String(optionsText).trim()) {
    return { ok: true, options: null };
  }

  const parsed = parseOptionsInput(optionsText);
  if (!parsed.ok) {
    return { ok: false, message: parsed.message };
  }

  if (!Array.isArray(parsed.options)) {
    return { ok: false, message: 'options phải là array hoặc null' };
  }

  return { ok: true, options: parsed.options.length ? parsed.options : null };
}

function normalizeSchemaPayload(values) {
  return {
    schema_key: values.schema_key?.trim(),
    schema_name: values.schema_name?.trim(),
    status: values.status || 'active',
  };
}

function normalizeCatalogPayload(values, parsedOptions) {
  return {
    field_key: values.field_key?.trim(),
    field_label: values.field_label?.trim(),
    data_type: values.data_type,
    input_type: values.input_type,
    options: parsedOptions,
    status: values.status || 'active',
  };
}

function normalizeAttachPayload(values) {
  return {
    schema_id: Number(values.schema_id),
    catalog_field_id: Number(values.catalog_field_id),
    required: Boolean(values.required),
    default_value: values.default_value === '' ? null : (values.default_value ?? null),
    options: values.options,
    sort_order: Number(values.sort_order || 0),
    status: values.status || 'active',
  };
}

export function useSchemaManagement() {
  const [schemas, setSchemas] = useState([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState(null);

  const [fieldCatalogs, setFieldCatalogs] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');

  const [schemaFields, setSchemaFields] = useState([]);
  const [includeInactive, setIncludeInactive] = useState(true);

  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [loadingSubmitSchema, setLoadingSubmitSchema] = useState(false);
  const [loadingSubmitCatalog, setLoadingSubmitCatalog] = useState(false);
  const [loadingAttachField, setLoadingAttachField] = useState(false);
  const [loadingSubmitField, setLoadingSubmitField] = useState(false);
  const [loadingReorder, setLoadingReorder] = useState(false);

  const [schemaError, setSchemaError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [fieldError, setFieldError] = useState('');

  const selectedSchema = useMemo(
    () => schemas.find((item) => String(item.id) === String(selectedSchemaId)),
    [schemas, selectedSchemaId]
  );

  const filteredCatalogs = useMemo(() => {
    const keyword = String(catalogSearch || '').trim().toLowerCase();
    if (!keyword) return fieldCatalogs;

    return fieldCatalogs.filter((item) =>
      String(item.field_key || '').toLowerCase().includes(keyword)
      || String(item.field_label || '').toLowerCase().includes(keyword)
    );
  }, [fieldCatalogs, catalogSearch]);

  const fetchSchemas = useCallback(async () => {
    setLoadingSchemas(true);
    setSchemaError('');
    try {
      const response = await schemaApi.getAll();
      const data = extractResponseData(response);
      const parsed = parseSchemaList(data).map(normalizeSchema);
      setSchemas(parsed);

      if (!selectedSchemaId && parsed.length) {
        setSelectedSchemaId(parsed[0].id);
      } else if (selectedSchemaId && !parsed.find((item) => String(item.id) === String(selectedSchemaId))) {
        setSelectedSchemaId(parsed[0]?.id || null);
      }
    } catch (error) {
      setSchemas([]);
      setSchemaError(error?.response?.data?.message || 'Tải schema thất bại');
    } finally {
      setLoadingSchemas(false);
    }
  }, [selectedSchemaId]);

  const fetchCatalogs = useCallback(async () => {
    setLoadingCatalogs(true);
    setCatalogError('');
    try {
      const response = await fieldCatalogApi.getAll({ include_inactive: true });
      const data = extractResponseData(response);
      setFieldCatalogs(parseCatalogList(data));
    } catch (error) {
      setFieldCatalogs([]);
      setCatalogError(error?.response?.data?.message || 'Tải field catalog thất bại');
    } finally {
      setLoadingCatalogs(false);
    }
  }, []);

  const fetchSchemaFields = useCallback(async (schemaId = selectedSchemaId, showInactive = includeInactive) => {
    if (!schemaId) {
      setSchemaFields([]);
      return;
    }

    setLoadingFields(true);
    setFieldError('');
    try {
      const response = await schemaFieldApi.getAll({
        schema_id: schemaId,
        ...(showInactive ? { include_inactive: true } : {}),
      });
      const data = extractResponseData(response);
      const parsed = parseSchemaFieldList(data);
      setSchemaFields(showInactive ? parsed : parsed.filter((item) => item.status === 'active'));
    } catch (error) {
      setSchemaFields([]);
      setFieldError(error?.response?.data?.message || 'Tải fields của schema thất bại');
    } finally {
      setLoadingFields(false);
    }
  }, [selectedSchemaId, includeInactive]);

  useEffect(() => {
    fetchSchemas();
    fetchCatalogs();
  }, [fetchSchemas, fetchCatalogs]);

  useEffect(() => {
    fetchSchemaFields();
  }, [fetchSchemaFields, selectedSchemaId, includeInactive]);

  async function createSchema(values) {
    setLoadingSubmitSchema(true);
    setSchemaError('');
    try {
      const response = await schemaApi.create(normalizeSchemaPayload(values));
      await fetchSchemas();
      return { ok: true, message: response?.data?.message || 'Tạo schema thành công' };
    } catch (error) {
      const message = error?.response?.data?.message || 'Tạo schema thất bại';
      setSchemaError(message);
      return { ok: false, message };
    } finally {
      setLoadingSubmitSchema(false);
    }
  }

  async function updateSchema(id, values) {
    setLoadingSubmitSchema(true);
    setSchemaError('');
    try {
      const response = await schemaApi.update(id, normalizeSchemaPayload(values));
      await fetchSchemas();
      return { ok: true, message: response?.data?.message || 'Cập nhật schema thành công' };
    } catch (error) {
      const message = error?.response?.data?.message || 'Cập nhật schema thất bại';
      setSchemaError(message);
      return { ok: false, message };
    } finally {
      setLoadingSubmitSchema(false);
    }
  }

  async function removeSchema(id) {
    setLoadingSubmitSchema(true);
    setSchemaError('');
    try {
      const response = await schemaApi.delete(id);
      await fetchSchemas();
      if (String(selectedSchemaId) === String(id)) {
        setSelectedSchemaId(null);
      }
      return { ok: true, message: response?.data?.message || 'Xóa schema thành công' };
    } catch (error) {
      const message = error?.response?.data?.message || 'Xóa schema thất bại';
      setSchemaError(message);
      return { ok: false, message };
    } finally {
      setLoadingSubmitSchema(false);
    }
  }

  async function createCatalogField(values) {
    const fieldKey = String(values.field_key || '').trim();
    if (!FIELD_KEY_REGEX.test(fieldKey)) {
      return { ok: false, message: 'field_key chỉ cho phép a-z, 0-9, _ và -' };
    }

    const optionsResult = parseOptionsFromForm(values.optionsText);
    if (!optionsResult.ok) {
      return { ok: false, message: optionsResult.message };
    }

    setLoadingSubmitCatalog(true);
    setCatalogError('');
    try {
      const payload = normalizeCatalogPayload(values, optionsResult.options);
      const response = await fieldCatalogApi.create(payload);
      await fetchCatalogs();
      return { ok: true, message: response?.data?.message || 'Tạo field catalog thành công' };
    } catch (error) {
      const message = error?.response?.data?.message || 'Tạo field catalog thất bại';
      setCatalogError(message);
      return { ok: false, message };
    } finally {
      setLoadingSubmitCatalog(false);
    }
  }

  async function updateCatalogField(id, values) {
    const fieldKey = String(values.field_key || '').trim();
    if (!FIELD_KEY_REGEX.test(fieldKey)) {
      return { ok: false, message: 'field_key chỉ cho phép a-z, 0-9, _ và -' };
    }

    const optionsResult = parseOptionsFromForm(values.optionsText);
    if (!optionsResult.ok) {
      return { ok: false, message: optionsResult.message };
    }

    setLoadingSubmitCatalog(true);
    setCatalogError('');
    try {
      const payload = normalizeCatalogPayload(values, optionsResult.options);
      const response = await fieldCatalogApi.update(id, payload);
      await fetchCatalogs();
      return { ok: true, message: response?.data?.message || 'Cập nhật field catalog thành công' };
    } catch (error) {
      const message = error?.response?.data?.message || 'Cập nhật field catalog thất bại';
      setCatalogError(message);
      return { ok: false, message };
    } finally {
      setLoadingSubmitCatalog(false);
    }
  }

  async function removeCatalogField(id) {
    setLoadingSubmitCatalog(true);
    setCatalogError('');
    try {
      const response = await fieldCatalogApi.delete(id);
      await fetchCatalogs();
      return { ok: true, message: response?.data?.message || 'Xóa field catalog thành công' };
    } catch (error) {
      const message = error?.response?.data?.message || 'Xóa field catalog thất bại';
      setCatalogError(message);
      return { ok: false, message };
    } finally {
      setLoadingSubmitCatalog(false);
    }
  }

  async function attachCatalogToSchema(values) {
    if (!selectedSchemaId) {
      return { ok: false, message: 'Vui lòng chọn schema' };
    }

    const optionsResult = parseOptionsFromForm(values.optionsText);
    if (!optionsResult.ok) {
      return { ok: false, message: optionsResult.message };
    }

    const attachPayload = normalizeAttachPayload({
      ...values,
      schema_id: selectedSchemaId,
      options: optionsResult.options,
    });

    setLoadingAttachField(true);
    setFieldError('');

    try {
      const response = await schemaFieldApi.attach(attachPayload);
      await fetchSchemaFields(selectedSchemaId, includeInactive);
      return { ok: true, message: response?.data?.message || 'Attach field vào schema thành công' };
    } catch (attachError) {
      const statusCode = attachError?.response?.status;
      if (statusCode !== 404 && statusCode !== 405) {
        const message = attachError?.response?.data?.message || 'Attach field thất bại';
        setFieldError(message);
        return { ok: false, message };
      }

      try {
        const catalog = fieldCatalogs.find((item) => String(item.id) === String(attachPayload.catalog_field_id));
        if (!catalog) {
          return { ok: false, message: 'Không tìm thấy field catalog để fallback' };
        }

        const fallbackPayload = {
          schema_id: attachPayload.schema_id,
          field_key: catalog.field_key,
          field_label: catalog.field_label,
          data_type: catalog.data_type,
          input_type: catalog.input_type,
          required: attachPayload.required,
          default_value: attachPayload.default_value,
          options: attachPayload.options,
          sort_order: attachPayload.sort_order,
          status: attachPayload.status,
        };

        const response = await schemaFieldApi.create(fallbackPayload);
        await fetchSchemaFields(selectedSchemaId, includeInactive);
        return { ok: true, message: response?.data?.message || 'Attach field thành công (fallback)' };
      } catch (fallbackError) {
        const message = fallbackError?.response?.data?.message || 'Attach field thất bại';
        setFieldError(message);
        return { ok: false, message };
      }
    } finally {
      setLoadingAttachField(false);
    }
  }

  async function updateSchemaField(id, values) {
    const optionsResult = parseOptionsFromForm(values.optionsText);
    if (!optionsResult.ok) {
      return { ok: false, message: optionsResult.message };
    }

    setLoadingSubmitField(true);
    setFieldError('');
    try {
      const payload = {
        required: Boolean(values.required),
        default_value: values.default_value === '' ? null : (values.default_value ?? null),
        options: optionsResult.options,
        sort_order: Number(values.sort_order || 0),
        status: values.status || 'active',
      };

      const response = await schemaFieldApi.update(id, payload);
      await fetchSchemaFields(selectedSchemaId, includeInactive);
      return { ok: true, message: response?.data?.message || 'Cập nhật schema field thành công' };
    } catch (error) {
      const message = error?.response?.data?.message || 'Cập nhật schema field thất bại';
      setFieldError(message);
      return { ok: false, message };
    } finally {
      setLoadingSubmitField(false);
    }
  }

  async function removeSchemaField(id) {
    setLoadingSubmitField(true);
    setFieldError('');
    try {
      const response = await schemaFieldApi.delete(id);
      await fetchSchemaFields(selectedSchemaId, includeInactive);
      return { ok: true, message: response?.data?.message || 'Xóa schema field thành công' };
    } catch (error) {
      const message = error?.response?.data?.message || 'Xóa schema field thất bại';
      setFieldError(message);
      return { ok: false, message };
    } finally {
      setLoadingSubmitField(false);
    }
  }

  async function moveSchemaField(id, direction) {
    const currentIndex = schemaFields.findIndex((item) => String(item.id) === String(id));
    if (currentIndex < 0) {
      return { ok: false, message: 'Không tìm thấy field cần đổi thứ tự' };
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= schemaFields.length) {
      return { ok: false, message: '' };
    }

    const current = schemaFields[currentIndex];
    const target = schemaFields[targetIndex];

    setLoadingReorder(true);
    setFieldError('');
    try {
      await schemaFieldApi.update(current.id, { sort_order: target.sort_order });
      await schemaFieldApi.update(target.id, { sort_order: current.sort_order });
      await fetchSchemaFields(selectedSchemaId, includeInactive);
      return { ok: true };
    } catch (error) {
      const message = error?.response?.data?.message || 'Đổi thứ tự field thất bại';
      setFieldError(message);
      return { ok: false, message };
    } finally {
      setLoadingReorder(false);
    }
  }

  return {
    schemas,
    selectedSchemaId,
    selectedSchema,
    setSelectedSchemaId,

    fieldCatalogs,
    filteredCatalogs,
    catalogSearch,
    setCatalogSearch,

    schemaFields,
    includeInactive,
    setIncludeInactive,

    loadingSchemas,
    loadingCatalogs,
    loadingFields,
    loadingSubmitSchema,
    loadingSubmitCatalog,
    loadingAttachField,
    loadingSubmitField,
    loadingReorder,

    schemaError,
    catalogError,
    fieldError,

    fetchSchemas,
    fetchCatalogs,
    fetchSchemaFields,

    createSchema,
    updateSchema,
    removeSchema,

    createCatalogField,
    updateCatalogField,
    removeCatalogField,

    attachCatalogToSchema,
    updateSchemaField,
    removeSchemaField,
    moveSchemaField,

    optionsToText,
  };
}
