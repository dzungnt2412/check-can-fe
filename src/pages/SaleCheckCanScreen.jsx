import { useEffect, useMemo, useState } from 'react';
import {
  AutoComplete,
  Alert,
  Button,
  Card,
  Input,
  Space,
  Tag,
  Typography,
  Table,
  Select,
  Breadcrumb,
  Pagination,
  Tooltip,
  Row,
  Col,
  Grid,
  Drawer,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  FilterOutlined,
  LogoutOutlined,
  MenuOutlined,
  ReloadOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import headerLogo from '../assets/images/logo.png';
import { fieldCatalogApi, projectApi, unitApi } from '../api';

const { Title, Text } = Typography;

const DEFAULT_UNIT_DATA = [
  { key: 1, code: 'ĐĐD-45', price: 20.04, type: 'SHOPHOUSE', landArea: 112, buildArea: 352.3, direction: 'TÂY BẮC', zone: 'ĐẢO DỪA', fund: 'Quỹ sơ cấp', status: 'Còn hàng' },
  { key: 2, code: 'CL15-25', price: 20.71, type: 'LIỀN KỀ', landArea: 112.5, buildArea: 415.9, direction: 'TÂY BẮC', zone: 'CHÀ LÀ', fund: 'Quỹ sơ cấp', status: 'Còn hàng' },
  { key: 3, code: 'ĐĐD-62', price: 23.07, type: 'SHOPHOUSE', landArea: 80, buildArea: 324, direction: 'ĐÔNG NAM', zone: 'SAN HÔ', fund: 'Quỹ ký gửi', status: 'Còn hàng' },
  { key: 4, code: 'CL15-24', price: 23.39, type: 'LIỀN KỀ', landArea: 112.5, buildArea: 427.9, direction: 'TÂY BẮC', zone: 'CHÀ LÀ', fund: 'Quỹ sơ cấp', status: 'Còn hàng' },
  { key: 5, code: 'SH16-01', price: 26.72, type: 'LIỀN KỀ', landArea: 132, buildArea: 486.4, direction: 'ĐÔNG NAM', zone: 'SAN HÔ', fund: 'Quỹ ký gửi', status: 'Còn hàng' },
  { key: 6, code: 'SB-153', price: 28.64, type: 'SHOPHOUSE', landArea: 112.5, buildArea: 415.9, direction: 'TÂY NAM - ĐÔNG BẮC', zone: 'SAO BIỂN', fund: 'Quỹ sơ cấp', status: 'Còn hàng' },
  { key: 7, code: 'KĐ6-09', price: 28.75, type: 'SONG LẬP', landArea: 150, buildArea: 355.9, direction: 'ĐÔNG NAM', zone: 'KINH ĐÔ', fund: 'Quỹ ký gửi', status: 'Còn hàng' },
  { key: 8, code: 'ĐD-01', price: 29.13, type: 'LIỀN KỀ', landArea: 132, buildArea: 442.1, direction: 'ĐÔNG NAM - TÂY NAM', zone: 'ĐẢO DỪA', fund: 'Quỹ sơ cấp', status: 'Còn hàng' },
  { key: 9, code: 'SB-243', price: 31.2, type: 'SHOPHOUSE', landArea: 145.6, buildArea: 427.2, direction: 'TÂY NAM - ĐÔNG BẮC', zone: 'SAO BIỂN', fund: 'Quỹ ký gửi', status: 'Còn hàng' },
  { key: 10, code: 'SH14-01', price: 32.5, type: 'LIỀN KỀ', landArea: 132, buildArea: 486.4, direction: 'ĐÔNG NAM', zone: 'SAN HÔ', fund: 'Quỹ sơ cấp', status: 'Còn hàng' },
  { key: 11, code: 'ĐLSH-187', price: 32.71, type: 'SHOPHOUSE', landArea: 100, buildArea: 397.5, direction: 'TÂY NAM - ĐÔNG BẮC', zone: 'SAN HÔ', fund: 'Quỹ ký gửi', status: 'Còn hàng' },
  { key: 12, code: 'ĐLSH-189', price: 33.27, type: 'SHOPHOUSE', landArea: 100, buildArea: 352.3, direction: 'TÂY NAM', zone: 'SAN HÔ', fund: 'Quỹ sơ cấp', status: 'Còn hàng' },
];

function createEmptyFilters() {
  return {
    ma_can: '',
    project_id: '',
    catalog_values: {},
  };
}

function parseProjectList(data) {
  const list = Array.isArray(data)
    ? data
    : data?.items || data?.projects || [];

  return list
    .map((item) => ({
      id: item.id,
      name: item.project_name || item.name || '',
    }))
    .filter((item) => item.id && item.name)
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

function extractData(response) {
  return response?.data?.data ?? response?.data ?? {};
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

function normalizeStringValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function formatCellValue(value) {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return value.toLocaleString('vi-VN');

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '-';
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed).toLocaleString('vi-VN');
    }
    return trimmed;
  }

  return String(value);
}

