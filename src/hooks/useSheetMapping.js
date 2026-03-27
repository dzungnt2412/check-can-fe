import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { schemaApi, sourceApi } from '../api';
import { parseSpreadsheetId } from '../utils/parseSpreadsheetId';

const transformOptions = [
  'trim',
  'uppercase',
  'lowercase',
  'parseViNumber',
  'extractNumber',
  'extractInteger',
];

const MAP_TRANSFORM_PREFIX = 'map:';
const FILL_DOWN_TOKEN = 'fillDown';
const REQUIRED_FIXED_MAPPING_KEYS = ['ma_can', 'du_an'];

const mappingRowSchema = z
  .object({
    schema_field_id: z.union([z.string(), z.number()]),
    source_column_name: z.string().optional(),
    source_column_index: z.number().int().nonnegative().optional(),
    transform_rule: z.string().optional(),
    default_value: z.union([z.string(), z.null()]).optional(),
    is_active: z.boolean(),
    source_cell_bg_color: z.string().optional(),
    source_cell_text_color: z.string().optional(),
    source_color_value_map: z
      .array(
        z.object({
          bgColor: z.string().optional(),
          textColor: z.string().optional(),
          value: z.string(),
        })
      )
      .optional(),
  });

const mappingPayloadSchema = z.object({
  mappings: z.array(mappingRowSchema),
});

function normalizeText(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizeSourceCode(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function buildAutoSourceCode(sourceName) {
  const slug = normalizeSourceCode(sourceName);
  const fallback = `source_${Date.now()}`;
  return slug || fallback;
}

function normalizeDataCondition(dataCondition) {
  if (!dataCondition || typeof dataCondition !== 'object') {
    return undefined;
  }

  const operator = String(dataCondition.operator || '').trim();
  if (!operator) return undefined;

  const rawColumnIndex = dataCondition.column_index;
  const hasColumnIndex =
    rawColumnIndex !== undefined &&
    rawColumnIndex !== null &&
    String(rawColumnIndex).trim() !== '';
  const columnName = String(dataCondition.column_name || '').trim();
  const conditionValue = String(dataCondition.value ?? '').trim();

  const nextCondition = {
    operator,
  };

  if (hasColumnIndex) {
    const parsedIndex = Number(rawColumnIndex);
    if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
      return undefined;
    }
    nextCondition.column_index = parsedIndex;
  } else if (columnName) {
    nextCondition.column_name = columnName;
  } else {
    return undefined;
  }

  if (conditionValue) {
    nextCondition.value = conditionValue;
  }

  if (['eq', 'ne', 'contains'].includes(operator) && !nextCondition.value) {
    return undefined;
  }

  return nextCondition;
}

function bigrams(str) {
  const value = ` ${str} `;
  const grams = [];
  for (let i = 0; i < value.length - 1; i += 1) {
    grams.push(value.slice(i, i + 2));
  }
  return grams;
}

function diceCoefficient(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const aBigrams = bigrams(a);
  const bBigrams = bigrams(b);
  const bMap = new Map();

  bBigrams.forEach((item) => {
    bMap.set(item, (bMap.get(item) || 0) + 1);
  });

  let overlap = 0;
  aBigrams.forEach((item) => {
    const count = bMap.get(item) || 0;
    if (count > 0) {
      bMap.set(item, count - 1);
      overlap += 1;
    }
  });

  return (2 * overlap) / (aBigrams.length + bBigrams.length);
}

function extractData(payload) {
  return payload?.data?.data || payload?.data || {};
}

function parseInspectResult(result) {
  const tabs = result?.sheets || result?.tabs || [];
  return tabs.map((item) => ({
    sheetName: item.sheetName || item.title || item.name || '',
    gid: item.gid || item.sheetId || '',
  }));
}

function parseSchemaFields(result) {
  const fields = Array.isArray(result)
    ? result
    : result?.items || result?.schemaFields || result?.fields || [];

  return fields.map((field) => ({
    id: field.id ?? field.schema_field_id ?? field.schemaFieldId,
    name:
      field.name ??
      field.field_name ??
      field.display_name ??
      field.field_label ??
      field.field_key ??
      '',
    code: field.code ?? field.field_code ?? field.field_key ?? '',
    field_key: field.field_key ?? field.code ?? field.field_code ?? '',
    raw: field,
  }));
}

function normalizeFieldKey(value) {
  return String(value || '').trim().toLowerCase();
}

function hasSourceBinding(mapping) {
  const hasSourceColumnName = String(mapping?.source_column_name || '').trim() !== '';
  const hasSourceColumnIndex =
    mapping?.source_column_index !== '' &&
    mapping?.source_column_index !== undefined &&
    mapping?.source_column_index !== null;

  return hasSourceColumnName || hasSourceColumnIndex;
}

function parsePreviewResult(result) {
  const headers = result?.headers || [];
  const rows = result?.preview || result?.rows || result?.sampleRows || [];
  const formats = result?.preview_formats || result?.formats || [];
  return { headers, rows, formats };
}

function normalizeHexColor(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (raw.startsWith('#')) return raw.toUpperCase();
  return `#${raw}`.toUpperCase();
}

function parseColorValueMap(value) {
  let parsed = [];

  if (Array.isArray(value)) {
    parsed = value;
  } else if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      const parsedJson = JSON.parse(value);
      parsed = Array.isArray(parsedJson) ? parsedJson : [];
    } catch {
      parsed = [];
    }
  }

  return parsed
    .filter((rule) => rule && typeof rule === 'object')
    .map((rule, idx) => ({
      id: rule.id || `${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 8)}`,
      bgColor: normalizeHexColor(rule.bgColor ?? rule.bg_color ?? ''),
      textColor: normalizeHexColor(rule.textColor ?? rule.text_color ?? ''),
      matchBy: rule.matchBy || '',
      value: String(rule.value ?? '').trim(),
    }));
}

