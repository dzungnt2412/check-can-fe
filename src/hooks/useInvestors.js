import { useState, useEffect, useCallback } from 'react';
import { investorApi, projectApi, agencyApi, sourceApi } from '../api';

function extractList(response) {
  const raw = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(raw) ? raw : [];
}

function normalizeInvestor(item) {
  return {
    ...item,
    id: item.id,
    name: item.investor_name ?? item.name ?? '',
  };
}

function normalizeProject(item) {
  return {
    ...item,
    id: item.id,
    name: item.project_name ?? item.name ?? '',
  };
}

function normalizeAgency(item) {
  return {
    ...item,
    id: item.id,
    name: item.agency_name ?? item.name ?? '',
  };
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

  const payload = {
    operator,
  };

  if (hasColumnIndex) {
    const parsedIndex = Number(rawColumnIndex);
    if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
      return undefined;
    }
    payload.column_index = parsedIndex;
  } else if (columnName) {
    payload.column_name = columnName;
  } else {
    return undefined;
  }

  if (conditionValue) {
    payload.value = conditionValue;
  }

  if (['eq', 'ne', 'contains'].includes(operator) && !payload.value) {
    return undefined;
  }

  return payload;
}

function parseOptionalRowIndex(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const text = String(value).trim();
  if (!text) {
    return undefined;
  }

  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function normalizeProjectIdList(item) {
  const idsFromField = Array.isArray(item?.project_ids)
    ? item.project_ids
    : [];
  const idsFromLinked = Array.isArray(item?.linked_projects)
    ? item.linked_projects.map((project) => project?.id)
    : [];
  const fallbackId = item?.project_id ?? item?.project?.id;

  const merged = [...idsFromField, ...idsFromLinked, fallbackId]
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  return Array.from(new Set(merged));
}

function normalizeLinkedProjects(item) {
  if (Array.isArray(item?.linked_projects) && item.linked_projects.length) {
    return item.linked_projects
      .map((project) => ({
        id: Number(project?.id),
        project_name: String(project?.project_name || project?.name || '').trim(),
      }))
      .filter((project) => Number.isInteger(project.id) && project.id > 0 && project.project_name);
  }

  const fallbackName =
    item?.project_name ?? item?.project?.project_name ?? item?.project?.name ?? item?.du_an ?? '';
  const fallbackId = Number(item?.project_id ?? item?.project?.id);

  if (fallbackName && Number.isInteger(fallbackId) && fallbackId > 0) {
    return [{ id: fallbackId, project_name: String(fallbackName) }];
  }

  return [];
}

function normalizeSource(item) {
  const normalizedProjectIds = normalizeProjectIdList(item);
  const normalizedLinkedProjects = normalizeLinkedProjects(item);

  return {
    ...item,
    id: item.id,
    source_code: item.source_code ?? item.code ?? '',
    source_name: item.source_name ?? item.name ?? '',
    schema_id: item.schema_id ?? item.schema?.id ?? '',
    project_id: item.project_id ?? item.project?.id ?? '',
    project_ids: normalizedProjectIds,
    linked_projects: normalizedLinkedProjects,
    agency_id: item.agency_id ?? item.agency?.id ?? '',
    project_name: item.project_name ?? item.project?.project_name ?? item.project?.name ?? item.du_an ?? '',
    agency_name: item.agency_name ?? item.agency?.agency_name ?? item.agency?.name ?? item.dai_ly ?? '',
    du_an: item.du_an ?? '',
    dai_ly: item.dai_ly ?? '',
    spreadsheet_id: item.spreadsheet_id ?? '',
    spreadsheet_url: item.spreadsheet_url ?? '',
    sheet_name: item.sheet_name ?? '',
    gid: item.gid ?? '',
    header_row_index: item.header_row_index ?? '',
    data_start_row_index: item.data_start_row_index ?? '',
    data_end_row_index: item.data_end_row_index ?? '',
    data_start_condition: normalizeDataCondition(item.data_start_condition),
    data_end_condition: normalizeDataCondition(item.data_end_condition),
    is_active: item.is_active ?? true,
  };
}

export function useInvestors(options = {}) {
  const {
    canReadInvestors = true,
    canReadProjects = true,
    canReadAgencies = true,
    canReadSources = true,
  } = options;

  const [investors, setInvestors] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [sources, setSources] = useState([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchInvestors = useCallback(async () => {
    setLoadingInvestors(true);
    try {
      const res = await investorApi.getAll();
      setInvestors(extractList(res).map(normalizeInvestor));
    } catch (e) {
      setError(e?.response?.data?.message || 'Tải chủ đầu tư thất bại');
    } finally {
      setLoadingInvestors(false);
    }
  }, []);

  const fetchAllProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await projectApi.getAll();
      setAllProjects(extractList(res).map(normalizeProject));
    } catch (e) {
      setError(e?.response?.data?.message || 'Tải dự án thất bại');
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchAgencies = useCallback(async () => {
    setLoadingAgencies(true);
    try {
      const res = await agencyApi.getAll();
      setAgencies(extractList(res).map(normalizeAgency));
    } catch (e) {
      setError(e?.response?.data?.message || 'Tải đại lý thất bại');
    } finally {
      setLoadingAgencies(false);
    }
  }, []);

  const fetchSources = useCallback(async () => {
    setLoadingSources(true);
    try {
      const res = await sourceApi.getAll();
      setSources(extractList(res).map(normalizeSource));
    } catch (e) {
      setError(e?.response?.data?.message || 'Tải source thất bại');
    } finally {
      setLoadingSources(false);
    }
  }, []);

  useEffect(() => {
    if (canReadInvestors) {
      fetchInvestors();
    } else {
      setInvestors([]);
      setLoadingInvestors(false);
    }

    if (canReadProjects) {
      fetchAllProjects();
    } else {
      setAllProjects([]);
      setLoadingProjects(false);
    }

    if (canReadAgencies) {
      fetchAgencies();
    } else {
      setAgencies([]);
      setLoadingAgencies(false);
    }

    if (canReadSources) {
      fetchSources();
    } else {
      setSources([]);
      setLoadingSources(false);
    }
  }, [
    canReadInvestors,
    canReadProjects,
    canReadAgencies,
    canReadSources,
    fetchInvestors,
    fetchAllProjects,
    fetchAgencies,
    fetchSources,
  ]);

  async function createInvestor(name) {
    try {
      await investorApi.create({ investor_name: name, is_active: true });
      setSuccess('Tạo chủ đầu tư thành công');
      fetchInvestors();
    } catch (e) {
      setError(e?.response?.data?.message || 'Tạo chủ đầu tư thất bại');
    }
  }

  async function updateInvestor(id, name) {
    try {
      await investorApi.update(id, { investor_name: name, is_active: true });
      setSuccess('Cập nhật chủ đầu tư thành công');
      fetchInvestors();
    } catch (e) {
      setError(e?.response?.data?.message || 'Cập nhật thất bại');
    }
  }

  async function deleteInvestor(id) {
    try {
      await investorApi.delete(id);
      setSuccess('Đã xóa chủ đầu tư');
      fetchInvestors();
      fetchAllProjects();
    } catch (e) {
      setError(e?.response?.data?.message || 'Xóa thất bại');
    }
  }

  async function createProject(name) {
    try {
      await projectApi.create({ project_name: name, is_active: true });
      setSuccess('Tạo dự án thành công');
      fetchAllProjects();
      fetchSources();
    } catch (e) {
      setError(e?.response?.data?.message || 'Tạo dự án thất bại');
    }
  }

  async function updateProject(id, data) {
    try {
      await projectApi.update(id, {
        project_name: data.name,
        is_active: data.is_active ?? true,
      });
      setSuccess('Cập nhật dự án thành công');
      fetchAllProjects();
      fetchSources();
    } catch (e) {
      setError(e?.response?.data?.message || 'Cập nhật dự án thất bại');
    }
  }

  async function deleteProject(id) {
    try {
      await projectApi.delete(id);
      setSuccess('Đã xóa dự án');
      fetchAllProjects();
      fetchSources();
    } catch (e) {
      setError(e?.response?.data?.message || 'Xóa dự án thất bại');
    }
  }

  async function createAgency(name) {
    try {
      await agencyApi.create({ agency_name: name, is_active: true });
      setSuccess('Tạo đại lý thành công');
      fetchAgencies();
      fetchSources();
    } catch (e) {
      setError(e?.response?.data?.message || 'Tạo đại lý thất bại');
    }
  }

  async function updateAgency(id, name) {
    try {
      await agencyApi.update(id, { agency_name: name, is_active: true });
      setSuccess('Cập nhật đại lý thành công');
      fetchAgencies();
      fetchSources();
    } catch (e) {
      setError(e?.response?.data?.message || 'Cập nhật đại lý thất bại');
    }
  }

  async function deleteAgency(id) {
    try {
      await agencyApi.delete(id);
      setSuccess('Đã xóa đại lý');
      fetchAgencies();
      fetchSources();
    } catch (e) {
      setError(e?.response?.data?.message || 'Xóa đại lý thất bại');
    }
  }

  async function updateSource(id, data) {
    try {
      const normalizedProjectIds = Array.isArray(data.project_ids)
        ? data.project_ids
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
        : [];
      const projectId = normalizedProjectIds[0] || Number(data.project_id);
      const agencyId = Number(data.agency_id);
      const duAn = data.du_an?.trim();
      const daiLy = data.dai_ly?.trim();

      if (!(agencyId > 0 || daiLy)) {
        throw new Error('Cần chọn đại lý hoặc nhập dai_ly');
      }

      const dataEndRowIndex = parseOptionalRowIndex(data.data_end_row_index);
      const dataStartRowIndex = parseOptionalRowIndex(data.data_start_row_index);
      const dataStartRowIndexPayload = dataStartRowIndex === undefined ? null : dataStartRowIndex;
      const dataEndRowIndexPayload = dataEndRowIndex === undefined ? null : dataEndRowIndex;
      const dataStartCondition =
        dataStartRowIndex === undefined
          ? normalizeDataCondition(data.data_start_condition) ?? null
          : null;
      const dataEndCondition =
        dataEndRowIndex === undefined
          ? normalizeDataCondition(data.data_end_condition) ?? null
          : null;

      await sourceApi.update(id, {
        source_code: data.source_code?.trim(),
        source_name: data.source_name?.trim(),
        project_ids: normalizedProjectIds.length ? normalizedProjectIds : undefined,
        project_id: projectId > 0 ? projectId : undefined,
        agency_id: agencyId > 0 ? agencyId : undefined,
        du_an: duAn || undefined,
        dai_ly: daiLy || undefined,
        spreadsheet_id: data.spreadsheet_id?.trim(),
        spreadsheet_url: data.spreadsheet_url?.trim() || undefined,
        sheet_name: data.sheet_name?.trim() || undefined,
        gid: data.gid?.toString().trim() || undefined,
        header_row_index: data.header_row_index === '' ? undefined : Number(data.header_row_index),
        data_start_row_index: dataStartRowIndexPayload,
        data_start_condition: dataStartCondition,
        data_end_row_index: dataEndRowIndexPayload,
        data_end_condition: dataEndCondition,
        is_active: data.is_active ?? true,
      });

      setSuccess('Cập nhật source thành công');
      await fetchSources();
      return true;
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Cập nhật source thất bại');
      throw e;
    }
  }

  async function deleteSource(id) {
    try {
      await sourceApi.delete(id);
      setSuccess('Đã xóa source');
      fetchSources();
    } catch (e) {
      setError(e?.response?.data?.message || 'Xóa source thất bại');
    }
  }

  return {
    investors,
    allProjects,
    agencies,
    sources,
    loadingInvestors,
    loadingProjects,
    loadingAgencies,
    loadingSources,
    error,
    success,
    setError,
    setSuccess,
    fetchInvestors,
    fetchAllProjects,
    fetchAgencies,
    fetchSources,
    createInvestor,
    updateInvestor,
    deleteInvestor,
    createProject,
    updateProject,
    deleteProject,
    createAgency,
    updateAgency,
    deleteAgency,
    updateSource,
    deleteSource,
  };
}
