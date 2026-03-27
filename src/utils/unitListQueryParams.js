function isEmptyValue(value) {
  return value === '' || value === null || value === undefined;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function normalizeSortDirection(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'desc' ? 'desc' : (normalized === 'asc' ? 'asc' : '');
}

export function normalizeCatalogFilters(filters) {
  if (!Array.isArray(filters)) return [];

  return filters
    .map((item) => {
      const catalogFieldKey = String(item?.catalog_field_key || '').trim();
      const rawCatalogFieldId = item?.catalog_field_id;
      const catalogFieldId = isEmptyValue(rawCatalogFieldId)
        ? ''
        : String(rawCatalogFieldId).trim();
      const value = String(item?.value || '').trim();

      if (!value) return null;
      if (!catalogFieldKey && !catalogFieldId) return null;

      if (catalogFieldKey) {
        return {
          catalog_field_key: catalogFieldKey,
          value,
        };
      }

      return {
        catalog_field_id: Number(catalogFieldId),
        value,
      };
    })
    .filter(Boolean);
}

export function buildUnitListParams({ page, limit, filters }) {
  const catalogFilters = normalizeCatalogFilters(filters?.catalog_filters || []);
  const sortFieldKey = String(filters?.sort_field_key || '').trim();
  const sortDirection = normalizeSortDirection(filters?.sort_direction);
  const maCan = String(filters?.ma_can || filters?.unit_code || '').trim();

  const raw = {
    page,
    limit,
    ma_can: maCan,
    project_id: filters?.project_id,
    agency_id: filters?.agency_id,
    schema_id: filters?.schema_id,
    ...(catalogFilters.length ? { catalog_filters: JSON.stringify(catalogFilters) } : {}),
    ...(sortFieldKey ? { sort_field_key: sortFieldKey } : {}),
    ...(sortDirection ? { sort_direction: sortDirection } : {}),
  };

  return Object.entries(raw).reduce((acc, [key, value]) => {
    if (isEmptyValue(value)) return acc;
    acc[key] = value;
    return acc;
  }, {});
}

export function buildUnitListSearchParams({ page, limit, filters }) {
  const params = buildUnitListParams({ page, limit, filters });
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    search.set(key, String(value));
  });

  return search;
}

function parseCatalogFiltersFromSearch(searchParams) {
  const rawJson = searchParams.get('catalog_filters');

  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      return normalizeCatalogFilters(parsed);
    } catch {
      return [];
    }
  }

  const legacyValue = String(searchParams.get('catalog_field_value') || '').trim();
  const legacyKey = String(searchParams.get('catalog_field_key') || '').trim();
  const legacyId = String(searchParams.get('catalog_field_id') || '').trim();

  if (!legacyValue) return [];

  if (legacyKey) {
    return [{ catalog_field_key: legacyKey, value: legacyValue }];
  }

  if (legacyId) {
    return [{ catalog_field_id: Number(legacyId), value: legacyValue }];
  }

  return [];
}

export function parseUnitListSearchParams(searchParams) {
  const sortDirection = normalizeSortDirection(searchParams.get('sort_direction'));
  const maCan = String(searchParams.get('ma_can') || searchParams.get('unit_code') || '').trim();

  return {
    page: parsePositiveInteger(searchParams.get('page'), 1),
    limit: parsePositiveInteger(searchParams.get('limit'), 10),
    filters: {
      ma_can: maCan,
      project_id: String(searchParams.get('project_id') || ''),
      agency_id: String(searchParams.get('agency_id') || ''),
      schema_id: String(searchParams.get('schema_id') || ''),
      catalog_filters: parseCatalogFiltersFromSearch(searchParams),
      sort_field_key: String(searchParams.get('sort_field_key') || '').trim(),
      sort_direction: sortDirection,
    },
  };
}
