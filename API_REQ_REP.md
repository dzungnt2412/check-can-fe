# API Request/Response Guide

Tài liệu nhanh cho FE tích hợp phần inspect sheet, preview, tạo source, mapping, sync.

## Base URL

- Local: `http://localhost:3000`
- Header khuyến nghị: `Content-Type: application/json; charset=utf-8`

## Response format chung

### Success

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "...",
  "stack": "... (chỉ dev)"
}
```

---

## 1) Health Check

### Request

`GET /health`

### Response

```json
{
  "status": "ok",
  "timestamp": "2026-03-14T00:00:00.000Z"
}
```

---

## 2) Inspect Google Sheet

### Request

`POST /api/sources/inspect-sheet`

Body (dùng URL):

```json
{
  "url": "https://docs.google.com/spreadsheets/d/<spreadsheetId>/edit#gid=<gid>"
}
```

Body (dùng spreadsheetId):

```json
{
  "spreadsheetId": "14aMbqLc6NwRJSi_PvNlLBn5Dwu_361hM"
}
```

### Response

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "spreadsheetId": "14aMbqLc6NwRJSi_PvNlLBn5Dwu_361hM",
    "title": "QUỸ HÀNG VHOP2-3..xlsx",
    "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "detectedGid": "1592630955",
    "sheets": [
      {
        "title": "QUỸ HÀNG OCP2",
        "gid": null,
        "index": 1,
        "rowCount": 119,
        "columnCount": 20
      }
    ]
  }
}
```

---

## 3) Preview headers + sample rows

### Request

`POST /api/sources/preview`

```json
{
  "spreadsheetId": "14aMbqLc6NwRJSi_PvNlLBn5Dwu_361hM",
  "sheetName": "QUỸ HÀNG OCP2",
  "headerRowIndex": 2,
  "dataStartRowIndex": 3,
  "dataEndRowIndex": 7
}
```

