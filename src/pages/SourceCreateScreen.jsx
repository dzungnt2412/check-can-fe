import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import SheetInspectorPanel from '../components/SheetInspectorPanel';
import SheetPreviewTable from '../components/SheetPreviewTable';
import SourceForm from '../components/SourceForm';
import MappingTable from '../components/MappingTable';
import ActionBar from '../components/ActionBar';

export default function SourceCreateScreen({ catalog, mapping }) {
  const navigate = useNavigate();

  const outputSuggestions = useMemo(() => {
    const names = [
      ...(catalog.allProjects || []).map((item) => item?.name),
      ...(catalog.investors || []).map((item) => item?.name),
    ]
      .map((name) => String(name || '').trim())
      .filter(Boolean);

    return Array.from(new Set(names)).map((value) => ({ value }));
  }, [catalog.allProjects, catalog.investors]);

  useEffect(() => {
    mapping.resetForCreate();
    mapping.fetchSchemas();
  }, []);

  const handleCreateSource = useCallback(
    async (values) => {
      mapping.setErrorMapping('');
      mapping.setSuccessMessage('');
      const result = await mapping.createSource(values);
      if (result?.ok) {
        catalog.fetchSources();
      }
    },
    [catalog, mapping]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sources')}>
          Danh sách source
        </Button>
      </Space>

      <Card title="Thông tin source">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            onInspect={mapping.inspectSheet}
            onPreview={mapping.previewSheet}
            onSetSheetUrl={mapping.setSheetUrl}
            onSetHeaderRowIndex={mapping.setHeaderRowIndex}
            onSetDataStartRowIndex={mapping.setDataStartRowIndex}
            onSetDataEndRowIndex={mapping.setDataEndRowIndex}
            onSelectSheet={mapping.updateSelectedSheet}
          />

          <SheetPreviewTable
            headers={mapping.headers}
            previewRows={mapping.previewRows}
            loading={mapping.loadingPreview}
          />

          <SourceForm
            spreadsheetId={mapping.spreadsheetId}
            selectedSheetName={mapping.selectedSheetName}
            selectedGid={mapping.selectedGid}
            headerRowIndex={mapping.headerRowIndex}
            dataStartRowIndex={mapping.dataStartRowIndex}
            dataEndRowIndex={mapping.dataEndRowIndex}
            headers={mapping.headers}
            loading={mapping.loadingCreateSource}
            allProjects={catalog.allProjects}
            agencies={catalog.agencies}
            loadingProjects={catalog.loadingProjects}
            loadingAgencies={catalog.loadingAgencies}
            onSubmit={handleCreateSource}
            onGoToCatalog={() => navigate('/catalog')}
          />
        </div>
      </Card>

      <Card title="Mapping">
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
          />

          <Space>
            <Button
              type="primary"
              loading={mapping.loadingSaveMapping}
              disabled={!mapping.sourceId}
              onClick={mapping.saveMappings}
            >
              Save Mapping
            </Button>
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
