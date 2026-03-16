import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fieldCatalogApi, schemaFieldApi, unitApi } from '../api';
import {
  extractResponseData,
  parseSchemaFieldList,
  sortSchemaFields,
} from '../utils/schemaFieldMapper';
import {
  buildUnitListParams,
  buildUnitListSearchParams,
  normalizeCatalogFilters,
  parseUnitListSearchParams,
} from '../utils/unitListQueryParams';

function extractData(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function normalizeUnit(item) {
  return {
    id: item.id,
    unit_code: item.unit_code ?? '',
    agency_id: item.agency_id ?? '',
    schema_id: item.schema_id ?? '',
    dynamic_data: item.dynamic_data ?? {},
    agency_name: item.agency_name ?? '',
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function normalizeCatalogField(item) {
  return {
    id: item.id,
    field_key: item.field_key ?? item.key ?? '',
    field_label: item.field_label ?? item.label ?? item.name ?? item.field_key ?? item.key ?? '',
    status: item.status ?? (item.is_active ? 'active' : 'inactive'),
  };
}

function createCatalogFilterRow(item = {}) {
  return {
    row_id: item.row_id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    catalog_field_id: item.catalog_field_id ?? '',
    catalog_field_key: item.catalog_field_key ?? '',
    value: item.value ?? '',
  };
}

function parseCatalogFieldList(data) {
  const list = Array.isArray(data)
    ? data
    : data?.items || data?.catalogs || data?.fields || [];

  return list
    .map(normalizeCatalogField)
    .filter((item) => item.id && item.field_key)
    .sort((a, b) => String(a.field_label || a.field_key).localeCompare(String(b.field_label || b.field_key), 'vi'));
}

function createEmptyFilters() {
  return {
    unit_code: '',
    agency_id: '',
    schema_id: '',
    catalog_filters: [],
  };
}

export function useUnits() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [initialQuery] = useState(() => parseUnitListSearchParams(searchParams));

  const initialFilters = useMemo(() => ({
    ...createEmptyFilters(),
    ...initialQuery.filters,
    catalog_filters: (initialQuery.filters.catalog_filters || []).map((item) => createCatalogFilterRow(item)),
  }), [initialQuery]);

  const [units, setUnits] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');

  const [filters, setFilters] = useState(initialFilters);
  const [catalogFields, setCatalogFields] = useState([]);
  const [loadingCatalogFields, setLoadingCatalogFields] = useState(false);
  const [catalogFieldError, setCatalogFieldError] = useState('');

  const [pagination, setPagination] = useState({
    page: initialQuery.page,
    limit: initialQuery.limit,
    total: 0,
    totalPages: 1,
  });

  const [view, setView] = useState({ mode: 'list', unitId: null });
  const [detail, setDetail] = useState(null);
  const [schemaFields, setSchemaFields] = useState([]);
  const [allSchemaFields, setAllSchemaFields] = useState([]);
  const [loadingSchemaFields, setLoadingSchemaFields] = useState(false);
  const [schemaError, setSchemaError] = useState('');

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loadingDelete, setLoadingDelete] = useState(false);

  const schemaOptions = useMemo(() => {
    const map = new Map();
    allSchemaFields.forEach((field) => {
      if (!field.schema_id) return;
      if (!map.has(field.schema_id)) {
        const label = field.schema_name
          ? `${field.schema_name} (${field.schema_key || `id:${field.schema_id}`})`
          : `Schema ${field.schema_id}`;

        map.set(field.schema_id, {
          value: Number(field.schema_id),
          label,
        });
      }
    });

    return [...map.values()].sort((a, b) => a.value - b.value);
  }, [allSchemaFields]);

  const fetchSchemaFields = useCallback(async (params = {}, keepInactive = false) => {
    const response = await schemaFieldApi.getAll(params);
    const data = extractResponseData(response);
    return parseSchemaFieldList(data, keepInactive);
  }, []);

  const fetchSchemaCatalog = useCallback(async () => {
    try {
      const fields = await fetchSchemaFields();
      setAllSchemaFields(fields);
    } catch {
      setAllSchemaFields([]);
    }
  }, [fetchSchemaFields]);

  const fetchCatalogFields = useCallback(async () => {
    setLoadingCatalogFields(true);
    setCatalogFieldError('');

    try {
      const response = await fieldCatalogApi.getAll({ include_inactive: true });
      const data = extractResponseData(response);
      const parsed = parseCatalogFieldList(data).filter((item) => item.status === 'active');
      setCatalogFields(parsed);
    } catch (error) {
      setCatalogFields([]);
      setCatalogFieldError(error?.response?.data?.message || 'Tải field catalog thất bại');
    } finally {
      setLoadingCatalogFields(false);
    }
  }, []);

  function buildListParams(page = pagination.page, limit = pagination.limit, criteria = filters) {
    return buildUnitListParams({
      page,
      limit,
      filters: {
        ...criteria,
        catalog_filters: normalizeCatalogFilters(criteria.catalog_filters),
      },
    });
  }

  const fetchUnits = useCallback(async (page = 1, limit = pagination.limit, criteria = filters) => {
    setLoadingList(true);
    setListError('');
    try {
      const params = buildListParams(page, limit, criteria);
      setSearchParams(buildUnitListSearchParams({ page, limit, filters: criteria }), { replace: true });
      const response = await unitApi.getAll(params);
      const data = extractData(response);
      const rows = Array.isArray(data?.data) ? data.data : [];
      setUnits(rows.map(normalizeUnit));
      setPagination({
        page: Number(data?.page || page),
        limit: Number(data?.limit || limit),
        total: Number(data?.total || rows.length),
        totalPages: Number(data?.totalPages || 1),
      });
    } catch (error) {
      setUnits([]);
      setListError(error?.response?.data?.message || 'Tải danh sách units thất bại');
    } finally {
      setLoadingList(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchSchemaCatalog();
    fetchCatalogFields();
  }, [fetchSchemaCatalog, fetchCatalogFields]);

  useEffect(() => {
    fetchUnits(pagination.page, pagination.limit, filters);
  }, [fetchUnits, pagination.limit]);

  const catalogFieldOptions = useMemo(
    () => catalogFields.map((item) => ({
      value: item.field_key,
      label: `${item.field_label || item.field_key} (${item.field_key})`,
    })),
    [catalogFields]
  );

  function resetErrors() {
    setDetailError('');
    setSubmitError('');
    setSchemaError('');
  }

  async function setSchemaFieldsBySchemaId(schemaId, includeInactive = false) {
    if (!schemaId) {
      setSchemaFields([]);
      setSchemaError('');
      return [];
    }

    setLoadingSchemaFields(true);
    setSchemaError('');

    const id = Number(schemaId);
    try {
      const fields = await fetchSchemaFields(
        {
          schema_id: id,
          ...(includeInactive ? { include_inactive: true } : {}),
        },
        includeInactive
      );
      setSchemaFields(fields);
      return fields;
    } catch (error) {
      setSchemaFields([]);
      setSchemaError(error?.response?.data?.message || 'Tải schema fields thất bại');
      return [];
    } finally {
      setLoadingSchemaFields(false);
    }
  }

  async function openCreate() {
    resetErrors();
    setDetail(null);
    setSchemaFields([]);
    setView({ mode: 'create', unitId: null });
  }

  async function openDetail(id) {
    setLoadingDetail(true);
    resetErrors();
    setView({ mode: 'detail', unitId: id });

    try {
      const response = await unitApi.getDetail(id);
      const data = extractData(response);
      const unit = normalizeUnit(data?.unit || data);
      const detailFields = Array.isArray(data?.schema_fields)
        ? parseSchemaFieldList(data.schema_fields)
        : [];

      setDetail(unit);
      setSchemaFields(detailFields.length ? sortSchemaFields(detailFields) : []);

      if (!detailFields.length && unit.schema_id) {
        await setSchemaFieldsBySchemaId(unit.schema_id);
      }
      return { ok: true };
    } catch (error) {
      setDetail(null);
      setSchemaFields([]);
      setDetailError(error?.response?.data?.message || 'Tải chi tiết unit thất bại');
      return { ok: false };
    } finally {
      setLoadingDetail(false);
    }
  }

  async function openEdit(id) {
    const result = await openDetail(id);
    if (result.ok) {
      setView({ mode: 'edit', unitId: id });
    }
  }

  function backToList() {
    setView({ mode: 'list', unitId: null });
    setDetail(null);
    setSchemaFields([]);
    resetErrors();
  }

  function applyFilters() {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUnits(1, pagination.limit, filters);
  }

  function resetFilters() {
    const emptyFilters = createEmptyFilters();
    setFilters(emptyFilters);
    fetchUnits(1, pagination.limit, emptyFilters);
  }

  function updateFilter(key, value) {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => ({ ...prev, [key]: value ?? '' }));
  }

  function addCatalogFilter() {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => ({
      ...prev,
      catalog_filters: [...(prev.catalog_filters || []), createCatalogFilterRow()],
    }));
  }

  function updateCatalogFilter(rowId, patch) {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => ({
      ...prev,
      catalog_filters: (prev.catalog_filters || []).map((item) => {
        if (item.row_id !== rowId) return item;

        if (Object.prototype.hasOwnProperty.call(patch, 'catalog_field_key')) {
          return {
            ...item,
            ...patch,
            catalog_field_id: '',
          };
        }

        return { ...item, ...patch };
      }),
    }));
  }

  function removeCatalogFilter(rowId) {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => ({
      ...prev,
      catalog_filters: (prev.catalog_filters || []).filter((item) => item.row_id !== rowId),
    }));
  }

  async function submitCreate(payload) {
    setLoadingSubmit(true);
    setSubmitError('');
    try {
      await unitApi.create(payload);
      backToList();
      await fetchUnits(1, pagination.limit);
      return { ok: true };
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Tạo unit thất bại');
      return { ok: false };
    } finally {
      setLoadingSubmit(false);
    }
  }

  async function submitUpdate(id, payload) {
    setLoadingSubmit(true);
    setSubmitError('');
    try {
      await unitApi.update(id, payload);
      backToList();
      await fetchUnits(1, pagination.limit);
      return { ok: true };
    } catch (error) {
      setSubmitError(error?.response?.data?.message || 'Cập nhật unit thất bại');
      return { ok: false };
    } finally {
      setLoadingSubmit(false);
    }
  }

  async function removeUnit(id) {
    setLoadingDelete(true);
    setListError('');
    try {
      await unitApi.delete(id);
      await fetchUnits(pagination.page, pagination.limit);
      return { ok: true };
    } catch (error) {
      setListError(error?.response?.data?.message || 'Xóa unit thất bại');
      return { ok: false };
    } finally {
      setLoadingDelete(false);
    }
  }

  return {
    units,
    loadingList,
    listError,
    filters,
    setFilters,
    updateFilter,
    addCatalogFilter,
    updateCatalogFilter,
    removeCatalogFilter,
    catalogFieldOptions,
    loadingCatalogFields,
    catalogFieldError,
    pagination,
    view,
    detail,
    schemaFields,
    allSchemaFields,
    schemaOptions,
    loadingSchemaFields,
    schemaError,
    loadingDetail,
    detailError,
    loadingSubmit,
    submitError,
    loadingDelete,
    fetchUnits,
    openCreate,
    openDetail,
    openEdit,
    backToList,
    applyFilters,
    resetFilters,
    setSchemaFieldsBySchemaId,
    submitCreate,
    submitUpdate,
    removeUnit,
  };
}
