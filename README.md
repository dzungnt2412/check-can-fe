# check-can-fe

Giao diện ReactJS để cấu hình mapping dữ liệu Google Sheet.

## Chạy dự án

```bash
npm install
npm run dev
```

## Biến môi trường (tuỳ chọn)

Tạo file `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Cấu trúc chính

- `src/App.jsx`
- `src/api.js`
- `src/components/SheetInspectorPanel.jsx`
- `src/components/SheetPreviewTable.jsx`
- `src/components/SourceForm.jsx`
- `src/components/MappingTable.jsx`
- `src/components/ActionBar.jsx`
- `src/hooks/useSheetMapping.js`
- `src/utils/parseSpreadsheetId.js`
- `src/mocks/payloadExamples.js`
