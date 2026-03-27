import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fieldCatalogApi, schemaFieldApi, unitApi, unitDisplayConfigApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
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

function normalizeProjectNames(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === 'object') {
          return String(item.project_name || item.name || '').trim();
        }
        return String(item || '').trim();
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeProjectIds(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function normalizeUnit(item) {
  const projectNames = normalizeProjectNames(item.project_names);

  return {
    id: item.id,
    unit_code: item.unit_code ?? '',
    agency_id: item.agency_id ?? '',
    schema_id: item.schema_id ?? '',
    dynamic_data: item.dynamic_data ?? {},
    agency_name: item.agency_name ?? '',
    project_names: projectNames,
    project_names_text: projectNames.join(', '),
    project_ids: normalizeProjectIds(item.project_ids),
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function normalizeCatalogField(item) {
  return {
    id: item.id,
    field_key: item.field_key ?? item.key ?? '',
    field_label: item.field_label ?? item.label ?? item.name ?? item.field_key ?? item.key ?? '',
    sort_order: Number(item.sort_order ?? 9999),
    status: item.status ?? (item.is_active ? 'active' : 'inactive'),
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

function createCatalogFilterRow(item = {}) {
  return {
    row_id: item.row_id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    catalog_field_id: item.catalog_field_id ?? '',
    catalog_field_key: item.catalog_field_key ?? '',
    value: item.value ?? '',
  };
}

function createDisplayConfigItemRow(item = {}) {
  return {
    row_id: item.row_id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    catalog_field_id: item.catalog_field_id ?? '',
    catalog_field_key: item.catalog_field_key ?? '',
    is_visible: item.is_visible ?? true,
    sort_order: item.sort_order ?? '',
    bg_color: item.bg_color ?? '',
    text_color: item.text_color ?? '',
  };
}

function createPrimarySortFilterRow(item = {}) {
  return {
    row_id: item.row_id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    catalog_field_id: item.catalog_field_id ?? '',
    catalog_field_key: item.catalog_field_key ?? '',
    sort_direction: item.sort_direction === 'desc' ? 'desc' : 'asc',
    label: item.label ?? '',
    sort_order: item.sort_order ?? '',
    is_active: item.is_active !== false,
  };
}

function createCatalogFilterSelectOptionRow(item = {}) {
  return {
    row_id: item.row_id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    option_label: item.option_label ?? '',
    option_value: item.option_value ?? '',
    sort_order: item.sort_order ?? '',
    range_min: item.range_min ?? null,
    range_max: item.range_max ?? null,
  };
}

function createCatalogFilterConfigRow(item = {}) {
  return {
    row_id: item.row_id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    catalog_field_id: item.catalog_field_id ?? '',
    catalog_field_key: item.catalog_field_key ?? '',
    filter_type: item.filter_type === 'select' ? 'select' : 'input',
    label: item.label ?? '',
    placeholder: item.placeholder ?? '',
    sort_order: item.sort_order ?? '',
    is_active: item.is_active !== false,
    select_options: Array.isArray(item.select_options)
      ? item.select_options.map((option) => createCatalogFilterSelectOptionRow(option))
      : [],
  };
}

function createVisibilityRuleRow(item = {}) {
  return {
    row_id: item.row_id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    catalog_field_id: item.catalog_field_id ?? '',
    catalog_field_key: item.catalog_field_key ?? '',
    operator: item.operator || 'eq',
    compare_value: item.compare_value ?? '',
    effect: item.effect || 'hide',
    sort_order: item.sort_order ?? '',
  };
}

function normalizeDisplayCatalogList(data) {
  const list = Array.isArray(data)
    ? data
    : data?.items || data?.display_catalogs || data?.display_configs || [];

  return list.map((item, index) => ({
    catalog_field_id: item.catalog_field_id ?? '',
    catalog_field_key: item.catalog_field_key ?? '',
    is_visible: item.is_visible ?? true,
    sort_order: Number(item.sort_order ?? index + 1),
    bg_color: item.bg_color ?? '',
    text_color: item.text_color ?? '',
  }));
}

function normalizeVisibilityRules(data) {
  const list = Array.isArray(data)
    ? data
    : data?.visibility_rules || [];

  return list.map((item, index) => ({
    catalog_field_id: item.catalog_field_id ?? '',
    catalog_field_key: item.catalog_field_key ?? '',
    operator: item.operator === 'neq' ? 'neq' : 'eq',
    compare_value: item.compare_value ?? '',
    effect: item.effect === 'show' ? 'show' : 'hide',
    sort_order: Number(item.sort_order ?? index + 1),
  }));
}

function normalizePrimarySortFilters(data) {
  const list = Array.isArray(data)
    ? data
    : data?.primary_sort_filters || [];

  return list.map((item, index) => ({
    catalog_field_id: item.catalog_field_id ?? '',
    catalog_field_key: item.catalog_field_key ?? '',
    sort_direction: item.sort_direction === 'desc' ? 'desc' : 'asc',
    label: item.label ?? '',
    sort_order: Number(item.sort_order ?? index + 1),
    is_active: item.is_active !== false,
  }));
}

function normalizeCatalogFilterConfigs(data) {
  const list = Array.isArray(data)
    ? data
    : data?.catalog_filter_configs || [];

  return list.map((item, index) => ({
    catalog_field_id: item.catalog_field_id ?? '',
    catalog_field_key: item.catalog_field_key ?? '',
    filter_type: item.filter_type === 'select' ? 'select' : 'input',
    label: item.label ?? '',
    placeholder: item.placeholder ?? '',
    sort_order: Number(item.sort_order ?? index + 1),
    is_active: item.is_active !== false,
    select_options: Array.isArray(item.select_options)
      ? item.select_options
        .map((option, optionIndex) => ({
          option_label: option.option_label ?? '',
          option_value: option.option_value ?? '',
          sort_order: Number(option.sort_order ?? optionIndex + 1),
          range_min: option.range_min ?? null,
          range_max: option.range_max ?? null,
        }))
        .sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999))
      : [],
  }));
}

function normalizeActiveSort(item) {
  if (!item || typeof item !== 'object') return null;
  const catalog_field_key = String(item.catalog_field_key || item.sort_field_key || '').trim();
  const sort_direction = item.sort_direction === 'desc' ? 'desc' : 'asc';

  if (!catalog_field_key) return null;
  return {
    catalog_field_key,
    sort_direction,
    label: String(item.label || '').trim(),
  };
}

function parseSortOrder(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function reindexSortOrder(items = []) {
  return items.map((item, index) => ({
    ...item,
    sort_order: index + 1,
  }));
}

function normalizeStringValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeNullableNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveCatalogFieldIdentity(item, catalogFieldMapById) {
  const key = String(item?.catalog_field_key || '').trim();
  if (key) return `key:${key.toLowerCase()}`;

  const rawId = item?.catalog_field_id;
  if (rawId === undefined || rawId === null || String(rawId).trim() === '') return '';

  const normalizedId = String(rawId).trim();
  const resolvedKey = String(catalogFieldMapById?.get(normalizedId)?.field_key || '').trim();
  if (resolvedKey) return `key:${resolvedKey.toLowerCase()}`;

  return `id:${normalizedId}`;
}

function createEmptyFilters() {
  return {
    ma_can: '',
    project_id: '',
    agency_id: '',
    schema_id: '',
    catalog_filters: [],
    sort_field_key: '',
    sort_direction: '',
  };
}

export function useUnits() {
  const { role } = useAuth();
  const isSuperAdmin = role === 'super_admin';
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

  const [displayCatalogsFromList, setDisplayCatalogsFromList] = useState([]);
  const [visibilityRulesFromList, setVisibilityRulesFromList] = useState([]);
  const [primarySortFiltersFromList, setPrimarySortFiltersFromList] = useState([]);
  const [catalogFilterConfigsFromList, setCatalogFilterConfigsFromList] = useState([]);
  const [activeSortFromList, setActiveSortFromList] = useState(null);
  const [visibleCountFromList, setVisibleCountFromList] = useState(0);

  const [configRole, setConfigRole] = useState('sale');
  const [displayConfigItems, setDisplayConfigItems] = useState([]);
  const [visibilityRuleItems, setVisibilityRuleItems] = useState([]);
  const [primarySortFilterItems, setPrimarySortFilterItems] = useState([]);
  const [catalogFilterConfigItems, setCatalogFilterConfigItems] = useState([]);
  const [loadingDisplayConfig, setLoadingDisplayConfig] = useState(false);
  const [savingDisplayConfig, setSavingDisplayConfig] = useState(false);
  const [displayConfigError, setDisplayConfigError] = useState('');
  const [displayConfigSuccess, setDisplayConfigSuccess] = useState('');

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

  const catalogFieldMapById = useMemo(() => {
    const map = new Map();
    catalogFields.forEach((field) => {
      if (!field.id) return;
      map.set(String(field.id), field);
    });
    return map;
  }, [catalogFields]);

  useEffect(() => {
    if (!catalogFieldMapById.size) return;

    setDisplayConfigItems((prev) => {
      let changed = false;
      const next = (prev || []).map((item) => {
        if (item.catalog_field_key || !item.catalog_field_id) return item;
        const catalog = catalogFieldMapById.get(String(item.catalog_field_id));
        const fieldKey = catalog?.field_key || '';
        if (!fieldKey) return item;
        changed = true;
        return { ...item, catalog_field_key: fieldKey };
      });
      return changed ? next : prev;
    });

    setVisibilityRuleItems((prev) => {
      let changed = false;
      const next = (prev || []).map((item) => {
        if (item.catalog_field_key || !item.catalog_field_id) return item;
        const catalog = catalogFieldMapById.get(String(item.catalog_field_id));
        const fieldKey = catalog?.field_key || '';
        if (!fieldKey) return item;
        changed = true;
        return { ...item, catalog_field_key: fieldKey };
      });
      return changed ? next : prev;
    });

    setPrimarySortFilterItems((prev) => {
      let changed = false;
      const next = (prev || []).map((item) => {
        if (item.catalog_field_key || !item.catalog_field_id) return item;
        const catalog = catalogFieldMapById.get(String(item.catalog_field_id));
        const fieldKey = catalog?.field_key || '';
        if (!fieldKey) return item;
        changed = true;
        return { ...item, catalog_field_key: fieldKey };
      });
      return changed ? next : prev;
    });

    setCatalogFilterConfigItems((prev) => {
      let changed = false;
      const next = (prev || []).map((item) => {
        if (item.catalog_field_key || !item.catalog_field_id) return item;
        const catalog = catalogFieldMapById.get(String(item.catalog_field_id));
        const fieldKey = catalog?.field_key || '';
        if (!fieldKey) return item;
        changed = true;
        return { ...item, catalog_field_key: fieldKey };
      });
      return changed ? next : prev;
    });
  }, [catalogFieldMapById, displayConfigItems, visibilityRuleItems]);

  const catalogFieldOptions = useMemo(
    () => catalogFields.map((item) => ({
      value: item.field_key,
      label: `${item.field_label || item.field_key} (${item.field_key})`,
    })),
    [catalogFields]
  );

  const resolvedDisplayCatalogs = useMemo(() => {
    return (displayCatalogsFromList || [])
      .map((item, index) => {
        const catalog = item.catalog_field_id
          ? catalogFieldMapById.get(String(item.catalog_field_id))
          : null;

        const fieldKey = item.catalog_field_key || catalog?.field_key || '';
        return {
          ...item,
          catalog_field_key: fieldKey,
          field_label: catalog?.field_label || fieldKey,
          sort_order: Number(item.sort_order ?? index + 1),
          is_visible: item.is_visible !== false,
        };
      })
      .filter((item) => item.catalog_field_key)
      .sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999));
  }, [displayCatalogsFromList, catalogFieldMapById]);

  const visibleDisplayCatalogs = useMemo(
    () => resolvedDisplayCatalogs.filter((item) => item.is_visible !== false),
    [resolvedDisplayCatalogs]
  );

  const visibleDisplayFieldKeys = useMemo(
    () => visibleDisplayCatalogs.map((item) => item.catalog_field_key),
    [visibleDisplayCatalogs]
  );

  const filterCatalogFieldOptions = useMemo(() => {
    if (!visibleDisplayFieldKeys.length) return catalogFieldOptions;
    const allowed = new Set(visibleDisplayFieldKeys);
    return catalogFieldOptions.filter((item) => allowed.has(item.value));
  }, [catalogFieldOptions, visibleDisplayFieldKeys]);

  const resolvedVisibilityRules = useMemo(() => {
    return (visibilityRulesFromList || [])
      .map((item, index) => {
        const catalog = item.catalog_field_id
          ? catalogFieldMapById.get(String(item.catalog_field_id))
          : null;

        return {
          ...item,
          catalog_field_key: item.catalog_field_key || catalog?.field_key || '',
          operator: item.operator === 'neq' ? 'neq' : 'eq',
          effect: item.effect === 'show' ? 'show' : 'hide',
          compare_value: String(item.compare_value ?? ''),
          sort_order: Number(item.sort_order ?? index + 1),
        };
      })
      .filter((item) => item.catalog_field_key && item.compare_value)
      .sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999));
  }, [visibilityRulesFromList, catalogFieldMapById]);

  const resolvedPrimarySortFilters = useMemo(() => {
    return (primarySortFiltersFromList || [])
      .map((item, index) => {
        const catalog = item.catalog_field_id
          ? catalogFieldMapById.get(String(item.catalog_field_id))
          : null;

        return {
          ...item,
          catalog_field_key: item.catalog_field_key || catalog?.field_key || '',
          label: item.label || catalog?.field_label || item.catalog_field_key || '',
          sort_direction: item.sort_direction === 'desc' ? 'desc' : 'asc',
          sort_order: Number(item.sort_order ?? index + 1),
          is_active: item.is_active !== false,
        };
      })
      .filter((item) => item.catalog_field_key && item.is_active !== false)
      .sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999));
  }, [primarySortFiltersFromList, catalogFieldMapById]);

  const resolvedCatalogFilterConfigs = useMemo(() => {
    return (catalogFilterConfigsFromList || [])
      .map((item, index) => {
        const catalog = item.catalog_field_id
          ? catalogFieldMapById.get(String(item.catalog_field_id))
          : null;

        const filterType = item.filter_type === 'select' ? 'select' : 'input';
        const selectOptions = Array.isArray(item.select_options)
          ? item.select_options
            .map((option, optionIndex) => ({
              option_label: String(option.option_label || '').trim(),
              option_value: String(option.option_value || '').trim(),
              sort_order: Number(option.sort_order ?? optionIndex + 1),
              range_min: normalizeNullableNumber(option.range_min),
              range_max: normalizeNullableNumber(option.range_max),
            }))
            .filter((option) => option.option_value)
            .sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999))
          : [];

        return {
          ...item,
          catalog_field_key: item.catalog_field_key || catalog?.field_key || '',
          filter_type: filterType,
          label: item.label || catalog?.field_label || item.catalog_field_key || '',
          placeholder: item.placeholder || '',
          sort_order: Number(item.sort_order ?? index + 1),
          is_active: item.is_active !== false,
          select_options: selectOptions,
        };
      })
      .filter((item) => item.catalog_field_key && item.is_active !== false)
      .sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999));
  }, [catalogFilterConfigsFromList, catalogFieldMapById]);

  const catalogFilterValueMap = useMemo(() => {
    const map = new Map();
    normalizeCatalogFilters(filters.catalog_filters).forEach((item) => {
      const key = String(item.catalog_field_key || '').trim();
      if (!key) return;
      map.set(key, String(item.value || ''));
    });
    return map;
  }, [filters.catalog_filters]);

  const selectedSort = useMemo(() => {
    const sortFieldKey = String(filters.sort_field_key || '').trim();
    const sortDirection = filters.sort_direction === 'desc' ? 'desc' : (filters.sort_direction === 'asc' ? 'asc' : '');
    if (!sortFieldKey || !sortDirection) return null;

    const matched = resolvedPrimarySortFilters.find(
      (item) => item.catalog_field_key === sortFieldKey && item.sort_direction === sortDirection
    );

    return {
      catalog_field_key: sortFieldKey,
      sort_direction: sortDirection,
      label: matched?.label || sortFieldKey,
    };
  }, [filters.sort_field_key, filters.sort_direction, resolvedPrimarySortFilters]);

  const effectiveActiveSort = selectedSort || activeSortFromList;

  const visibleUnits = useMemo(() => {
    if (!resolvedVisibilityRules.length) return units;

    const showRules = resolvedVisibilityRules.filter((item) => item.effect === 'show');
    const hideRules = resolvedVisibilityRules.filter((item) => item.effect === 'hide');

    function matchRule(unit, rule) {
      const currentValue = normalizeStringValue(unit.dynamic_data?.[rule.catalog_field_key]);
      const compareValue = normalizeStringValue(rule.compare_value);
      if (!compareValue) return false;
      if (rule.operator === 'neq') return currentValue !== compareValue;
      return currentValue === compareValue;
    }

    return units.filter((unit) => {
      if (showRules.length > 0) {
        const canShow = showRules.some((rule) => matchRule(unit, rule));
        if (!canShow) return false;
      }

      const shouldHide = hideRules.some((rule) => matchRule(unit, rule));
      if (shouldHide) return false;
      return true;
    });
  }, [units, resolvedVisibilityRules]);

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
      setDisplayCatalogsFromList(normalizeDisplayCatalogList(data?.display_catalogs || []));
      setVisibilityRulesFromList(normalizeVisibilityRules(data?.visibility_rules || []));
      setPrimarySortFiltersFromList(normalizePrimarySortFilters(data?.primary_sort_filters || []));
      setCatalogFilterConfigsFromList(normalizeCatalogFilterConfigs(data?.catalog_filter_configs || []));
      setActiveSortFromList(normalizeActiveSort(data?.active_sort));
      setVisibleCountFromList(Number(data?.visible_count ?? rows.length ?? 0));

      setPagination({
        page: Number(data?.page || page),
        limit: Number(data?.limit || limit),
        total: Number(data?.total || rows.length),
        totalPages: Number(data?.totalPages || 1),
      });
    } catch (error) {
      setUnits([]);
      setDisplayCatalogsFromList([]);
      setVisibilityRulesFromList([]);
      setPrimarySortFiltersFromList([]);
      setCatalogFilterConfigsFromList([]);
      setActiveSortFromList(null);
      setVisibleCountFromList(0);
      setListError(error?.response?.data?.message || 'Tải danh sách units thất bại');
    } finally {
      setLoadingList(false);
    }
  }, [filters, pagination.limit]);

  const fetchDisplayConfigByRole = useCallback(async (role) => {
    setLoadingDisplayConfig(true);
    setDisplayConfigError('');
    setDisplayConfigSuccess('');

    try {
      const response = await unitDisplayConfigApi.getByRole(role);
      const data = extractData(response);

      const items = normalizeDisplayCatalogList(data?.display_configs || data?.display_catalogs || data?.items || []);
      const rules = normalizeVisibilityRules(data?.visibility_rules || []);
      const primarySortFilters = normalizePrimarySortFilters(data?.primary_sort_filters || []);
      const catalogFilterConfigs = normalizeCatalogFilterConfigs(data?.catalog_filter_configs || []);

      setDisplayConfigItems(items.map((item) => createDisplayConfigItemRow(item)));
      setVisibilityRuleItems(rules.map((item) => createVisibilityRuleRow(item)));
      setPrimarySortFilterItems(primarySortFilters.map((item) => createPrimarySortFilterRow(item)));
      setCatalogFilterConfigItems(catalogFilterConfigs.map((item) => createCatalogFilterConfigRow(item)));
      return { ok: true };
    } catch (error) {
      setDisplayConfigItems([]);
      setVisibilityRuleItems([]);
      setPrimarySortFilterItems([]);
      setCatalogFilterConfigItems([]);
      setDisplayConfigError(error?.response?.data?.message || 'Tải cấu hình hiển thị units thất bại');
      return { ok: false };
    } finally {
      setLoadingDisplayConfig(false);
    }
  }, []);

  const saveDisplayConfigByRole = useCallback(async () => {
    setSavingDisplayConfig(true);
    setDisplayConfigError('');
    setDisplayConfigSuccess('');

    try {
      const items = (displayConfigItems || [])
        .map((item, index) => {
          const key = String(item.catalog_field_key || '').trim();
          const id = item.catalog_field_id ? Number(item.catalog_field_id) : null;
          if (!key && !id) return null;

          return {
            ...(id ? { catalog_field_id: id } : {}),
            ...(key ? { catalog_field_key: key } : {}),
            is_visible: item.is_visible !== false,
            sort_order: parseSortOrder(item.sort_order, index + 1),
            ...(String(item.bg_color || '').trim() ? { bg_color: String(item.bg_color).trim() } : {}),
            ...(String(item.text_color || '').trim() ? { text_color: String(item.text_color).trim() } : {}),
          };
        })
        .filter(Boolean);

      const visibility_rules = (visibilityRuleItems || [])
        .map((item, index) => {
          const key = String(item.catalog_field_key || '').trim();
          const id = item.catalog_field_id ? Number(item.catalog_field_id) : null;
          const compare = String(item.compare_value || '').trim();
          if (!compare) return null;
          if (!key && !id) return null;

          return {
            ...(id ? { catalog_field_id: id } : {}),
            ...(key ? { catalog_field_key: key } : {}),
            operator: item.operator === 'neq' ? 'neq' : 'eq',
            compare_value: compare,
            effect: item.effect === 'show' ? 'show' : 'hide',
            sort_order: parseSortOrder(item.sort_order, index + 1),
          };
        })
        .filter(Boolean);

      const primary_sort_filters = (primarySortFilterItems || [])
        .map((item, index) => {
          const key = String(item.catalog_field_key || '').trim();
          const id = item.catalog_field_id ? Number(item.catalog_field_id) : null;
          if (!key && !id) return null;

          const sortDirection = item.sort_direction === 'desc' ? 'desc' : (item.sort_direction === 'asc' ? 'asc' : '');
          if (!sortDirection) {
            throw new Error('Chiều sort chỉ chấp nhận asc hoặc desc');
          }

          return {
            ...(id ? { catalog_field_id: id } : {}),
            ...(key ? { catalog_field_key: key } : {}),
            sort_direction: sortDirection,
            label: String(item.label || '').trim(),
            sort_order: parseSortOrder(item.sort_order, index + 1),
            is_active: item.is_active !== false,
          };
        })
        .filter(Boolean);

      const catalog_filter_configs = (catalogFilterConfigItems || [])
        .map((item, index) => {
          const key = String(item.catalog_field_key || '').trim();
          const id = item.catalog_field_id ? Number(item.catalog_field_id) : null;
          if (!key && !id) return null;

          const filterType = item.filter_type === 'select' ? 'select' : 'input';
          const selectOptions = (item.select_options || [])
            .map((option, optionIndex) => {
              const optionLabel = String(option.option_label || '').trim();
              const optionValue = String(option.option_value || '').trim();
              const sortOrder = parseSortOrder(option.sort_order, optionIndex + 1);

              // Validate and parse range_min and range_max
              let rangeMin = null;
              let rangeMax = null;

              if (option.range_min !== null && option.range_min !== undefined && String(option.range_min).trim() !== '') {
                const parsedMin = Number(String(option.range_min).trim());
                if (isNaN(parsedMin)) {
                  throw new Error(`Option "${optionValue}": range_min phải là số hợp lệ`);
                }
                rangeMin = parsedMin;
              }

              if (option.range_max !== null && option.range_max !== undefined && String(option.range_max).trim() !== '') {
                const parsedMax = Number(String(option.range_max).trim());
                if (isNaN(parsedMax)) {
                  throw new Error(`Option "${optionValue}": range_max phải là số hợp lệ`);
                }
                rangeMax = parsedMax;
              }

              // Validate range_min <= range_max
              if (rangeMin !== null && rangeMax !== null && rangeMin > rangeMax) {
                throw new Error(`Option "${optionValue}": range_min không được lớn hơn range_max`);
              }

              return {
                option_label: optionLabel,
                option_value: optionValue,
                sort_order: sortOrder,
                ...(rangeMin !== null ? { range_min: rangeMin } : { range_min: null }),
                ...(rangeMax !== null ? { range_max: rangeMax } : { range_max: null }),
              };
            })
            .filter((option) => option.option_value);

          if (filterType === 'select' && selectOptions.length === 0) {
            throw new Error('Filter loại select phải có ít nhất 1 option hợp lệ');
          }

          // Validate no duplicate option_value
          const optionValues = selectOptions.map((opt) => opt.option_value);
          if (new Set(optionValues).size !== optionValues.length) {
            throw new Error(`Catalog filter "${key}": option_value không được trùng nhau`);
          }

          return {
            ...(id ? { catalog_field_id: id } : {}),
            ...(key ? { catalog_field_key: key } : {}),
            filter_type: filterType,
            label: String(item.label || '').trim(),
            placeholder: String(item.placeholder || '').trim(),
            sort_order: parseSortOrder(item.sort_order, index + 1),
            is_active: item.is_active !== false,
            ...(filterType === 'select' ? { select_options: selectOptions } : {}),
          };
        })
        .filter(Boolean);

      const catalogFilterKeys = catalog_filter_configs
        .map((item) => resolveCatalogFieldIdentity(item, catalogFieldMapById))
        .filter(Boolean);
      if (new Set(catalogFilterKeys).size !== catalogFilterKeys.length) {
        throw new Error('Catalog filter configs không được trùng catalog field trong cùng section');
      }

      await unitDisplayConfigApi.updateByRole(configRole, {
        items,
        visibility_rules,
        primary_sort_filters,
        catalog_filter_configs,
      });

      setDisplayConfigSuccess('Lưu cấu hình hiển thị units thành công');
      await fetchDisplayConfigByRole(configRole);
      await fetchUnits(1, pagination.limit, filters);
      return { ok: true };
    } catch (error) {
      setDisplayConfigError(error?.response?.data?.message || error?.message || 'Lưu cấu hình hiển thị units thất bại');
      return { ok: false };
    } finally {
      setSavingDisplayConfig(false);
    }
  }, [
    configRole,
    displayConfigItems,
    visibilityRuleItems,
    primarySortFilterItems,
    catalogFilterConfigItems,
    catalogFieldMapById,
    fetchDisplayConfigByRole,
    fetchUnits,
    pagination.limit,
    filters,
  ]);

  useEffect(() => {
    fetchSchemaCatalog();
    fetchCatalogFields();
  }, [fetchSchemaCatalog, fetchCatalogFields]);

  // Fetch units on mount to load initial data and filter configs from API
  useEffect(() => {
    fetchUnits(pagination.page, pagination.limit, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetErrors() {
    setDetailError('');
    setSubmitError('');
    setSchemaError('');
  }

  const setSchemaFieldsBySchemaId = useCallback(async (schemaId, includeInactive = false) => {
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
  }, [fetchSchemaFields]);

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

  function setSortFilter(sortOption) {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => ({
      ...prev,
      sort_field_key: String(sortOption?.catalog_field_key || '').trim(),
      sort_direction: sortOption?.sort_direction === 'desc' ? 'desc' : (sortOption?.sort_direction === 'asc' ? 'asc' : ''),
    }));
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

  function upsertCatalogFilterByField(catalogFieldKey, value) {
    const normalizedKey = String(catalogFieldKey || '').trim();
    if (!normalizedKey) return;

    const normalizedValue = String(value ?? '').trim();

    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => {
      const current = [...(prev.catalog_filters || [])];
      const index = current.findIndex((item) => String(item.catalog_field_key || '').trim() === normalizedKey);

      if (!normalizedValue) {
        if (index < 0) return prev;
        current.splice(index, 1);
        return {
          ...prev,
          catalog_filters: current,
        };
      }

      if (index >= 0) {
        current[index] = {
          ...current[index],
          catalog_field_key: normalizedKey,
          catalog_field_id: '',
          value: normalizedValue,
        };
        return {
          ...prev,
          catalog_filters: current,
        };
      }

      return {
        ...prev,
        catalog_filters: [...current, createCatalogFilterRow({ catalog_field_key: normalizedKey, value: normalizedValue })],
      };
    });
  }

  function addDisplayConfigItem() {
    setDisplayConfigItems((prev) => [...(prev || []), createDisplayConfigItemRow()]);
  }

  function updateDisplayConfigItem(rowId, patch) {
    setDisplayConfigItems((prev) => (prev || []).map((item) => {
      if (item.row_id !== rowId) return item;
      if (Object.prototype.hasOwnProperty.call(patch, 'catalog_field_key')) {
        return {
          ...item,
          ...patch,
          catalog_field_id: '',
        };
      }
      return { ...item, ...patch };
    }));
  }

  function removeDisplayConfigItem(rowId) {
    setDisplayConfigItems((prev) => (prev || []).filter((item) => item.row_id !== rowId));
  }

  function moveDisplayConfigItem(rowId, direction) {
    setDisplayConfigItems((prev) => {
      const list = [...(prev || [])];
      const index = list.findIndex((item) => item.row_id === rowId);
      if (index < 0) return list;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return list;

      const [current] = list.splice(index, 1);
      list.splice(targetIndex, 0, current);
      return reindexSortOrder(list);
    });
  }

  function addVisibilityRuleItem() {
    setVisibilityRuleItems((prev) => [...(prev || []), createVisibilityRuleRow()]);
  }

  function updateVisibilityRuleItem(rowId, patch) {
    setVisibilityRuleItems((prev) => (prev || []).map((item) => {
      if (item.row_id !== rowId) return item;
      if (Object.prototype.hasOwnProperty.call(patch, 'catalog_field_key')) {
        return {
          ...item,
          ...patch,
          catalog_field_id: '',
        };
      }
      return { ...item, ...patch };
    }));
  }

  function removeVisibilityRuleItem(rowId) {
    setVisibilityRuleItems((prev) => (prev || []).filter((item) => item.row_id !== rowId));
  }

  function moveVisibilityRuleItem(rowId, direction) {
    setVisibilityRuleItems((prev) => {
      const list = [...(prev || [])];
      const index = list.findIndex((item) => item.row_id === rowId);
      if (index < 0) return list;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return list;

      const [current] = list.splice(index, 1);
      list.splice(targetIndex, 0, current);
      return reindexSortOrder(list);
    });
  }

  function addPrimarySortFilterItem() {
    setPrimarySortFilterItems((prev) => [...(prev || []), createPrimarySortFilterRow()]);
  }

  function updatePrimarySortFilterItem(rowId, patch) {
    setPrimarySortFilterItems((prev) => (prev || []).map((item) => {
      if (item.row_id !== rowId) return item;
      if (Object.prototype.hasOwnProperty.call(patch, 'catalog_field_key')) {
        return {
          ...item,
          ...patch,
          catalog_field_id: '',
        };
      }
      return { ...item, ...patch };
    }));
  }

  function removePrimarySortFilterItem(rowId) {
    setPrimarySortFilterItems((prev) => (prev || []).filter((item) => item.row_id !== rowId));
  }

  function movePrimarySortFilterItem(rowId, direction) {
    setPrimarySortFilterItems((prev) => {
      const list = [...(prev || [])];
      const index = list.findIndex((item) => item.row_id === rowId);
      if (index < 0) return list;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return list;

      const [current] = list.splice(index, 1);
      list.splice(targetIndex, 0, current);
      return reindexSortOrder(list);
    });
  }

  function addCatalogFilterConfigItem() {
    setCatalogFilterConfigItems((prev) => [...(prev || []), createCatalogFilterConfigRow()]);
  }

  function updateCatalogFilterConfigItem(rowId, patch) {
    setCatalogFilterConfigItems((prev) => (prev || []).map((item) => {
      if (item.row_id !== rowId) return item;

      if (Object.prototype.hasOwnProperty.call(patch, 'catalog_field_key')) {
        return {
          ...item,
          ...patch,
          catalog_field_id: '',
        };
      }

      if (Object.prototype.hasOwnProperty.call(patch, 'filter_type')) {
        const nextType = patch.filter_type === 'select' ? 'select' : 'input';
        return {
          ...item,
          ...patch,
          filter_type: nextType,
          select_options: nextType === 'select' ? (item.select_options || []) : [],
        };
      }

      return { ...item, ...patch };
    }));
  }

  function removeCatalogFilterConfigItem(rowId) {
    setCatalogFilterConfigItems((prev) => (prev || []).filter((item) => item.row_id !== rowId));
  }

  function moveCatalogFilterConfigItem(rowId, direction) {
    setCatalogFilterConfigItems((prev) => {
      const list = [...(prev || [])];
      const index = list.findIndex((item) => item.row_id === rowId);
      if (index < 0) return list;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return list;

      const [current] = list.splice(index, 1);
      list.splice(targetIndex, 0, current);
      return reindexSortOrder(list);
    });
  }

  function addCatalogFilterSelectOption(configRowId) {
    setCatalogFilterConfigItems((prev) => (prev || []).map((item) => {
      if (item.row_id !== configRowId) return item;
      return {
        ...item,
        select_options: [...(item.select_options || []), createCatalogFilterSelectOptionRow()],
      };
    }));
  }

  function updateCatalogFilterSelectOption(configRowId, optionRowId, patch) {
    setCatalogFilterConfigItems((prev) => (prev || []).map((item) => {
      if (item.row_id !== configRowId) return item;
      return {
        ...item,
        select_options: (item.select_options || []).map((option) => {
          if (option.row_id !== optionRowId) return option;
          return { ...option, ...patch };
        }),
      };
    }));
  }

  function removeCatalogFilterSelectOption(configRowId, optionRowId) {
    setCatalogFilterConfigItems((prev) => (prev || []).map((item) => {
      if (item.row_id !== configRowId) return item;
      return {
        ...item,
        select_options: (item.select_options || []).filter((option) => option.row_id !== optionRowId),
      };
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
    visibleUnits,
    loadingList,
    listError,
    filters,
    setFilters,
    updateFilter,
    addCatalogFilter,
    updateCatalogFilter,
    removeCatalogFilter,
    upsertCatalogFilterByField,
    setSortFilter,
    catalogFieldOptions,
    filterCatalogFieldOptions,
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
    visibleDisplayCatalogs,
    resolvedVisibilityRules,
    resolvedPrimarySortFilters,
    resolvedCatalogFilterConfigs,
    catalogFilterValueMap,
    activeSortFromList,
    effectiveActiveSort,
    selectedSort,
    visibleCountFromList,
    configRole,
    setConfigRole,
    displayConfigItems,
    visibilityRuleItems,
    primarySortFilterItems,
    catalogFilterConfigItems,
    loadingDisplayConfig,
    savingDisplayConfig,
    displayConfigError,
    displayConfigSuccess,
    fetchDisplayConfigByRole,
    saveDisplayConfigByRole,
    addDisplayConfigItem,
    updateDisplayConfigItem,
    removeDisplayConfigItem,
    moveDisplayConfigItem,
    addVisibilityRuleItem,
    updateVisibilityRuleItem,
    removeVisibilityRuleItem,
    moveVisibilityRuleItem,
    addPrimarySortFilterItem,
    updatePrimarySortFilterItem,
    removePrimarySortFilterItem,
    movePrimarySortFilterItem,
    addCatalogFilterConfigItem,
    updateCatalogFilterConfigItem,
    removeCatalogFilterConfigItem,
    moveCatalogFilterConfigItem,
    addCatalogFilterSelectOption,
    updateCatalogFilterSelectOption,
    removeCatalogFilterSelectOption,
  };
}