### Response

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "headers": [
      "https://drive.google.com/file/...",
      "https://drive.google.com/file/...",
      "ĐẢO DỪA",
      "ĐĐ-01"
    ],
    "preview": [
      ["https://drive...", "https://drive...", "", "ĐĐD-45"],
      ["https://drive...", "https://drive...", "CHÀ LÀ", "CL15-25"]
    ]
  }
}
```

---

## 4) Tạo Source

### Request

`POST /api/sources`

```json
{
  "source_code": "OCP2_20260314",
  "source_name": "Quỹ hàng OCP2",
  "project_id": 2,
  "agency_id": 3,
  "spreadsheet_id": "14aMbqLc6NwRJSi_PvNlLBn5Dwu_361hM",
  "spreadsheet_url": "https://docs.google.com/spreadsheets/d/14aMbqLc6NwRJSi_PvNlLBn5Dwu_361hM/edit?gid=1592630955#gid=1592630955",
  "sheet_name": "QUỸ HÀNG OCP2",
  "gid": "1592630955",
  "header_row_index": 2,
  "data_start_row_index": 3,
  "data_end_row_index": 200,
  "data_end_condition": {
    "column_name": "Trạng thái",
    "operator": "eq",
    "value": "Hết hàng"
  }
}
```

Ghi chú:

- `sources` không còn lưu `investor_id` và không còn lưu `chu_dau_tu`.
- Khuyến nghị truyền `project_id`, `agency_id` để hệ thống tự gán `du_an`, `dai_ly`.
- Nếu chưa có id, vẫn có thể truyền trực tiếp `du_an`, `dai_ly`.
- Có thể cấu hình `data_end_condition` để tự xác định điểm dừng khi sync nếu không muốn set `data_end_row_index` cố định.
- `data_end_row_index` luôn được ưu tiên hơn `data_end_condition` nếu truyền đồng thời.

### Response

```json
{
  "success": true,
  "message": "Tạo nguồn thành công",
  "data": {
    "id": 3,
    "source_code": "OCP2_20260314",
    "source_name": "Quỹ hàng OCP2",
    "project_id": 2,
    "agency_id": 3,
    "du_an": "Ocean Park 2",
    "dai_ly": "Alpha Realty",
    "spreadsheet_id": "14aMbqLc6NwRJSi_PvNlLBn5Dwu_361hM",
    "sheet_name": "QUỸ HÀNG OCP2",
    "header_row_index": 2,
    "data_start_row_index": 3,
    "data_end_row_index": 200,
    "is_active": true
  }
}
```

### Xóa Source

`DELETE /api/sources/:id`

Ví dụ: `DELETE /api/sources/3`

### Response

```json
{
  "success": true,
  "message": "Xóa nguồn thành công",
  "data": {
    "deleted": true
  }
}
```

---

## 4.1) CRUD Chủ đầu tư (investors)

### List

`GET /api/investors`

### Get detail

`GET /api/investors/:id`

### Create

`POST /api/investors`

```json
{
  "investor_name": "Vinhomes",
  "is_active": true
}
```

### Update

`PUT /api/investors/:id`

```json
{
  "investor_name": "Vinhomes Updated",
  "is_active": true
}
```

### Delete

`DELETE /api/investors/:id`

---

## 4.2) CRUD Dự án (projects)

### List

`GET /api/projects`

### Get detail

`GET /api/projects/:id`

### Create

`POST /api/projects`

---

## 4.8) Tìm kiếm Units theo catalog fields

### List units cơ bản

`GET /api/units`

Các filter cũ vẫn giữ nguyên:

- `unit_code`
- `project_id`
- `agency_id`
- `schema_id`
- `page`
- `limit`

### Filter gần đúng theo 1 catalog field

Có thể truyền theo `catalog_field_key` hoặc `catalog_field_id`.

Ví dụ theo key:

`GET /api/units?catalog_field_key=ma_can&catalog_field_value=A-10`

Ví dụ theo id:

`GET /api/units?catalog_field_id=5&catalog_field_value=A-10`

Behavior:

- Backend chỉ lấy các `unit` thuộc schema có chứa catalog field đó.
- Sau đó so khớp gần đúng bằng `ILIKE` trên `units.dynamic_data[field_key]`.
- Có thể kết hợp với `project_id`, `agency_id`, `schema_id`, `unit_code` theo logic `AND`.

### Filter nhiều catalog cùng lúc

Truyền `catalog_filters` dưới dạng JSON array trong query string.

Ví dụ:

```text
GET /api/units?catalog_filters=[{"catalog_field_key":"ma_can","value":"A-10"},{"catalog_field_key":"tang","value":"12"}]
```

Hoặc trộn `catalog_field_id` và `catalog_field_key`:

```text
GET /api/units?catalog_filters=[{"catalog_field_id":5,"value":"A-10"},{"catalog_field_key":"huong","value":"dong"}]
```

Behavior:

- Mỗi item trong `catalog_filters` là một điều kiện `AND`.
- Mỗi điều kiện yêu cầu schema của unit có liên kết tới catalog tương ứng.
- Giá trị được tìm theo kiểu gần đúng `ILIKE`.

### Validate

- `catalog_field_id` phải là số nguyên dương.
- `catalog_field_key` chỉ gồm chữ thường, số, `_`, `-`.
- Khi truyền `catalog_field_id` hoặc `catalog_field_key` thì bắt buộc có `catalog_field_value`.
- `catalog_filters` phải là JSON array, mỗi item phải có `catalog_field_id` hoặc `catalog_field_key`, và `value`.

```json
{
  "project_name": "Ocean Park 2",
  "is_active": true
}
```

### Update

`PUT /api/projects/:id`

```json
{
  "project_name": "Ocean Park 2 - Phase 2",
  "is_active": true
}
```

### Delete

`DELETE /api/projects/:id`

## 4.3) CRUD Đại lý (agencies)

### List

`GET /api/agencies`

### Get detail

`GET /api/agencies/:id`

### Create

`POST /api/agencies`

```json
{
  "agency_name": "Alpha Realty",
  "is_active": true
}
```

### Update

`PUT /api/agencies/:id`

```json
{
  "agency_name": "Alpha Realty Updated",
  "is_active": true
}
```

### Delete

`DELETE /api/agencies/:id`

---

## 4.4) CRUD Schemas

### List

`GET /api/schemas`

Query hỗ trợ:

- `include_inactive=true|false` (mặc định chỉ trả schema active)

Ví dụ: `GET /api/schemas?include_inactive=true`

### Response

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "schema_key": "default",
      "schema_name": "Default Schema",
      "description": "Schema mặc định cho dynamic_data",
      "is_active": true,
      "created_at": "2026-03-15T10:00:00.000Z",
      "updated_at": "2026-03-15T10:00:00.000Z"
    }
  ]
}
```

### Get detail

`GET /api/schemas/:id`

### Create

`POST /api/schemas`

```json
{
  "schema_key": "op2_landlot",
  "schema_name": "Schema Ocean Park 2",
  "description": "Schema động cho sản phẩm đất nền OP2",
  "is_active": true
}
```

### Update

`PUT /api/schemas/:id`

