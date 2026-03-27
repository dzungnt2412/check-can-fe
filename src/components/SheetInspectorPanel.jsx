import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card, Form, Input, InputNumber, Select, Button, Alert, Row, Col, Typography,
} from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { parseSpreadsheetId } from '../utils/parseSpreadsheetId';

const { Text } = Typography;

function isValidSheetInput(value) {
  const normalized = String(value || '').trim();
  return Boolean(parseSpreadsheetId(normalized));
}

const inspectorSchema = z.object({
  sheetUrl: z
    .string()
    .trim()
    .min(1, 'Nhập URL hoặc Spreadsheet ID')
    .refine(isValidSheetInput, 'Google Sheet URL không hợp lệ'),
  headerRowIndex: z.coerce.number().int().positive('Header row phải > 0'),
  dataStartRowIndex: z
    .union([z.coerce.number().int().positive(), z.literal('')])
    .optional(),
  dataEndRowIndex: z.union([z.coerce.number().int().positive(), z.literal('')]).optional(),
});

export default function SheetInspectorPanel({
  sheetUrl,
  spreadsheetId,
  sheetTabs,
  selectedSheetName,
  headerRowIndex,
  dataStartRowIndex,
  dataEndRowIndex,
  loadingInspect,
  loadingPreview,
  errorInspect,
  errorPreview,
  onInspect,
  onPreview,
  onSetSheetUrl,
  onSetHeaderRowIndex,
  onSetDataStartRowIndex,
  onSetDataEndRowIndex,
  onSelectSheet,
  locked = false,
}) {
  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(inspectorSchema),
    defaultValues: {
      sheetUrl,
      headerRowIndex,
      dataStartRowIndex,
      dataEndRowIndex,
    },
  });

  useEffect(() => {
    setValue('sheetUrl', sheetUrl);
    setValue('headerRowIndex', headerRowIndex);
    setValue('dataStartRowIndex', dataStartRowIndex);
    setValue('dataEndRowIndex', dataEndRowIndex);
  }, [sheetUrl, headerRowIndex, dataStartRowIndex, dataEndRowIndex, setValue]);

  useEffect(() => {
    const subscription = watch((values) => {
      onSetSheetUrl(values.sheetUrl || '');
      onSetHeaderRowIndex(values.headerRowIndex || 1);
      onSetDataStartRowIndex(values.dataStartRowIndex === '' ? '' : values.dataStartRowIndex || '');
      onSetDataEndRowIndex(values.dataEndRowIndex === '' ? '' : values.dataEndRowIndex || '');
    });
    return () => subscription.unsubscribe();
  }, [watch, onSetSheetUrl, onSetHeaderRowIndex, onSetDataStartRowIndex, onSetDataEndRowIndex]);

  return (
    <Card title="1) Sheet Inspector">
      <Text type="secondary">Nhập link Google Sheet và inspect danh sách tabs.</Text>

      <form onSubmit={handleSubmit(onInspect)} style={{ marginTop: 16 }}>
        <Form layout="vertical" component={false}>
          <Form.Item
            label="Google Sheet URL / Spreadsheet ID"
            validateStatus={errors.sheetUrl ? 'error' : ''}
            help={errors.sheetUrl?.message}
          >
            <Controller
              name="sheetUrl"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  disabled={locked}
                />
              )}
            />
            {spreadsheetId ? (
              <Text type="success" style={{ fontSize: 12 }}>Spreadsheet ID: {spreadsheetId}</Text>
            ) : null}
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={8}>
              <Form.Item
                label="Header row index"
                validateStatus={errors.headerRowIndex ? 'error' : ''}
                help={errors.headerRowIndex?.message}
              >
                <Controller
                  name="headerRowIndex"
                  control={control}
                  render={({ field }) => (
                    <InputNumber {...field} min={1} style={{ width: '100%' }} disabled={locked} />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Data start row index">
                <Controller
                  name="dataStartRowIndex"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={1}
                      style={{ width: '100%' }}
                      placeholder="optional"
                      disabled={locked}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Data end row index">
                <Controller
                  name="dataEndRowIndex"
                  control={control}
                  render={({ field }) => (
                    <InputNumber
                      {...field}
                      min={1}
                      style={{ width: '100%' }}
                      placeholder="optional"
                      disabled={locked}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Button
            htmlType="submit"
            type="primary"
            icon={<SearchOutlined />}
            loading={loadingInspect}
            block
          >
            Inspect
          </Button>
        </Form>
      </form>

      {errorInspect ? (
        <Alert type="error" message={errorInspect} style={{ marginTop: 12 }} showIcon />
      ) : null}

      <Row gutter={12} align="bottom" style={{ marginTop: 16 }}>
        <Col flex="1">
          <Form layout="vertical">
            <Form.Item label="Sheet tab" style={{ marginBottom: 0 }}>
              <Select
                value={selectedSheetName || undefined}
                onChange={onSelectSheet}
                disabled={locked || !sheetTabs.length}
                placeholder="Chưa có tab"
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
                options={sheetTabs.map((tab) => ({
                  value: tab.sheetName,
                  label: `${tab.sheetName}${tab.gid ? ` (gid: ${tab.gid})` : ''}`,
                }))}
              />
            </Form.Item>
          </Form>
        </Col>
        <Col>
          <Button
            icon={<EyeOutlined />}
            loading={loadingPreview}
            disabled={!selectedSheetName}
            onClick={onPreview}
            style={{ marginBottom: 0 }}
          >
            Preview
          </Button>
        </Col>
      </Row>

      {errorPreview ? (
        <Alert type="error" message={errorPreview} style={{ marginTop: 12 }} showIcon />
      ) : null}
    </Card>
  );
}

