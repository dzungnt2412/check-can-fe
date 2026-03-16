import { useCallback, useEffect, useMemo, useState } from 'react';
import { schemaFieldApi, unitApi } from '../api';
import {
  extractResponseData,
  parseSchemaFieldList,
  sortSchemaFields,
} from '../utils/schemaFieldMapper';

function extractData(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function normalizeUnit(item) {
  return {
    id: item.id,
    unit_code: item.unit_code ?? '',
    project_id: item.project_id ?? '',
    agency_id: item.agency_id ?? '',
    schema_id: item.schema_id ?? '',
    dynamic_data: item.dynamic_data ?? {},
    project_name: item.project_name ?? '',
    agency_name: item.agency_name ?? '',
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export function useUnits() {
  const initialFilters = {
    unit_code: '',
    project_id: '',
    agency_id: '',
    schema_id: '',
  };

  const [units, setUnits] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');

  const [filters, setFilters] = useState(initialFilters);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
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

  function buildListParams(page = pagination.page, limit = pagination.limit, criteria = filters) {
    const raw = {
      page,
      limit,
      ...criteria,
    };

    return Object.entries(raw).reduce((acc, [key, value]) => {
      if (value === '' || value === null || value === undefined) return acc;
      acc[key] = value;
      return acc;
    }, {});
  }

  const fetchUnits = useCallback(async (page = 1, limit = pagination.limit, criteria = filters) => {
    setLoadingList(true);
    setListError('');
    try {
      const params = buildListParams(page, limit, criteria);
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
  }, [fetchSchemaCatalog]);

  useEffect(() => {
    fetchUnits(1, pagination.limit);
  }, [fetchUnits, pagination.limit]);

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
    fetchUnits(1, pagination.limit, filters);
  }

  function resetFilters() {
    setFilters(initialFilters);
    fetchUnits(1, pagination.limit, initialFilters);
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