function extractProjectNamesFromSource(source) {
  const namesFromLinked = Array.isArray(source?.linked_projects)
    ? source.linked_projects
      .map((project) => String(project?.project_name || project?.name || '').trim())
      .filter(Boolean)
    : [];

  if (namesFromLinked.length) {
    return Array.from(new Set(namesFromLinked)).join(', ');
  }

  const fallbackName = String(source?.du_an || source?.project_name || '').trim();
  return fallbackName;
}

function detectMapMode(item) {
  if (item?.map_mode) return item.map_mode;
  if (Array.isArray(item?.source_color_value_map) && item.source_color_value_map.length) return 'color';
  if (item?.value_map_enabled) return 'data';
  return 'none';
}

function createMapEntry(item = {}) {
  return {
    id: item.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    input: String(item.input ?? ''),
    output: String(item.output ?? ''),
  };
}

function parseCompositeTransformRule(transformRule) {
  const ruleText = String(transformRule || '').trim();
  if (!ruleText) return null;

  const mapStartIndex = ruleText.indexOf(MAP_TRANSFORM_PREFIX);
  const hasMapRule = mapStartIndex >= 0;

  const prefixText = hasMapRule ? ruleText.slice(0, mapStartIndex) : ruleText;
  const prefixTokens = prefixText
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);

  const hasFillDown = prefixTokens.includes(FILL_DOWN_TOKEN);
  const primitiveTransform = prefixTokens.find((token) => transformOptions.includes(token)) || '';

  if (!hasMapRule) {
    return {
      fillDownEnabled: hasFillDown,
      mapEnabled: false,
      entries: [],
      fallback: '',
      primitiveTransform,
    };
  }

  const body = ruleText.slice(mapStartIndex + MAP_TRANSFORM_PREFIX.length);

  const entries = [];
  let fallback = '';

  body.split('|').forEach((part) => {
    const token = String(part || '').trim();
    if (!token) return;

    const delimiterIndex = token.indexOf('=');
    if (delimiterIndex < 0) return;

    const input = token.slice(0, delimiterIndex).trim();
    const output = token.slice(delimiterIndex + 1).trim();

    if (input === '*') {
      fallback = output;
      return;
    }

    entries.push(createMapEntry({ input, output }));
  });

  return {
    fillDownEnabled: hasFillDown,
    mapEnabled: true,
    entries,
    fallback,
    primitiveTransform,
  };
}

function normalizeMappingRowFromApi(item) {
  const schemaField = item?.schema_field || item?.field || {};
  const schemaId =
    item?.schema_id ??
    item?.schemaId ??
    schemaField?.schema_id ??
    schemaField?.schemaId ??
    schemaField?.schema?.id;

  const fieldId =
    item?.schema_field_id ??
    item?.schemaFieldId ??
    schemaField?.id ??
    item?.field_id ??
    item?.fieldId;

  const fieldName =
    item?.schema_field_name ??
    item?.field_label ??
    item?.field_name ??
    item?.field_key ??
    schemaField?.field_label ??
    schemaField?.name ??
    schemaField?.field_key ??
    '';

  const parsedTransformRule = parseCompositeTransformRule(item?.transform_rule);
  const parsedColorRules = parseColorValueMap(item?.source_color_value_map);

  return {
    schema_field_id: fieldId,
    schema_field_name: fieldName,
    schema_field_key:
      item?.schema_field_key ??
      item?.field_key ??
      schemaField?.field_key ??
      '',
    source_column_name: item?.source_column_name ?? item?.source_column ?? '',
    source_column_index:
      item?.source_column_index === null || item?.source_column_index === undefined
        ? ''
        : item?.source_column_index,
    transform_rule: parsedTransformRule?.mapEnabled
      ? (parsedTransformRule?.primitiveTransform || '')
      : (parsedTransformRule?.primitiveTransform || item?.transform_rule || ''),
    default_value: parsedTransformRule?.mapEnabled ? '' : (item?.default_value ?? ''),
    fill_down_enabled: Boolean(parsedTransformRule?.fillDownEnabled),
    value_map_enabled: Boolean(parsedTransformRule?.mapEnabled),
    value_map_entries: parsedTransformRule?.entries || [],
    value_map_fallback: parsedTransformRule?.fallback || '',
    is_active: item?.is_active ?? item?.status !== 'inactive',
    source_cell_bg_color: item?.source_cell_bg_color ?? '',
    source_cell_text_color: item?.source_cell_text_color ?? '',
    source_color_value_map: parsedColorRules,
    map_mode: detectMapMode({
      map_mode: item?.map_mode,
      source_color_value_map: parsedColorRules,
      value_map_enabled: Boolean(parsedTransformRule?.mapEnabled),
    }),
    _schema_id: schemaId,
  };
}