```json
{
  "schema_name": "Schema Ocean Park 2 - Updated",
  "description": "Cập nhật mô tả",
  "is_active": true
}
```

### Delete

`DELETE /api/schemas/:id`

### Rule validate quan trọng

- `schema_key` là bắt buộc, unique (không phân biệt hoa/thường).
- `schema_key` chỉ cho phép `a-z`, `0-9`, `_`, `-`.
- Không thể xóa `default schema`.
- Không thể xóa schema nếu đang có `units` liên kết.
- Khi xóa schema, hệ thống tự xóa kèm toàn bộ `schema_fields` và `source_field_mappings` liên quan.

---

## 4.5) CRUD Field Catalogs (field dùng chung)

Field catalog là nơi định nghĩa field 1 lần để tái sử dụng cho nhiều schema.

### List

`GET /api/field-catalogs`

Query hỗ trợ:

- `include_inactive=true|false` (mặc định chỉ trả field active)

### Get detail

`GET /api/field-catalogs/:id`

### Create

`POST /api/field-catalogs`

```json
{
  "field_key": "huong_nha",
  "field_label": "Hướng nhà",
  "data_type": "string",
  "input_type": "select",
  "is_active": true
}
```

### Update

`PUT /api/field-catalogs/:id`

```json
{
  "field_label": "Hướng căn",
  "input_type": "select",
  "is_active": true
}
```

### Delete

`DELETE /api/field-catalogs/:id`

Rule:

- Không thể xóa nếu field catalog đang được thêm vào schema (`schema_fields`).

---

## 5) Lấy danh sách schema fields

### Request

`GET /api/schema-fields`

Query hỗ trợ:

- `schema_id` (lọc theo schema cụ thể)
- `include_inactive=true|false` (mặc định chỉ trả field active)

Ví dụ:

- `GET /api/schema-fields?schema_id=1`
- `GET /api/schema-fields?schema_id=1&include_inactive=true`

### Response

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 5,
      "schema_id": 1,
      "schema_key": "default",
      "schema_name": "Default Schema",
      "field_key": "ma_can",
      "field_label": "Mã căn",
      "data_type": "string",
      "input_type": "text",
      "required": true,
      "default_value": null,
      "options": null,
      "sort_order": 6,
      "status": "active",
      "is_active": true
    },
    {
      "id": 8,
      "schema_id": 1,
      "schema_key": "default",
      "schema_name": "Default Schema",
      "field_key": "dien_tich",
      "field_label": "Diện tích (m²)",
      "data_type": "number",
      "input_type": "number",
      "required": false,
      "default_value": null,
      "options": null,
      "sort_order": 9,
      "status": "active",
      "is_active": true
    }
  ]
}
```

`schema_fields` hiện là bản ghi liên kết field catalog vào schema:

- `catalog_field_id` trỏ tới `/api/field-catalogs/:id`
- Có thể override theo schema: `required`, `default_value`, `options`, `sort_order`, `status`

---

## 5.1) Lấy chi tiết schema field

### Request

`GET /api/schema-fields/:id`

Ví dụ: `GET /api/schema-fields/5`

### Response

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 5,
    "schema_id": 1,
    "schema_key": "default",
    "schema_name": "Default Schema",
    "field_key": "ma_can",
    "field_label": "Mã căn",
    "data_type": "string",
    "input_type": "text",
    "required": true,
    "default_value": null,
    "options": null,
    "sort_order": 6,
    "status": "active",
    "is_active": true
  }
}
```

---

## 5.2) Tạo schema field

### Request

`POST /api/schema-fields`

```json
{
  "schema_id": 1,
  "catalog_field_id": 11,
  "required": false,
  "default_value": null,
  "options": [
    { "value": "Đông", "label": "Đông" },
    { "value": "Đông Nam", "label": "Đông Nam" }
  ],
  "sort_order": 20,
  "status": "active"
}
```

Hoặc tạo mới catalog + add vào schema trong 1 request:

```json
{
  "schema_id": 1,
  "field_key": "huong_nha",
  "field_label": "Hướng nhà",
  "data_type": "string",
  "input_type": "select",
  "required": false,
  "default_value": null,
  "options": [
    { "value": "Đông", "label": "Đông" },
    { "value": "Đông Nam", "label": "Đông Nam" }
  ],
  "sort_order": 20,
  "status": "active"
}
```

### Add field đã có vào schema (khuyến nghị)

`POST /api/schema-fields/attach`

```json
{
  "schema_id": 1,
  "catalog_field_id": 11,
  "required": true,
  "sort_order": 20,
  "status": "active"
}
```

### Response

