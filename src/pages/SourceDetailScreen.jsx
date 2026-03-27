import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Space, Alert } from 'antd';
import { EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import SourceDetailPage from '../components/SourceDetailPage';
import SheetInspectorPanel from '../components/SheetInspectorPanel';
import SheetPreviewTable from '../components/SheetPreviewTable';
import SourceForm from '../components/SourceForm';
import MappingTable from '../components/MappingTable';
import ActionBar from '../components/ActionBar';

export default function SourceDetailScreen({ catalog, mapping }) {
  const navigate = useNavigate();
  const { sourceId: sourceIdParam } = useParams();

  const outputSuggestions = useMemo(() => {
    const names = [
      ...(catalog.allProjects || []).map((item) => item?.name),
      ...(catalog.investors || []).map((item) => item?.name),
    ]
      .map((name) => String(name || '').trim())
      .filter(Boolean);

    return Array.from(new Set(names)).map((value) => ({ value }));
  }, [catalog.allProjects, catalog.investors]);

  const sourceDetail = useMemo(
    () => catalog.sources.find((item) => String(item.id) === String(sourceIdParam)) || null,
    [catalog.sources, sourceIdParam]
  );

  const [sourceDetailEditing, setSourceDetailEditing] = useState(false);
  const [mappingEditing, setMappingEditing] = useState(false);
  const [sourceEditSnapshot, setSourceEditSnapshot] = useState(null);
  const [mappingEditSnapshot, setMappingEditSnapshot] = useState(null);
  const [savingSource, setSavingSource] = useState(false);

  useEffect(() => {
    if (!sourceDetail?.id) return;
    (async () => {
      await mapping.fetchSchemas();
      await mapping.hydrateFromSource(sourceDetail);
      await mapping.inspectSheet({
        preserveSelectedSheet: true,
        spreadsheetId: sourceDetail.spreadsheet_id,
        url: sourceDetail.spreadsheet_url,
        preferredSheetName: sourceDetail.sheet_name,
      });
    })();
  }, [
    sourceDetail?.id,
    sourceDetail?.spreadsheet_id,
    sourceDetail?.spreadsheet_url,
    sourceDetail?.sheet_name,
    sourceDetail?.gid,
    sourceDetail?.header_row_index,
    sourceDetail?.data_start_row_index,
    sourceDetail?.data_end_row_index,
  ]);

  async function handleUpdateSource(values) {
    if (!sourceDetail?.id) return;
    setSavingSource(true);
    try {
      const ok = await catalog.updateSource(sourceDetail.id, values);
      if (ok !== false) {
        setSourceDetailEditing(false);
        setSourceEditSnapshot(null);
      }
    } finally {
      setSavingSource(false);
    }
  }

  function handleStartSourceEdit() {
    setSourceEditSnapshot({
      sourceDetail: sourceDetail ? { ...sourceDetail } : null,
      mappingState: mapping.getStateSnapshot(),
    });
    setSourceDetailEditing(true);
    setMappingEditing(false);
  }

  function handleCancelSourceEdit() {
    if (sourceEditSnapshot?.mappingState) {
      mapping.restoreStateSnapshot(sourceEditSnapshot.mappingState);
    }
    setSourceDetailEditing(false);
    setSourceEditSnapshot(null);
  }

  function handleStartMappingEdit() {
    setMappingEditSnapshot(mapping.getStateSnapshot());
    setMappingEditing(true);
  }

  function handleCancelMappingEdit() {
    if (mappingEditSnapshot) {
      mapping.restoreStateSnapshot(mappingEditSnapshot);
    }
    setMappingEditing(false);
    setMappingEditSnapshot(null);
  }

  async function handleSaveMappings() {
    const result = await mapping.saveMappings();
    if (result?.ok) {
      setMappingEditing(false);
      setMappingEditSnapshot(null);
    }
  }

  if (!sourceDetail) {
    return (
      <Alert
        type="warning"
        message="Không tìm thấy source"
        description="Source có thể đã bị xoá hoặc chưa được tải."
        action={<Button onClick={() => navigate('/sources')}>Quay lại danh sách source</Button>}
        showIcon
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sources')}>
          Danh sách source
        </Button>
      </Space>

      <Card
        title="Thông tin source"
        extra={
          sourceDetailEditing ? null : (
            <Button type="primary" icon={<EditOutlined />} onClick={handleStartSourceEdit}>
              Sửa
            </Button>
          )
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SourceDetailPage source={sourceDetail} />

          <SheetInspectorPanel
            sheetUrl={mapping.sheetUrl}
            spreadsheetId={mapping.spreadsheetId}
            sheetTabs={mapping.sheetTabs}
            selectedSheetName={mapping.selectedSheetName}
            headerRowIndex={mapping.headerRowIndex}
            dataStartRowIndex={mapping.dataStartRowIndex}
            dataEndRowIndex={mapping.dataEndRowIndex}
            loadingInspect={mapping.loadingInspect}
            loadingPreview={mapping.loadingPreview}
            errorInspect={mapping.errorInspect}
            errorPreview={mapping.errorPreview}
            onInspect={() =>
              mapping.inspectSheet({
                preserveSelectedSheet: true,
                preferredSheetName: mapping.selectedSheetName,
              })
            }
            onPreview={mapping.previewSheet}
            onSetSheetUrl={mapping.setSheetUrl}
            onSetHeaderRowIndex={mapping.setHeaderRowIndex}
            onSetDataStartRowIndex={mapping.setDataStartRowIndex}
            onSetDataEndRowIndex={mapping.setDataEndRowIndex}
            onSelectSheet={mapping.updateSelectedSheet}
            locked={!sourceDetailEditing}
          />

          <SheetPreviewTable
            headers={mapping.headers}
            previewRows={mapping.previewRows}
            previewFormats={mapping.previewFormats}
            loading={mapping.loadingPreview}
          />

          <SourceForm
            mode="edit"
            initialValues={sourceDetail}
            sheetUrl={mapping.sheetUrl}
            spreadsheetId={mapping.spreadsheetId}
            selectedSheetName={mapping.selectedSheetName}
            selectedGid={mapping.selectedGid}
            headerRowIndex={mapping.headerRowIndex}
            dataStartRowIndex={mapping.dataStartRowIndex}
            dataEndRowIndex={mapping.dataEndRowIndex}
            onSetDataStartRowIndex={mapping.setDataStartRowIndex}
            onSetDataEndRowIndex={mapping.setDataEndRowIndex}
            headers={mapping.headers}
            loading={savingSource}
            allProjects={catalog.allProjects}
            agencies={catalog.agencies}
            loadingProjects={catalog.loadingProjects}
            loadingAgencies={catalog.loadingAgencies}
            onSubmit={handleUpdateSource}
            onGoToCatalog={() => navigate('/catalog')}
            onCancel={handleCancelSourceEdit}
            disabled={!sourceDetailEditing}
            showEditActions={sourceDetailEditing}
          />
        </div>
      </Card>

      <Card
        title="Mapping"
        extra={
          mappingEditing ? null : (
            <Button type="primary" icon={<EditOutlined />} onClick={handleStartMappingEdit}>
              Sửa mapping
            </Button>
          )
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MappingTable
            headers={mapping.headers}
            schemas={mapping.schemas}
            selectedSchemaId={mapping.selectedSchemaId}
            schemaFields={mapping.schemaFields}
            mappings={mapping.mappings}
            mappingLimitText={mapping.mappingLimitText}
            loadingSchemas={mapping.loadingSchemas}
            loadingSchema={mapping.loadingSchema}
            errorSchema={mapping.errorSchema}
            onSelectSchema={mapping.selectSchema}
            onChange={mapping.updateMappingValue}
            outputSuggestions={outputSuggestions}
            disabled={!mappingEditing}
          />

          <Space>
            {mappingEditing ? (
              <>
                <Button
                  type="primary"
                  loading={mapping.loadingSaveMapping}
                  disabled={!mapping.sourceId}
                  onClick={handleSaveMappings}
                >
                  Save Mapping
                </Button>
                <Button onClick={handleCancelMappingEdit}>Huỷ</Button>
              </>
            ) : null}
          </Space>
        </div>
      </Card>

      <ActionBar
        sourceId={mapping.sourceId}
        loadingSaveMapping={false}
        loadingSync={mapping.loadingSync}
        onSaveMapping={() => {}}
        onSyncNow={mapping.syncNow}
        showSaveMapping={false}
        showSyncNow
      />
    </div>
  );
}