function detectSchemaIdFromMappings(list, rawData) {
  const fromRaw =
    rawData?.schema_id ||
    rawData?.schemaId ||
    rawData?.schema?.id ||
    rawData?.schema?.schema_id;

  if (fromRaw) return fromRaw;

  const found = list.find((item) => item._schema_id)?._schema_id;
  return found || '';
}

export function useSheetMapping() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetTabs, setSheetTabs] = useState([]);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [selectedGid, setSelectedGid] = useState('');
  const [headerRowIndex, setHeaderRowIndex] = useState(1);
  const [dataStartRowIndex, setDataStartRowIndex] = useState(2);
  const [dataEndRowIndex, setDataEndRowIndex] = useState('');
  const [headers, setHeaders] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewFormats, setPreviewFormats] = useState([]);
  const [schemaFields, setSchemaFields] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState('');
  const [mappings, setMappings] = useState([]);
  const [sourceDefaults, setSourceDefaults] = useState({
    projectValue: '',
    agencyValue: '',
  });
  const [sourceId, setSourceId] = useState('');
  const [sourceCreated, setSourceCreated] = useState(false);

  const [loadingInspect, setLoadingInspect] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [loadingCreateSource, setLoadingCreateSource] = useState(false);
  const [loadingSaveMapping, setLoadingSaveMapping] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);

  const [errorInspect, setErrorInspect] = useState('');
  const [errorPreview, setErrorPreview] = useState('');
  const [errorSchema, setErrorSchema] = useState('');
  const [errorMapping, setErrorMapping] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSchemas();
  }, []);

  useEffect(() => {
    if (!selectedSchemaId) {
      setSchemaFields([]);
      return;
    }
    fetchSchemaFields(selectedSchemaId);
  }, [selectedSchemaId]);

  useEffect(() => {
    const id = parseSpreadsheetId(sheetUrl);
    setSpreadsheetId(id);
  }, [sheetUrl]);

  useEffect(() => {
    setMappings((prev) => {
      if (!schemaFields.length) return [];
      const mapByFieldId = new Map(prev.map((item) => [String(item.schema_field_id), item]));

      function detectDefaultType(field) {
        const keyText = normalizeText(
          field?.raw?.field_key || field?.code || field?.name || ''
        );
        const labelText = normalizeText(field?.name || '');

        const isProject =
          keyText === 'duan' ||
          keyText === 'project' ||
          keyText === 'projectname' ||
          keyText.includes('duan') ||
          keyText.includes('project') ||
          labelText.includes('duan') ||
          labelText.includes('project');

        if (isProject) return 'project';

        const isAgency =
          keyText === 'daily' ||
          keyText === 'agency' ||
          keyText === 'agencyname' ||
          keyText.includes('daily') ||
          keyText.includes('agency') ||
          labelText.includes('daily') ||
          labelText.includes('agency');

        if (isAgency) return 'agency';

        return '';
      }

      return schemaFields.map((field) => {
        const existing = mapByFieldId.get(String(field.id));
        const defaultType = detectDefaultType(field);
        const autoDefault =
          defaultType === 'project'
            ? sourceDefaults.projectValue
            : defaultType === 'agency'
              ? sourceDefaults.agencyValue
              : '';

        if (existing) {
          const normalizedExisting = {
            fill_down_enabled: false,
            value_map_enabled: false,
            value_map_entries: [],
            value_map_fallback: '',
            source_color_value_map: [],
            map_mode: 'none',
            ...existing,
          };

          if (!existing.default_value && autoDefault) {
            return {
              ...normalizedExisting,
              default_value: autoDefault,
            };
          }
          return normalizedExisting;
        }

        return (
          {
            schema_field_id: field.id,
            schema_field_name: field.name || field.code,
            schema_field_key: field.field_key || field.code || '',
            source_column_name: '',
            source_column_index: '',
            transform_rule: 'trim',
            default_value: autoDefault || '',
            fill_down_enabled: false,
            value_map_enabled: false,
            value_map_entries: [],
            value_map_fallback: '',
            source_color_value_map: [],
            map_mode: 'none',
            is_active: true,
          }
        );
      });
    });
  }, [schemaFields, sourceDefaults]);

  const canPreview = useMemo(
    () => !!spreadsheetId && !!selectedSheetName && Number(headerRowIndex) > 0,
    [spreadsheetId, selectedSheetName, headerRowIndex]
  );

  const mappingLimitText = useMemo(
    () => `${mappings.length}/${schemaFields.length} fields`,
    [mappings.length, schemaFields.length]
  );

  async function fetchSchemas() {
    setLoadingSchemas(true);
    setErrorSchema('');
    try {
      const response = await schemaApi.getAll();
      const data = extractData(response);
      const list = Array.isArray(data) ? data : data?.items || data?.schemas || [];
      const activeSchemas = list
        .map((item) => ({
          id: item.id,
          schema_key: item.schema_key || item.key || '',
          schema_name: item.schema_name || item.name || `Schema ${item.id}`,
          status: item.status || (item.is_active ? 'active' : 'inactive'),
        }))
        .filter((item) => item.status === 'active');

      setSchemas(activeSchemas);
      setSelectedSchemaId((prev) => {
        if (prev && activeSchemas.some((item) => String(item.id) === String(prev))) {
          return prev;
        }
        return activeSchemas[0]?.id ? String(activeSchemas[0].id) : '';
      });
    } catch (error) {
      setSchemas([]);
      setSelectedSchemaId('');
      setErrorSchema(error?.response?.data?.message || 'Không tải được danh sách schemas');
    } finally {
      setLoadingSchemas(false);
    }
  }

  async function fetchSchemaFields(schemaId) {
    if (!schemaId) {
      setSchemaFields([]);
      return;
    }

    setLoadingSchema(true);
    setErrorSchema('');
    try {
      const response = await sourceApi.getSchemaFields({ schema_id: Number(schemaId) });
      const data = extractData(response);
      setSchemaFields(parseSchemaFields(data));
    } catch (error) {
      setErrorSchema(error?.response?.data?.message || 'Không tải được schema fields');
      setSchemaFields([]);
    } finally {
      setLoadingSchema(false);
    }
  }

  function selectSchema(schemaId) {
    setSelectedSchemaId(schemaId ? String(schemaId) : '');
  }

  async function inspectSheet(options = {}) {
    const {
      preserveSelectedSheet = false,
      spreadsheetId: overrideSpreadsheetId,
      url: overrideUrl,
      preferredSheetName,
    } = options;

    const effectiveSpreadsheetId = String(overrideSpreadsheetId || spreadsheetId || '').trim();
    const effectiveUrl = String(overrideUrl || sheetUrl || '').trim();

    if (!effectiveSpreadsheetId && !effectiveUrl) {
      setErrorInspect('Vui lòng cung cấp url hoặc spreadsheetId');
      return;
    }

    setLoadingInspect(true);
    setErrorInspect('');
    setSuccessMessage('');
    try {
      const payload = effectiveSpreadsheetId
        ? { spreadsheetId: effectiveSpreadsheetId }
        : { url: effectiveUrl };
      const response = await sourceApi.inspectSheet(payload);
      const data = extractData(response);
      const tabs = parseInspectResult(data);
      const preferredName = String(preferredSheetName ?? selectedSheetName ?? '').trim();
      setSheetTabs(tabs);
      if (tabs.length > 0) {
        if (preserveSelectedSheet && preferredName) {
          const currentTab = tabs.find((item) => String(item.sheetName).trim() === preferredName);
          if (currentTab) {
            setSelectedSheetName(currentTab.sheetName);
            setSelectedGid(currentTab?.gid ? String(currentTab.gid) : '');
          }
        } else {
          setSelectedSheetName(tabs[0].sheetName);
          setSelectedGid(tabs[0].gid ? String(tabs[0].gid) : '');
        }
      } else {
        if (!preserveSelectedSheet) {
          setSelectedSheetName('');
          setSelectedGid('');
        }
      }
    } catch (error) {
      setErrorInspect(error?.response?.data?.message || 'Inspect sheet thất bại');
      setSheetTabs([]);
    } finally {
      setLoadingInspect(false);
    }
  }

  async function previewSheet() {
    if (!canPreview) return;

    setLoadingPreview(true);
    setErrorPreview('');
    setSuccessMessage('');

    try {
      const payload = {
        spreadsheetId,
        sheetName: selectedSheetName,
        headerRowIndex: Number(headerRowIndex),
      };

      if (dataStartRowIndex !== '') {
        payload.dataStartRowIndex = Number(dataStartRowIndex);
      }

      if (dataEndRowIndex !== '') {
        payload.dataEndRowIndex = Number(dataEndRowIndex);
      }

      const response = await sourceApi.previewSheet(payload);
      const data = extractData(response);
      const parsed = parsePreviewResult(data);
      setHeaders(parsed.headers);
      setPreviewRows(parsed.rows.slice(0, 5));
      setPreviewFormats(parsed.formats ? parsed.formats.slice(0, 5) : []);
      setSuccessMessage('Preview thành công');
      applyAutoSuggestMappings(parsed.headers);
    } catch (error) {
      setErrorPreview(error?.response?.data?.message || 'Preview thất bại');
      setHeaders([]);
      setPreviewRows([]);
      setPreviewFormats([]);
    } finally {
      setLoadingPreview(false);
    }
  }

  function updateSelectedSheet(sheetName) {
    setSelectedSheetName(sheetName);
    const tab = sheetTabs.find((item) => item.sheetName === sheetName);
    setSelectedGid(tab?.gid ? String(tab.gid) : '');
  }

  const hydrateFromSource = useCallback(async (source) => {
    if (!source) return;

    const nextSheetUrl = source.spreadsheet_url || '';
    const nextSpreadsheetId = source.spreadsheet_id || parseSpreadsheetId(nextSheetUrl) || '';
    const nextSheetName = source.sheet_name || '';
    const nextGid = source.gid ? String(source.gid) : '';
    const sourceSchemaId =
      source.schema_id ||
      source.schemaId ||
      source.schema?.id ||
      source.schema?.schema_id ||
      '';

    setSheetUrl(nextSheetUrl);
    setSpreadsheetId(nextSpreadsheetId);
    setSheetTabs(nextSheetName ? [{ sheetName: nextSheetName, gid: nextGid }] : []);
    setSelectedSheetName(nextSheetName);
    setSelectedGid(nextGid);

    setHeaderRowIndex(
      source.header_row_index === undefined || source.header_row_index === null
        ? 1
        : source.header_row_index
    );
    setDataStartRowIndex(
      source.data_start_row_index === undefined || source.data_start_row_index === null
        ? 2
        : source.data_start_row_index
    );
    setDataEndRowIndex(source.data_end_row_index ?? '');
    setHeaders([]);
    setPreviewRows([]);
    setPreviewFormats([]);

    setSourceId(source.id ? String(source.id) : '');
    setSourceCreated(!!source?.id);
    setSourceDefaults({
      projectValue: extractProjectNamesFromSource(source),
      agencyValue: source.dai_ly || source.agency_name || '',
    });

    if (sourceSchemaId) {
      setSelectedSchemaId(String(sourceSchemaId));
    }

    setSuccessMessage('');
    setErrorMapping('');

    try {
      if (!source?.id) {
        setMappings([]);
        return;
      }

      const response = await sourceApi.getMappings(source.id);
      const data = extractData(response);
      const list = Array.isArray(data) ? data : data?.mappings || data?.items || [];
      const normalized = list.map(normalizeMappingRowFromApi);
      const detectedSchemaId = detectSchemaIdFromMappings(normalized, data) || sourceSchemaId;

      if (detectedSchemaId) {
        setSelectedSchemaId(String(detectedSchemaId));
      }

      let fieldsForMerge = schemaFields;

      if (!fieldsForMerge.length && detectedSchemaId) {
        try {
          const fieldsResponse = await sourceApi.getSchemaFields({ schema_id: Number(detectedSchemaId) });
          const fieldsData = extractData(fieldsResponse);
          fieldsForMerge = parseSchemaFields(fieldsData);
          setSchemaFields(fieldsForMerge);
        } catch {
          fieldsForMerge = [];
        }
      }

      const mapByFieldId = new Map(normalized.map((item) => [String(item.schema_field_id), item]));
      const mergedMappings = fieldsForMerge.length
        ? fieldsForMerge.map((field) => {
          const existing = mapByFieldId.get(String(field.id));
          if (existing) {
            return {
              ...existing,
              schema_field_key: existing.schema_field_key || field.field_key || field.code || '',
            };
          }

          return {
            schema_field_id: field.id,
            schema_field_name: field.name || field.code,
            schema_field_key: field.field_key || field.code || '',
            source_column_name: '',
            source_column_index: '',
            transform_rule: 'trim',
            default_value: '',
            fill_down_enabled: false,
            value_map_enabled: false,
            value_map_entries: [],
            value_map_fallback: '',
            source_color_value_map: [],
            map_mode: 'none',
            is_active: true,
          };
        })
        : normalized;

      setMappings(mergedMappings);

      const headerNames = normalized.map((item) => item.source_column_name).filter(Boolean);
      if (headerNames.length) {
        const uniqueHeaders = Array.from(new Set(headerNames));
        setHeaders((prev) => (prev?.length ? prev : uniqueHeaders));
      }
    } catch (error) {
      setErrorMapping(error?.response?.data?.message || 'Không tải được mapping hiện có');
    }
  }, [schemaFields]);

  const resetForCreate = useCallback(() => {
    setSheetUrl('');
    setSpreadsheetId('');
    setSheetTabs([]);
    setSelectedSheetName('');
    setSelectedGid('');
    setHeaderRowIndex(1);
    setDataStartRowIndex(2);
    setDataEndRowIndex('');
    setHeaders([]);
    setPreviewRows([]);
    setPreviewFormats([]);
    setMappings([]);
    setSourceDefaults({
      projectValue: '',
      agencyValue: '',
    });
    setSourceId('');
    setSourceCreated(false);
    setErrorInspect('');
    setErrorPreview('');
    setErrorMapping('');
    setSuccessMessage('');
  }, []);

  const getStateSnapshot = useCallback(() => ({
    sheetUrl,
    spreadsheetId,
    sheetTabs: [...sheetTabs],
    selectedSheetName,
    selectedGid,
    headerRowIndex,
    dataStartRowIndex,
    dataEndRowIndex,
    headers: [...headers],
    previewRows: Array.isArray(previewRows) ? previewRows.map((row) => [...row]) : [],
    previewFormats: Array.isArray(previewFormats) ? previewFormats.map((fmt) => [...fmt]) : [],
    selectedSchemaId,
    mappings: mappings.map((item) => ({ ...item })),
    sourceId,
    sourceCreated,
  }), [
    sheetUrl,
    spreadsheetId,
    sheetTabs,
    selectedSheetName,
    selectedGid,
    headerRowIndex,
    dataStartRowIndex,
    dataEndRowIndex,
    headers,
    previewRows,
    previewFormats,
    selectedSchemaId,
    mappings,
    sourceId,
    sourceCreated,
  ]);

  const restoreStateSnapshot = useCallback((snapshot) => {
    if (!snapshot) return;
    setSheetUrl(snapshot.sheetUrl ?? '');
    setSpreadsheetId(snapshot.spreadsheetId ?? '');
    setSheetTabs(Array.isArray(snapshot.sheetTabs) ? snapshot.sheetTabs : []);
    setSelectedSheetName(snapshot.selectedSheetName ?? '');
    setSelectedGid(snapshot.selectedGid ?? '');
    setHeaderRowIndex(snapshot.headerRowIndex ?? 1);
    setDataStartRowIndex(snapshot.dataStartRowIndex ?? 2);
    setDataEndRowIndex(snapshot.dataEndRowIndex ?? '');
    setHeaders(Array.isArray(snapshot.headers) ? snapshot.headers : []);
    setPreviewRows(Array.isArray(snapshot.previewRows) ? snapshot.previewRows : []);
    setPreviewFormats(Array.isArray(snapshot.previewFormats) ? snapshot.previewFormats : []);
    setSelectedSchemaId(snapshot.selectedSchemaId ?? '');
    setMappings(Array.isArray(snapshot.mappings) ? snapshot.mappings : []);
    setSourceId(snapshot.sourceId ?? '');
    setSourceCreated(Boolean(snapshot.sourceCreated));
  }, []);

  function updateMappingValue(index, key, value) {
    setMappings((prev) =>
      prev.map((mapping, mappingIndex) =>
        mappingIndex === index ? { ...mapping, [key]: value } : mapping
      )
    );
  }

  function applyAutoSuggestMappings(currentHeaders) {
    if (!currentHeaders?.length || !schemaFields?.length) return;

    setMappings((prev) =>
      prev.map((mapping) => {
        if (mapping.source_column_name) return mapping;

        const field = schemaFields.find((item) => String(item.id) === String(mapping.schema_field_id));
        const targetName = normalizeText(field?.name || field?.code || '');
        if (!targetName) return mapping;

        let best = { score: 0, header: '', index: -1 };
        currentHeaders.forEach((header, index) => {
          const score = diceCoefficient(targetName, normalizeText(String(header)));
          if (score > best.score) {
            best = { score, header: String(header), index };
          }
        });

        if (best.score >= 0.45) {
          return {
            ...mapping,
            source_column_name: best.header,
            source_column_index: '',
          };
        }

        return mapping;
      })
    );
  }

  async function createSource(formValues) {
    setLoadingCreateSource(true);
    setSuccessMessage('');
    setErrorMapping('');

    try {
      const agencyId = Number(formValues.agency_id);
      const normalizedProjectIds = Array.isArray(formValues.project_ids)
        ? formValues.project_ids
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
        : [];
      const firstProjectId = normalizedProjectIds[0] || Number(formValues.project_id);
      const daiLy = formValues.dai_ly?.trim();
      const sourceName = formValues.source_name?.trim();
      const sourceCode = buildAutoSourceCode(sourceName);

      if (!sourceName) {
        throw new Error('Thiếu source_name');
      }

      if (!(agencyId > 0 || daiLy)) {
        throw new Error('Thiếu Đại lý: chọn agency hoặc nhập dai_ly fallback');
      }

      const normalizedStartRowIndex =
        dataStartRowIndex === '' ? undefined : Number(dataStartRowIndex);
      const normalizedEndRowIndex =
        dataEndRowIndex === '' ? undefined : Number(dataEndRowIndex);

      const payload = {
        source_code: sourceCode,
        source_name: sourceName,
        project_ids: normalizedProjectIds.length ? normalizedProjectIds : undefined,
        project_id: firstProjectId > 0 ? firstProjectId : undefined,
        agency_id: agencyId > 0 ? agencyId : undefined,
        dai_ly: daiLy || undefined,
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: sheetUrl || undefined,
        sheet_name: selectedSheetName,
        gid: selectedGid || undefined,
        header_row_index: Number(headerRowIndex),
        data_start_row_index: normalizedStartRowIndex,
        data_end_row_index: normalizedEndRowIndex,
        data_start_condition:
          normalizedStartRowIndex === undefined
            ? normalizeDataCondition(formValues?.data_start_condition) ?? null
            : null,
        data_end_condition:
          normalizedEndRowIndex === undefined
            ? normalizeDataCondition(formValues?.data_end_condition) ?? null
            : null,
      };

      const response = await sourceApi.createSource(payload);
      const data = extractData(response);
      const id = data?.id || data?.sourceId || data?.source_id;

      if (!id) {
        throw new Error('Không nhận được sourceId từ backend');
      }

      setSourceId(String(id));
      setSourceCreated(true);
      setSourceDefaults({
        projectValue: extractProjectNamesFromSource(data),
        agencyValue: data?.dai_ly || data?.agency_name || daiLy || '',
      });
      setSuccessMessage('Tạo source thành công');
      return { ok: true, sourceId: String(id) };
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || 'Tạo source thất bại';
      setErrorMapping(message);
      return { ok: false, message };
    } finally {
      setLoadingCreateSource(false);
    }
  }

  function validateValueMapRule(mapping) {
    const fieldName = mapping.schema_field_name || mapping.schema_field_id || 'field';
    const mode =
      mapping.map_mode ||
      ((mapping.source_color_value_map || []).length ? 'color' : (mapping.value_map_enabled ? 'data' : 'none'));

    if (mode !== 'data' || !mapping.value_map_enabled) return null;

    const cleanedEntries = (mapping.value_map_entries || [])
      .map((entry) => ({
        input: String(entry?.input ?? '').trim(),
        output: String(entry?.output ?? '').trim(),
      }))
      .filter((entry) => entry.input || entry.output);

    if (!cleanedEntries.length) {
      return `Value Mapping của ${fieldName} cần ít nhất 1 dòng`;
    }

    const seenInputs = new Set();
    for (let i = 0; i < cleanedEntries.length; i += 1) {
      const entry = cleanedEntries[i];
      const rowLabel = `dòng ${i + 1}`;

      if (!entry.input || !entry.output) {
        return `Value Mapping ${fieldName}: ${rowLabel} cần đủ Input và Output`;
      }

      if (entry.input.includes('|') || entry.output.includes('|')) {
        return `Value Mapping ${fieldName}: ${rowLabel} không được chứa ký tự |`;
      }

      if (entry.input.includes('=')) {
        return `Value Mapping ${fieldName}: ${rowLabel} Input không được chứa ký tự =`;
      }

      const normalizedInput = entry.input.toLowerCase();
      if (seenInputs.has(normalizedInput)) {
        return `Value Mapping ${fieldName}: Input bị trùng (${entry.input})`;
      }
      seenInputs.add(normalizedInput);
    }

    const fallback = String(mapping.value_map_fallback ?? '').trim();
    if (fallback.includes('|')) {
      return `Value Mapping ${fieldName}: Fallback output không được chứa ký tự |`;
    }

    return null;
  }

  function validateColorValueMapRule(mapping) {
    const fieldName = mapping.schema_field_name || mapping.schema_field_id || 'field';
    const mode =
      mapping.map_mode ||
      ((mapping.source_color_value_map || []).length ? 'color' : (mapping.value_map_enabled ? 'data' : 'none'));

    if (mode !== 'color') return null;

    const rules = (mapping.source_color_value_map || [])
      .map((rule) => ({
        bgColor: normalizeHexColor(rule?.bgColor),
        textColor: normalizeHexColor(rule?.textColor),
        value: String(rule?.value ?? '').trim(),
      }))
      .filter((rule) => rule.bgColor || rule.textColor || rule.value);

    for (let i = 0; i < rules.length; i += 1) {
      const rule = rules[i];
      const rowLabel = `rule màu ${i + 1}`;

      if (!rule.value) {
        return `${fieldName}: ${rowLabel} cần nhập value`;
      }

      if (!rule.bgColor && !rule.textColor) {
        return `${fieldName}: ${rowLabel} cần bgColor hoặc textColor`;
      }
    }

    return null;
  }

  function validateRequiredFixedMappings(currentMappings) {
    const keyMap = new Map(
      (currentMappings || []).map((item) => [normalizeFieldKey(item?.schema_field_key), item])
    );

    for (const requiredKey of REQUIRED_FIXED_MAPPING_KEYS) {
      const row = keyMap.get(requiredKey);

      if (!row) {
        return `Schema đang chọn chưa có field bắt buộc: ${requiredKey}`;
      }

      if (row.is_active === false) {
        return `Field bắt buộc ${requiredKey} đang tắt. Vui lòng bật is_active.`;
      }

      // if (!hasSourceBinding(row)) {
      //   return `Field bắt buộc ${requiredKey} cần map source_column_name hoặc source_column_index.`;
      // }
    }

    return null;
  }

  function buildMappingPayload() {
    const cleaned = mappings
      .map((item) => {
        const mapMode =
          item.map_mode ||
          ((item.source_color_value_map || []).length ? 'color' : (item.value_map_enabled ? 'data' : 'none'));
        const fillDownEnabled = Boolean(item.fill_down_enabled);
        const valueMapEnabled = mapMode === 'data' && Boolean(item.value_map_enabled);

        const mapEntries = (item.value_map_entries || [])
          .map((entry) => ({
            input: String(entry?.input ?? '').trim(),
            output: String(entry?.output ?? '').trim(),
          }))
          .filter((entry) => entry.input && entry.output);

        const fallback = String(item.value_map_fallback ?? '').trim();

        const serializedMapRule = (() => {
          if (!valueMapEnabled) return undefined;

          const tokens = mapEntries.map((entry) => `${entry.input}=${entry.output}`);
          if (fallback) {
            tokens.push(`*=${fallback}`);
          }

          return `${MAP_TRANSFORM_PREFIX}${tokens.join('|')}`;
        })();

        const transformRuleTokens = [];
        if (fillDownEnabled) {
          transformRuleTokens.push(FILL_DOWN_TOKEN);
        }

        if (valueMapEnabled && serializedMapRule) {
          transformRuleTokens.push(serializedMapRule);
        }

        if (!valueMapEnabled && transformOptions.includes(item.transform_rule)) {
          transformRuleTokens.push(item.transform_rule);
        }

        const serializedTransformRule = transformRuleTokens.length
          ? transformRuleTokens.join(',')
          : undefined;

        const bgColor = String(item.source_cell_bg_color ?? '').trim();
        const textColor = String(item.source_cell_text_color ?? '').trim();
        const sourceColorValueMap = (item.source_color_value_map || [])
          .map((rule) => ({
            bgColor: normalizeHexColor(rule?.bgColor),
            textColor: normalizeHexColor(rule?.textColor),
            value: String(rule?.value ?? '').trim(),
          }))
          .filter((rule) => rule.value && (rule.bgColor || rule.textColor))
          .map((rule) => ({
            ...(rule.bgColor ? { bgColor: rule.bgColor } : {}),
            ...(rule.textColor ? { textColor: rule.textColor } : {}),
            value: rule.value,
          }));

        return {
          schema_field_id: item.schema_field_id,
          source_column_name: item.source_column_name?.trim() || undefined,
          source_column_index:
            item.source_column_index === '' || item.source_column_index === undefined
              ? undefined
              : Number(item.source_column_index),
          transform_rule: serializedTransformRule,
          default_value: valueMapEnabled ? null : (item.default_value ?? ''),
          is_active: Boolean(item.is_active),
          source_cell_bg_color: mapMode === 'color' ? (normalizeHexColor(bgColor) || undefined) : undefined,
          source_cell_text_color: mapMode === 'color' ? (normalizeHexColor(textColor) || undefined) : undefined,
          source_color_value_map:
            mapMode === 'color' && sourceColorValueMap.length ? sourceColorValueMap : undefined,
        };
      })
      .filter((item) => item.schema_field_id !== undefined && item.schema_field_id !== null);

    return { mappings: cleaned };
  }

  async function saveMappings() {
    if (!sourceId) {
      setErrorMapping('Cần tạo source trước khi lưu mapping');
      return { ok: false };
    }

    if (!selectedSchemaId) {
      setErrorMapping('Cần chọn schema trước khi lưu mapping');
      return { ok: false };
    }

    setLoadingSaveMapping(true);
    setErrorMapping('');
    setSuccessMessage('');

    try {
      const invalidMessage = mappings
        .map((mapping) => validateValueMapRule(mapping))
        .find(Boolean);

      const colorInvalidMessage = mappings
        .map((mapping) => validateColorValueMapRule(mapping))
        .find(Boolean);

      if (invalidMessage) {
        setErrorMapping(invalidMessage);
        return { ok: false, message: invalidMessage };
      }

      if (colorInvalidMessage) {
        setErrorMapping(colorInvalidMessage);
        return { ok: false, message: colorInvalidMessage };
      }

      const requiredFixedMessage = validateRequiredFixedMappings(mappings);
      if (requiredFixedMessage) {
        setErrorMapping(requiredFixedMessage);
        return { ok: false, message: requiredFixedMessage };
      }

      const payload = buildMappingPayload();
      mappingPayloadSchema.parse(payload);
      await sourceApi.saveMappings(sourceId, payload);
      setSuccessMessage('Lưu mappings thành công');
      return { ok: true };
    } catch (error) {
      const message =
        error?.issues?.[0]?.message ||
        error?.response?.data?.message ||
        'Lưu mapping thất bại';
      setErrorMapping(message);
      return { ok: false, message };
    } finally {
      setLoadingSaveMapping(false);
    }
  }

  async function syncNow() {
    if (!sourceId) {
      setErrorMapping('Chưa có source để sync');
      return { ok: false };
    }

    setLoadingSync(true);
    setErrorMapping('');
    setSuccessMessage('');

    try {
      await sourceApi.syncNow(sourceId);
      setSuccessMessage('Sync thủ công đã được kích hoạt');
      return { ok: true };
    } catch (error) {
      const message = error?.response?.data?.message || 'Sync thất bại';
      setErrorMapping(message);
      return { ok: false, message };
    } finally {
      setLoadingSync(false);
    }
  }

  return {
    sheetUrl,
    spreadsheetId,
    sheetTabs,
    selectedSheetName,
    selectedGid,
    headerRowIndex,
    dataStartRowIndex,
    dataEndRowIndex,
    headers,
    previewRows,
    previewFormats,
    schemaFields,
    schemas,
    selectedSchemaId,
    mappings,
    sourceId,
    sourceCreated,

    loadingInspect,
    loadingPreview,
    loadingSchema,
    loadingSchemas,
    loadingCreateSource,
    loadingSaveMapping,
    loadingSync,

    errorInspect,
    errorPreview,
    errorSchema,
    errorMapping,
    successMessage,

    setSheetUrl,
    setHeaderRowIndex,
    setDataStartRowIndex,
    setDataEndRowIndex,
    updateSelectedSheet,
    updateMappingValue,
    setErrorMapping,
    setSuccessMessage,
    setSpreadsheetId,
    selectSchema,
    hydrateFromSource,
    resetForCreate,
    getStateSnapshot,
    restoreStateSnapshot,

    inspectSheet,
    previewSheet,
    createSource,
    saveMappings,
    syncNow,

    canPreview,
    mappingLimitText,
    transformOptions,
    buildMappingPayload,
    fetchSchemas,
  };
}