```json
{
  "success": true,
  "message": "Tạo schema field thành công",
  "data": {
    "id": 21,
    "schema_id": 1,
    "field_key": "huong_nha",
    "field_label": "Hướng nhà",
    "data_type": "string",
    "input_type": "select",
    "required": false,
    "default_value": null,
    "options": [
      { "value": "Đông", "label": "Đông" },
      { "value": "Đông Nam", "label": "Đông Nam" }
    ],
    "sort_order": 20,
    "status": "active",
    "is_active": true
  }
}
```

---

## 5.3) Cập nhật schema field

### Request

`PUT /api/schema-fields/:id`

Ví dụ: `PUT /api/schema-fields/21`

```json
{
  "field_label": "Hướng căn",
  "required": true,
  "options": [
    { "value": "Đông", "label": "Đông" },
    { "value": "Tây", "label": "Tây" }
  ],
  "status": "active"
}
```

### Response

```json
{
  "success": true,
  "message": "Cập nhật schema field thành công",
  "data": {
    "id": 21,
    "schema_id": 1,
    "field_key": "huong_nha",
    "field_label": "Hướng căn",
    "data_type": "string",
    "input_type": "select",
    "required": true,
    "default_value": null,
    "options": [
      { "value": "Đông", "label": "Đông" },
      { "value": "Tây", "label": "Tây" }
    ],
    "sort_order": 20,
    "status": "active",
    "is_active": true
  }
}
```

---

## 5.4) Xóa schema field

### Request

`DELETE /api/schema-fields/:id`

### Response

```json
{
  "success": true,
  "message": "Xóa schema field thành công",
  "data": {
    "deleted": true
  }
}
```

---

## 5.5) Rule validate quan trọng

- `field_key` phải unique theo từng `schema_id`.
- `default_value`, `options` phải là JSON hợp lệ (gửi object/array hoặc JSON string).
- `options` nếu có thì phải là JSON array hoặc `null`.
- Không thể xóa schema field nếu đang có mapping liên kết.

---

## 6) Lưu mapping cho source

### Request

`PUT /api/mappings/:sourceId`

Ví dụ: `PUT /api/mappings/3`

```json
{
  "mappings": [
    {
      "schema_field_id": 5,
      "source_column_name": "Mã căn",
      "transform_rule": "trim",
      "default_value": null,
      "is_active": true
    },
    {
      "schema_field_id": 8,
      "source_column_name": "DT đất",
      "transform_rule": "parseViNumber",
      "default_value": null,
      "is_active": true
    },
    {
      "schema_field_id": 14,
      "source_column_name": "Trạng thái",
      "default_value": "Còn hàng",
      "is_active": true
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "message": "Lưu mapping thành công",
  "data": [
    {
      "source_id": 3,
      "schema_field_id": 5,
      "field_key": "ma_can",
      "source_column_name": "Mã căn",
      "transform_rule": "trim",
      "is_active": true
    }
  ]
}
```

Transform rule hỗ trợ:

- `trim`
- `uppercase`
- `lowercase`
- `parseViNumber`
- `extractNumber`
- `extractInteger`
- `fillDown` (kéo giá trị từ dòng trước nếu ô hiện tại rỗng, chỉ áp dụng cho mapping được bật rule này)
- `map:<from>=<to>|<from2>=<to2>`

Ví dụ map giá trị để lưu:

- `transform_rule: "map:1=ocean park|2=ocean park 2"`
  - Nếu giá trị nguồn là `1` thì lưu `ocean park`
  - Nếu giá trị nguồn là `2` thì lưu `ocean park 2`
- Hỗ trợ fallback: `transform_rule: "map:1=ocean park|*=khac"`
  - Nếu không khớp key cụ thể sẽ lưu `khac`

Kết hợp nhiều rule:

- `transform_rule: "fillDown,map:lk=liền kề|bt=biệt thự|*=khác"`
  - Dòng rỗng sẽ lấy giá trị dòng trước cùng cột trước khi map

---

## 7) Lấy mapping hiện tại

### Request

`GET /api/mappings/:sourceId`

Ví dụ: `GET /api/mappings/3`