function renderTruncatedCell(value, maxChars = 20) {
  const fullText = formatCellValue(value);
  const textValue = String(fullText);
  const shouldTruncate = textValue !== '-' && textValue.length > maxChars;
  const shortText = shouldTruncate ? `${textValue.slice(0, maxChars)}...` : textValue;

  const content = (
    <span
      style={{
        display: 'inline-block',
        maxWidth: 160,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        verticalAlign: 'bottom',
      }}
    >
      {shortText}
    </span>
  );

  if (!shouldTruncate) return content;
  return <Tooltip title={textValue}>{content}</Tooltip>;
}

function normalizePrimarySortFilters(data) {
  const list = Array.isArray(data) ? data : data?.primary_sort_filters || [];

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
  const list = Array.isArray(data) ? data : data?.catalog_filter_configs || [];

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
          option_label: String(option.option_label || '').trim(),
          option_value: String(option.option_value || '').trim(),
          sort_order: Number(option.sort_order ?? optionIndex + 1),
        }))
        .filter((option) => option.option_value)
        .sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999))
      : [],
  }));
}

export default function SaleCheckCanScreen({ user, onLogout }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [sortValue, setSortValue] = useState('price_asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(createEmptyFilters());
  const [appliedFilters, setAppliedFilters] = useState(createEmptyFilters());
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [rawUnits, setRawUnits] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [listError, setListError] = useState('');
  const [catalogFields, setCatalogFields] = useState([]);
  const [loadingCatalogFields, setLoadingCatalogFields] = useState(false);
  const [tableFieldKeys, setTableFieldKeys] = useState([]);
  const [displayCatalogsFromApi, setDisplayCatalogsFromApi] = useState([]);
  const [visibilityRulesFromApi, setVisibilityRulesFromApi] = useState([]);
  const [primarySortFiltersFromApi, setPrimarySortFiltersFromApi] = useState([]);
  const [catalogFilterConfigsFromApi, setCatalogFilterConfigsFromApi] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [pageSize] = useState(12);
  const [totalRows, setTotalRows] = useState(0);

  const projectOptions = useMemo(
    () => (projects || []).map((item) => ({ value: String(item.id), label: item.name })),
    [projects]
  );

  const catalogFieldMapById = useMemo(() => {
    const map = new Map();
    catalogFields.forEach((field) => {
      if (!field.id) return;
      map.set(String(field.id), field);
    });
    return map;
  }, [catalogFields]);

  const resolvedDisplayCatalogs = useMemo(() => {
    return (displayCatalogsFromApi || [])
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
          bg_color: item.bg_color || '',
          text_color: item.text_color || '',
        };
      })
      .filter((item) => item.catalog_field_key)
      .sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999));
  }, [displayCatalogsFromApi, catalogFieldMapById]);

  const visibleDisplayFieldKeys = useMemo(
    () => resolvedDisplayCatalogs
      .filter((item) => item.is_visible !== false)
      .map((item) => item.catalog_field_key),
    [resolvedDisplayCatalogs]
  );

  const resolvedVisibilityRules = useMemo(() => {
    return (visibilityRulesFromApi || [])
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
  }, [visibilityRulesFromApi, catalogFieldMapById]);

  const catalogValueOptions = useMemo(() => {
    const optionsByKey = {};

    catalogFields.forEach((field) => {
      const valueSet = new Set();

      rawUnits.forEach((unit) => {
        const dynamic = unit?.dynamic_data && typeof unit.dynamic_data === 'object' ? unit.dynamic_data : {};
        const rawValue = dynamic[field.field_key];
        const normalized = String(rawValue || '').trim();
        if (normalized) valueSet.add(normalized);
      });

      optionsByKey[field.field_key] = [...valueSet]
        .sort((a, b) => a.localeCompare(b, 'vi'))
        .map((value) => ({ value }));
    });

    return optionsByKey;
  }, [catalogFields, rawUnits]);

  const resolvedCatalogFilterConfigs = useMemo(() => {
    return (catalogFilterConfigsFromApi || [])
      .map((item, index) => {
        const catalog = item.catalog_field_id
          ? catalogFieldMapById.get(String(item.catalog_field_id))
          : null;

        return {
          ...item,
          catalog_field_key: item.catalog_field_key || catalog?.field_key || '',
          label: item.label || catalog?.field_label || item.catalog_field_key || '',
          placeholder: item.placeholder || '',
          sort_order: Number(item.sort_order ?? index + 1),
        };
      })
      .filter((item) => item.catalog_field_key && item.is_active !== false)
      .sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999));
  }, [catalogFilterConfigsFromApi, catalogFieldMapById]);

  const resolvedPrimarySortFilters = useMemo(() => {
    return (primarySortFiltersFromApi || [])
      .map((item, index) => {
        const catalog = item.catalog_field_id
          ? catalogFieldMapById.get(String(item.catalog_field_id))
          : null;

        return {
          ...item,
          catalog_field_key: item.catalog_field_key || catalog?.field_key || '',
          label: item.label || catalog?.field_label || item.catalog_field_key || '',
          sort_order: Number(item.sort_order ?? index + 1),
        };
      })
      .filter((item) => item.catalog_field_key && item.is_active !== false)
      .sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999));
  }, [primarySortFiltersFromApi, catalogFieldMapById]);

  const fieldLabelMap = useMemo(
    () => new Map(catalogFields.map((field) => [field.field_key, field.field_label || field.field_key])),
    [catalogFields]
  );

  const filteredRowsByRules = useMemo(() => {
    if (!resolvedVisibilityRules.length) return rows;

    const showRules = resolvedVisibilityRules.filter((item) => item.effect === 'show');
    const hideRules = resolvedVisibilityRules.filter((item) => item.effect === 'hide');

    function matchRule(row, rule) {
      const currentValue = normalizeStringValue(row.dynamic_data?.[rule.catalog_field_key]);
      const compareValue = normalizeStringValue(rule.compare_value);
      if (!compareValue) return false;
      if (rule.operator === 'neq') return currentValue !== compareValue;
      return currentValue === compareValue;
    }

    return rows.filter((row) => {
      if (showRules.length > 0) {
        const canShow = showRules.some((rule) => matchRule(row, rule));
        if (!canShow) return false;
      }

      const shouldHide = hideRules.some((rule) => matchRule(row, rule));
      if (shouldHide) return false;
      return true;
    });
  }, [rows, resolvedVisibilityRules]);

  useEffect(() => {
    async function loadCatalogFields() {
      setLoadingCatalogFields(true);

      try {
        const response = await fieldCatalogApi.getAll({ include_inactive: true });
        const data = extractData(response);
        const parsed = parseCatalogFieldList(data).filter((item) => item.status === 'active');
        setCatalogFields(parsed);
      } catch {
        setCatalogFields([]);
      } finally {
        setLoadingCatalogFields(false);
      }
    }

    loadCatalogFields();
  }, []);

  useEffect(() => {
    async function loadProjects() {
      setLoadingProjects(true);
      try {
        const response = await projectApi.getAll();
        const data = extractData(response);
        setProjects(parseProjectList(data));
      } catch {
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    }

    loadProjects();
  }, []);

  async function fetchUnitsByFilters(criteria, nextPage = 1, nextLimit = pageSize, nextSortValue = sortValue) {
    setLoadingRows(true);
    setListError('');

    try {
      const params = {
        page: nextPage,
        limit: nextLimit,
      };

      const maCan = String(criteria?.ma_can || '').trim();
      if (maCan) {
        params.ma_can = maCan;
      }

      const projectId = Number(criteria?.project_id);
      if (Number.isInteger(projectId) && projectId > 0) {
        params.project_id = projectId;
      }

      const [sortFieldKey, sortDirection] = String(nextSortValue || '').split('__');
      if (sortFieldKey && (sortDirection === 'asc' || sortDirection === 'desc')) {
        params.sort_field_key = sortFieldKey;
        params.sort_direction = sortDirection;
      }

      const configuredFilterFieldKeySet = new Set(
        (resolvedCatalogFilterConfigs || []).map((item) => item.catalog_field_key).filter(Boolean)
      );
      const allowedFieldKeySet = configuredFilterFieldKeySet.size > 0
        ? configuredFilterFieldKeySet
        : new Set(visibleDisplayFieldKeys);

      const catalogFilters = Object.entries(criteria.catalog_values || {})
        .map(([catalog_field_key, value]) => ({
          catalog_field_key,
          value: String(value || '').trim(),
        }))
        .filter((item) => item.catalog_field_key && item.value && allowedFieldKeySet.has(item.catalog_field_key));

      if (catalogFilters.length) {
        params.catalog_filters = JSON.stringify(catalogFilters);
      }

      const response = await unitApi.getAll(params);
      const data = extractData(response);
      const apiRows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];

      const resolvedPage = Number(data?.page || nextPage);
      const resolvedLimit = Number(data?.limit || nextLimit);
      const resolvedTotal = Number(data?.total || apiRows.length);

      setRawUnits(apiRows);
      setDisplayCatalogsFromApi(normalizeDisplayCatalogList(data?.display_catalogs || []));
      setVisibilityRulesFromApi(normalizeVisibilityRules(data?.visibility_rules || []));
      setPrimarySortFiltersFromApi(normalizePrimarySortFilters(data?.primary_sort_filters || []));
      setCatalogFilterConfigsFromApi(normalizeCatalogFilterConfigs(data?.catalog_filter_configs || []));
      setRows(apiRows.map((item, index) => ({
        key: item.id ?? item.unit_id ?? index + 1,
        ...item,
        dynamic_data: item?.dynamic_data && typeof item.dynamic_data === 'object' ? item.dynamic_data : {},
      })));
      setPage(resolvedPage);
      if (Number.isFinite(resolvedLimit) && resolvedLimit > 0 && resolvedLimit !== pageSize) {
        // pageSize is fixed for this screen, ignore dynamic limit from API.
      }
      setTotalRows(Number.isFinite(resolvedTotal) ? resolvedTotal : apiRows.length);
    } catch (error) {
      setListError(error?.response?.data?.message || 'Tải danh sách căn thất bại');
      setRawUnits([]);
      setDisplayCatalogsFromApi([]);
      setVisibilityRulesFromApi([]);
      setCatalogFilterConfigsFromApi([]);
      const fallbackRows = DEFAULT_UNIT_DATA.map((item) => ({
        key: item.key,
        unit_code: item.code,
        dynamic_data: {
          gia_ban: item.price,
          loai_hinh: item.type,
          dt_dat: item.landArea,
          dt_xay_dung: item.buildArea,
          huong: item.direction,
          phan_khu: item.zone,
          quy_ban: item.fund,
          tinh_trang: item.status,
        },
      }));
      setRows(fallbackRows);
      setTotalRows(fallbackRows.length);
    } finally {
      setLoadingRows(false);
    }
  }

  async function handleApplyFilters() {
    setAppliedFilters(draftFilters);
    setPage(1);
    await fetchUnitsByFilters(draftFilters);
  }

  useEffect(() => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const initialFilters = createEmptyFilters();
    const projectIdFromQuery = String(searchParams.get('project_id') || '').trim();
    const hasProjectFilterFromQuery = /^\d+$/.test(projectIdFromQuery) && Number(projectIdFromQuery) > 0;

    if (hasProjectFilterFromQuery) {
      initialFilters.project_id = projectIdFromQuery;
      if (isMobile) {
        setIsFilterOpen(true);
      } else {
        setIsDesktopFilterOpen(true);
      }
    }

    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    fetchUnitsByFilters(initialFilters, 1, pageSize);
  }, [isMobile, pageSize, searchParams]);

  useEffect(() => {
    const orderedKeys = [];
    visibleDisplayFieldKeys.forEach((key) => {
      if (!key) return;
      if (orderedKeys.includes(key)) return;
      orderedKeys.push(key);
    });

    setTableFieldKeys(orderedKeys);
  }, [visibleDisplayFieldKeys]);

  // Set default sort when primarySortFilters are loaded
  useEffect(() => {
    if (resolvedPrimarySortFilters.length === 0) return;

    const optionValues = resolvedPrimarySortFilters
      .map((item) => `${item.catalog_field_key}__${item.sort_direction}`)
      .filter(Boolean);

    if (optionValues.length === 0) return;
    if (optionValues.includes(sortValue)) return;

    const nextDefaultSortValue = optionValues[0];
    setSortValue(nextDefaultSortValue);
    setPage(1);
    fetchUnitsByFilters(appliedFilters, 1, pageSize, nextDefaultSortValue);
  }, [appliedFilters, pageSize, resolvedPrimarySortFilters, sortValue]);

  const primarySortOptions = useMemo(() => {
    return (resolvedPrimarySortFilters || [])
      .map((item) => ({
        value: `${item.catalog_field_key}__${item.sort_direction}`,
        label: `${item.label || item.catalog_field_key} (${item.sort_direction})`,
      }));
  }, [resolvedPrimarySortFilters]);

  const sortedRows = useMemo(() => {
    function getRowCodeValue(row) {
      return String(row.unit_code || '');
    }

    function getRowFieldValue(row, fieldKey) {
      if (fieldKey === 'unit_code') return String(row.unit_code || '');
      const raw = row.dynamic_data?.[fieldKey];
      
      // Try to parse as number
      const normalized = String(raw || '')
        .replace(/\s+/g, '')
        .replace(/[^\d,.-]/g, '')
        .replace(/,(?=\d{3}(\D|$))/g, '')
        .replace(',', '.');

      const parsed = Number.parseFloat(normalized);
      if (Number.isFinite(parsed)) return parsed;
      return String(raw || '');
    }

    if (!sortValue) return filteredRowsByRules;

    const [sortFieldKey, sortDirection] = String(sortValue).split('__');
    if (!sortFieldKey) return filteredRowsByRules;

    const sorted = [...filteredRowsByRules].sort((a, b) => {
      const valueA = getRowFieldValue(a, sortFieldKey);
      const valueB = getRowFieldValue(b, sortFieldKey);

      // Handle numeric vs string comparison
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'desc' ? valueB - valueA : valueA - valueB;
      }

      const strA = String(valueA || '');
      const strB = String(valueB || '');
      const comparison = strA.localeCompare(strB, 'vi');
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [filteredRowsByRules, sortValue]);

  const displayStyleMap = useMemo(() => {
    const map = new Map();
    resolvedDisplayCatalogs.forEach((item) => {
      map.set(item.catalog_field_key, {
        bg_color: item.bg_color || '',
        text_color: item.text_color || '',
      });
    });
    return map;
  }, [resolvedDisplayCatalogs]);

  const columns = useMemo(() => {
    return [
      ...tableFieldKeys.map((fieldKey, index) => ({
        title: fieldKey === 'unit_code' ? 'Mã căn' : (fieldLabelMap.get(fieldKey) || fieldKey),
        key: `field_${fieldKey}`,
        width: fieldKey === 'unit_code' ? 140 : 170,
        fixed: index === 0 ? 'left' : undefined,
        align: 'center',
        render: (_, row) => {
          const value = fieldKey === 'unit_code'
            ? row.unit_code
            : row.dynamic_data?.[fieldKey];

          if (fieldKey === 'unit_code') {
            const styleCfg = displayStyleMap.get(fieldKey);
            const displayValue = formatCellValue(value);
            const textValue = String(displayValue);
            const shouldTruncate = textValue !== '-' && textValue.length > 25;
            const shortText = shouldTruncate ? `${textValue.slice(0, 25)}...` : textValue;

            const tagNode = (
              <Tag
                style={{
                  border: 'none',
                  background: styleCfg?.bg_color || '#fff1f0',
                  color: styleCfg?.text_color || '#ef4444',
                  fontWeight: 700,
                  borderRadius: 8,
                  paddingInline: 10,
                }}
              >
                {shortText}
              </Tag>
            );

            if (shouldTruncate) {
              return <Tooltip title={textValue}>{tagNode}</Tooltip>;
            }

            return (
              tagNode
            );
          }

          const styleCfg = displayStyleMap.get(fieldKey);
          return (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 6px',
                borderRadius: 6,
                background: styleCfg?.bg_color || 'transparent',
                color: styleCfg?.text_color || 'inherit',
              }}
            >
              {renderTruncatedCell(value, 20)}
            </span>
          );
        },
      })),
    ];
  }, [displayStyleMap, fieldLabelMap, page, tableFieldKeys]);

  function renderFilterFormContent() {
    return (
      <Row gutter={[12, 14]}>
        <Col xs={24} md={12}>
          <Text strong>Mã căn</Text>
          <Input
            value={draftFilters.ma_can || ''}
            placeholder="Nhập mã căn"
            onChange={(event) => {
              const nextValue = event.target.value;
              setDraftFilters((prev) => ({
                ...prev,
                ma_can: nextValue,
              }));
            }}
            style={{ width: '100%', marginTop: 6 }}
          />
        </Col>

        <Col xs={24} md={12}>
          <Text strong>Dự án</Text>
          <Select
            value={draftFilters.project_id || undefined}
            options={projectOptions}
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Chọn dự án"
            loading={loadingProjects}
            onChange={(value) => {
              setDraftFilters((prev) => ({
                ...prev,
                project_id: value || '',
              }));
            }}
            style={{ width: '100%', marginTop: 6 }}
          />
        </Col>

        {(resolvedCatalogFilterConfigs || []).map((config) => {
          const isSelect = config.filter_type === 'select';
          const selectedValue = draftFilters.catalog_values?.[config.catalog_field_key] || '';
          const selectOptions = (config.select_options || []).map((option) => ({
            value: option.option_value,
            label: option.option_label || option.option_value,
          }));

          return (
            <Col xs={12} md={12} key={config.catalog_field_key}>
              <Text strong>{config.label || config.catalog_field_key}</Text>
              {isSelect ? (
                <Select
                  value={selectedValue || undefined}
                  options={selectOptions}
                  allowClear
                  placeholder={config.placeholder || config.label || config.catalog_field_key}
                  onChange={(value) => {
                    setDraftFilters((prev) => ({
                      ...prev,
                      catalog_values: {
                        ...(prev.catalog_values || {}),
                        [config.catalog_field_key]: value || '',
                      },
                    }));
                  }}
                  style={{ width: '100%', marginTop: 6 }}
                />
              ) : (
                <AutoComplete
                  value={selectedValue}
                  options={catalogValueOptions[config.catalog_field_key] || []}
                  placeholder={config.placeholder || config.label || config.catalog_field_key}
                  onChange={(value) => {
                    setDraftFilters((prev) => ({
                      ...prev,
                      catalog_values: {
                        ...(prev.catalog_values || {}),
                        [config.catalog_field_key]: value,
                      },
                    }));
                  }}
                  filterOption={(inputValue, option) => String(option?.value || '')
                    .toLowerCase()
                    .includes(String(inputValue || '').toLowerCase())}
                  style={{ width: '100%', marginTop: 6 }}
                />
              )}
            </Col>
          );
        })}
        <Col span={24} style={{ marginTop: 2, textAlign: isMobile ? 'initial' : 'center' }}>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleApplyFilters}
            block={isMobile}
            style={{
              background: '#0b2c5f',
              borderColor: '#0b2c5f',
              borderRadius: 8,
              height: 44,
              fontWeight: 700,
              minWidth: isMobile ? undefined : 170,
            }}
          >
            Áp dụng bộ lọc
          </Button>
        </Col>
      </Row>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '10px 12px' : '10px 20px',
        }}
      >
        {isMobile ? (
          <div style={{ maxWidth: 1600, margin: '0 auto', display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Space size={4} align="center" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                <img
                  src={headerLogo}
                  alt="Roman Property"
                  style={{ height: 28, width: 'auto', display: 'block' }}
                />
              </Space>
              <Button
                icon={<MenuOutlined />}
                onClick={() => setIsMobileMenuOpen(true)}
                type="text"
                style={{ color: '#94a3b8' }}
              />
            </div>

            <Drawer
              open={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
              placement="right"
              title="Menu"
              width={280}
            >
              <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Link
                    to="/sale/projects"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 8,
                      color: '#111827',
                      fontWeight: location.pathname === '/sale/projects' ? 700 : 500,
                      background: location.pathname === '/sale/projects' ? '#eff6ff' : 'transparent',
                    }}
                  >
                    DỰ ÁN
                  </Link>
                  <Link
                    to="/sale/check-can"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 8,
                      color: '#111827',
                      fontWeight: location.pathname === '/sale/check-can' ? 700 : 500,
                      background: location.pathname === '/sale/check-can' ? '#eff6ff' : 'transparent',
                    }}
                  >
                    QUỸ CĂN
                  </Link>
                </Space>

                <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                  <Button
                    block
                    icon={<LogoutOutlined />}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                  >
                    Đăng xuất
                  </Button>
                </div>
              </div>
            </Drawer>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1600, margin: '0 auto' }}>
            <Space size={28} align="center">
              <Space size={8} align="center">
                <img
                  src={headerLogo}
                  alt="Roman Property"
                  style={{ height: 42, width: 'auto', display: 'block' }}
                />
              </Space>
              <Space size={24} wrap>
                <Text style={{ fontWeight: 700 }}>GIỚI THIỆU</Text>
                <Link to="/sale/projects" style={{ color: '#111827' }}>
                  <Text
                    style={{
                      fontWeight: 700,
                      textDecoration: location.pathname === '/sale/projects' ? 'underline' : 'none',
                    }}
                  >
                    DỰ ÁN
                  </Text>
                </Link>
                <Link to="/sale/check-can" style={{ color: '#111827' }}>
                  <Text
                    style={{
                      fontWeight: 700,
                      textDecoration: location.pathname === '/sale/check-can' ? 'underline' : 'none',
                    }}
                  >
                    QUỸ CĂN
                  </Text>
                </Link>
                <Text style={{ fontWeight: 700 }}>TIN TỨC</Text>
              </Space>
            </Space>

            <Space>
              <Tag color="blue">{user?.username || 'sale'}</Tag>
              <Button
                icon={<LogoutOutlined />}
                onClick={onLogout}
                style={{ background: '#d99800', color: '#fff', borderColor: '#d99800', fontWeight: 700 }}
              >
                Đăng xuất
              </Button>
            </Space>
          </div>
        )}
      </header>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: isMobile ? '14px 12px 20px' : '18px 24px 28px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <Space size={8} wrap>
            <Text style={{ color: '#111827', fontWeight: 600 }}>Trang chủ</Text>
            <Text style={{ color: '#9ca3af' }}>/</Text>
            <Text style={{ color: '#6b7280', fontWeight: 600 }}>Quỹ căn</Text>
          </Space>

          <Space size={8} wrap>
            <Tag
              style={{
                marginInlineEnd: 0,
                borderRadius: 999,
                border: '1px solid #f2b840',
                color: '#a16207',
                background: '#fff7e6',
                fontWeight: 700,
                padding: '2px 10px',
              }}
            >
              Sắp mở bán
            </Tag>
            <Button size="small" type="text" icon={<ShareAltOutlined />} style={{ color: '#6b7280', fontWeight: 700 }}>
              Chia sẻ
            </Button>
          </Space>
        </div>

        {/* <Card style={{ borderRadius: 8, marginBottom: 16 }} bodyStyle={{ padding: '18px 20px' }}>
          <Title level={2} style={{ margin: 0, fontSize: 36, color: '#143d7a' }}>VINHOMES OCEAN PARK 2</Title>
          <Text type="secondary" style={{ display: 'block', marginTop: 6 }}>
            Theo dõi thông tin chi tiết và bảng giá, mặt bằng, tiến độ và chính sách bán hàng dự án VINHOMES OCEAN PARK 2.
          </Text>
        </Card> */}

        <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: isMobile ? '8px 0 14px' : '12px 0 18px' }}>


          <div style={{ paddingTop: isMobile ? 10 : 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: isMobile ? '0 12px 10px' : '0 20px 12px',
                flexWrap: 'wrap',
              }}
            >
              <Title level={2} style={{ margin: 0, fontSize: isMobile ? 20 : 30 }}>BẢNG HÀNG</Title>

              <Space wrap>
                <Select
                  value={sortValue}
                  onChange={(value) => {
                    setSortValue(value);
                    setPage(1);
                    fetchUnitsByFilters(appliedFilters, 1, pageSize, value);
                  }}
                  style={{ width: isMobile ? 170 : 200 }}
                  options={primarySortOptions.length > 0 ? primarySortOptions : []}
                  placeholder="Chọn sắp xếp"
                />
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => {
                    if (isMobile) {
                      setIsFilterOpen(true);
                    } else {
                      setIsDesktopFilterOpen((prev) => !prev);
                    }
                  }}
                >
                  Bộ lọc
                </Button>
              </Space>
            </div>

            {!isMobile && isDesktopFilterOpen ? (
              <div style={{ padding: '0 20px 12px' }}>
                <Card size="small" bodyStyle={{ paddingBottom: 12 }}>
                  {renderFilterFormContent()}
                </Card>
              </div>
            ) : null}

            {isMobile ? (
              <Drawer
                open={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                placement="right"
                title={null}
                width={320}
                styles={{
                  content: {
                    borderRadius: '16px 0 0 16px',
                  },
                  body: {
                    padding: 16,
                    background: '#f9fafb',
                  },
                  header: {
                    background: '#f9fafb',
                    borderBottom: 'none',
                    padding: '12px 16px 0',
                  },
                }}
              >
                {renderFilterFormContent()}
              </Drawer>
            ) : null}

            {listError ? (
              <div style={{ padding: isMobile ? '0 12px 12px' : '0 20px 14px' }}>
                <Alert
                  showIcon
                  type="warning"
                  message={listError}
                />
              </div>
            ) : null}

            <Table
              dataSource={sortedRows}
              columns={columns}
              pagination={false}
              rowKey="key"
              loading={loadingRows}
              scroll={{ x: 1200 }}
              size={isMobile ? 'small' : 'middle'}
              style={{ padding: isMobile ? '0 12px' : '0 20px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={totalRows}
                onChange={(nextPage) => {
                  fetchUnitsByFilters(appliedFilters, nextPage, pageSize);
                }}
                showSizeChanger={false}
                size={isMobile ? 'small' : 'default'}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
