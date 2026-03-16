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

const mappingRowSchema = z
  .object({
    schema_field_id: z.union([z.string(), z.number()]),
    source_column_name: z.string().optional(),
    source_column_index: z.number().int().nonnegative().optional(),
    transform_rule: z.string().optional(),
    default_value: z.string().optional(),
    is_active: z.boolean(),
  })
  .refine(
    (row) => {
      const hasName = !!row.source_column_name?.trim();
      const hasIndex = row.source_column_index !== undefined && row.source_column_index !== null;
      return hasName || hasIndex;
    },
    { message: 'Cần source_column_name hoặc source_column_index' }
  );

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
    raw: field,
  }));
}

function parsePreviewResult(result) {
  const headers = result?.headers || [];
  const rows = result?.preview || result?.rows || result?.sampleRows || [];
  return { headers, rows };
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

  return {
    schema_field_id: fieldId,
    schema_field_name: fieldName,
    source_column_name: item?.source_column_name ?? item?.source_column ?? '',
    source_column_index:
      item?.source_column_index === null || item?.source_column_index === undefined
        ? ''
        : item?.source_column_index,
    transform_rule: item?.transform_rule || '',
    default_value: item?.default_value ?? '',
    is_active: item?.is_active ?? item?.status !== 'inactive',
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
          if (!existing.default_value && autoDefault) {
            return {
              ...existing,
              default_value: autoDefault,
            };
          }
          return existing;
        }

        return (
          {
            schema_field_id: field.id,
            schema_field_name: field.name || field.code,
            source_column_name: '',
            source_column_index: '',
            transform_rule: 'trim',
            default_value: autoDefault || '',
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
      setSheetTabs(tabs);
      if (tabs.length > 0) {
        const hasCurrentSelection =
          preserveSelectedSheet &&
          selectedSheetName &&
          tabs.some((item) => item.sheetName === selectedSheetName);

        if (hasCurrentSelection) {
          const currentTab = tabs.find((item) => item.sheetName === selectedSheetName);
          setSelectedGid(currentTab?.gid ? String(currentTab.gid) : '');
        } else {
          setSelectedSheetName(tabs[0].sheetName);
          setSelectedGid(tabs[0].gid ? String(tabs[0].gid) : '');
        }
      } else {
        setSelectedSheetName('');
        setSelectedGid('');
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
      setSuccessMessage('Preview thành công');
      applyAutoSuggestMappings(parsed.headers);
    } catch (error) {
      setErrorPreview(error?.response?.data?.message || 'Preview thất bại');
      setHeaders([]);
      setPreviewRows([]);
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

    setSourceId(source.id ? String(source.id) : '');
    setSourceCreated(!!source?.id);
    setSourceDefaults({
      projectValue: source.du_an || source.project_name || '',
      agencyValue: source.dai_ly || source.agency_name || '',
    });

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
      const detectedSchemaId = detectSchemaIdFromMappings(normalized, data);

      if (detectedSchemaId) {
        setSelectedSchemaId(String(detectedSchemaId));
      }

      if (normalized.length) {
        setMappings(normalized);
        const headerNames = normalized.map((item) => item.source_column_name).filter(Boolean);
        if (headerNames.length) {
          const uniqueHeaders = Array.from(new Set(headerNames));
          setHeaders((prev) => (prev?.length ? prev : uniqueHeaders));
        }
      } else {
        setMappings([]);
      }
    } catch (error) {
      setMappings([]);
      setErrorMapping(error?.response?.data?.message || 'Không tải được mapping hiện có');
    }
  }, []);

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
      const projectId = Number(formValues.project_id);
      const agencyId = Number(formValues.agency_id);
      const duAn = formValues.du_an?.trim();
      const daiLy = formValues.dai_ly?.trim();

      if (!(projectId > 0 || duAn)) {
        throw new Error('Thiếu Dự án: chọn project hoặc nhập du_an fallback');
      }

      if (!(agencyId > 0 || daiLy)) {
        throw new Error('Thiếu Đại lý: chọn agency hoặc nhập dai_ly fallback');
      }

      const payload = {
        source_code: formValues.source_code,
        source_name: formValues.source_name,
        project_id: projectId > 0 ? projectId : undefined,
        agency_id: agencyId > 0 ? agencyId : undefined,
        du_an: duAn || undefined,
        dai_ly: daiLy || undefined,
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: sheetUrl || undefined,
        sheet_name: selectedSheetName,
        gid: selectedGid || undefined,
        header_row_index: Number(headerRowIndex),
        data_start_row_index:
          dataStartRowIndex === '' ? undefined : Number(dataStartRowIndex),
        data_end_row_index: dataEndRowIndex === '' ? undefined : Number(dataEndRowIndex),
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
        projectValue: data?.du_an || data?.project_name || duAn || '',
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

  function buildMappingPayload() {
    const cleaned = mappings
      .map((item) => ({
        schema_field_id: item.schema_field_id,
        source_column_name: item.source_column_name?.trim() || undefined,
        source_column_index:
          item.source_column_index === '' || item.source_column_index === undefined
            ? undefined
            : Number(item.source_column_index),
        transform_rule: transformOptions.includes(item.transform_rule)
          ? item.transform_rule
          : undefined,
        default_value: item.default_value ?? '',
        is_active: Boolean(item.is_active),
      }))
      .filter((item) => {
        const hasField = item.schema_field_id !== undefined && item.schema_field_id !== null;
        const hasName = !!item.source_column_name;
        const hasIndex = item.source_column_index !== undefined;
        return hasField && (hasName || hasIndex);
      });

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