### Response

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "source_id": 3,
      "schema_field_id": 5,
      "field_key": "ma_can",
      "source_column_name": "Mã căn",
      "source_column_index": null,
      "transform_rule": "trim",
      "default_value": null,
      "is_active": true
    }
  ]
}
```

---

## 8) Sync thủ công theo source

### Request

`POST /api/sync/:sourceId`

Ví dụ: `POST /api/sync/3`

### Response

```json
{
  "success": true,
  "message": "Đồng bộ hoàn tất: 150 mới, 30 cập nhật",
  "data": {
    "inserted": 150,
    "updated": 30,
    "total": 180
  }
}
```

Rule sync hiện tại:

- Dữ liệu sync ghi vào bảng `units` (không ghi vào `master_units`).
- Upsert theo khóa `(project_id, unit_code)`.
- Nếu trùng `mã căn` trong cùng dự án thì update bản ghi cũ, không tạo mới.
- Nếu không trùng thì insert mới.
- Nếu có `data_end_condition` (và không có `data_end_row_index`), hệ thống sẽ tìm dòng đầu tiên thỏa điều kiện để cắt dữ liệu.

`data_end_condition` hỗ trợ:

- `column_name` hoặc `column_index` (0-based)
- `operator`: `eq`, `ne`, `contains`, `empty`, `not_empty`
- `value`: bắt buộc với `eq`, `ne`, `contains`

---

## 9) CRUD Units (Hybrid fixed + dynamic_data)

`units` là bảng dữ liệu thật của căn theo thiết kế hybrid:

- Field cố định là cột riêng: `unit_code`, `project_id`, `agency_id`, `schema_id`
- Field động lưu trong `dynamic_data` (jsonb)
- `dynamic_data` được validate theo `schema_fields` của `schema_id`
- Chỉ cho phép key hợp lệ theo schema

### 9.1) List units

`GET /api/units?page=1&limit=20&project_id=2&unit_code=A1`

Query hỗ trợ:

- `unit_code` (partial match)
- `project_id`, `agency_id`, `schema_id`
- `page`, `limit`

### Response

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "data": [
      {
        "id": 10,
        "unit_code": "A1-01",
        "project_id": 2,
        "agency_id": 3,
        "schema_id": 5,
        "dynamic_data": {
          "dien_tich": 72.5,
          "gia_ban": 3200000000,
          "huong_nha": "Đông Nam",
          "phap_ly": "Sổ đỏ"
        },
        "project_name": "Ocean Park 2",
        "agency_name": "Alpha Realty",
        "schema_key": "default",
        "schema_name": "Default Schema"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 9.2) Get unit detail

`GET /api/units/:id`

Ví dụ: `GET /api/units/10`

### Response

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "unit": {
      "id": 10,
      "unit_code": "A1-01",
      "project_id": 2,
      "agency_id": 3,
      "schema_id": 5,
      "dynamic_data": {
        "dien_tich": 72.5,
        "gia_ban": 3200000000,
        "huong_nha": "Đông Nam",
        "phap_ly": "Sổ đỏ",
        "so_phong": 3
      },
      "created_at": "2026-03-15T09:00:00.000Z",
      "updated_at": "2026-03-15T09:00:00.000Z"
    },
    "schema_fields": [
      {
        "id": 101,
        "schema_id": 5,
        "field_key": "huong_nha",
        "field_label": "Hướng nhà",
        "data_type": "string",
        "input_type": "select",
        "required": true,
        "default_value": null,
        "options": [
          { "value": "Đông", "label": "Đông" },
          { "value": "Đông Nam", "label": "Đông Nam" }
        ],
        "sort_order": 1,
        "status": "active"
      }
    ]
  }
}
```

### 9.3) Create unit

`POST /api/units`

```json
{
  "unit_code": "A1-01",
  "project_id": 2,
  "agency_id": 3,
  "schema_id": 5,
  "dynamic_data": {
    "dien_tich": 72.5,
    "gia_ban": 3200000000,
    "huong_nha": "Đông Nam",
    "phap_ly": "Sổ đỏ",
    "so_phong": 3
  }
}
```

### 9.4) Update unit

`PUT /api/units/:id`

```json
{
  "dynamic_data": {
    "gia_ban": 3300000000,
    "phap_ly": "HĐMB"
  }
}
```

### 9.5) Delete unit

`DELETE /api/units/:id`

Response:

```json
{
  "success": true,
  "message": "Xóa căn thành công",
  "data": {
    "deleted": true
  }
}
```

---

## Gợi ý FE integration flow

1. `inspect-sheet` (nhập link)
2. chọn tab + row index
3. `preview`
4. `create source` (khuyến nghị truyền `project_id`)
5. `get field-catalogs` (nếu cần tạo field mới thì tạo ở catalog)
6. `add field vào schema` (`POST /api/schema-fields/attach`) hoặc tạo trực tiếp qua `POST /api/schema-fields`
7. `get schema-fields`
8. `save mappings`
9. `sync`
10. `GET /api/units` để xem dữ liệu đã sync
