# API Request/Response Guide

Tài liệu nhanh cho FE tích hợp phần inspect sheet, preview, tạo source, mapping, sync.

## Base URL

- Local: `http://localhost:3000`
- Header khuyến nghị: `Content-Type: application/json; charset=utf-8`

## Xác thực Super Admin

- Các endpoint nghiệp vụ (`/api/*`, `/units`) yêu cầu token super_admin.
- Public chỉ có:
  - `GET /health`
  - `POST /api/auth/login`
- Đăng nhập ưu tiên đọc tài khoản từ bảng `users` (role=`super_admin`), fallback sang `.env` nếu DB chưa có user.

Quyền `sale` hiện có:

- `GET /api/units` (xem danh sách units + tra cứu theo schema fields qua query)
- `GET /api/projects` (xem danh sách dự án)
- `GET /api/agencies` (xem danh sách đại lý)
- `GET /api/field-catalogs` và `GET /api/field-catalogs/:id` (xem catalog fields)

### Đăng nhập

`POST /api/auth/login`

```json
{
  "username": "admin",
  "password": "your_secure_admin_password"
}
```

Response:

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token_type": "Bearer",
    "access_token": "<JWT>",
    "expires_in": "8h",
    "user": {
      "username": "admin",
      "role": "super_admin"
    }
  }
}
```

Header cho các API còn lại:

```http
Authorization: Bearer <access_token>
```

## Quản lý Users (chỉ super_admin)

### List users

`GET /api/users`

### Get user detail

`GET /api/users/:id`

### Tạo user

`POST /api/users`

```json
{
  "username": "admin2",
  "password": "admin123",
  "role": "super_admin",
  "is_active": true
}
```

### Cập nhật user

`PUT /api/users/:id`

```json
{
  "username": "admin2",
  "password": "new_password_123",
  "is_active": true
}
```

### Xóa user

`DELETE /api/users/:id`

Lưu ý nghiệp vụ:

- Không thể tự xóa tài khoản đang đăng nhập.
- Không thể tự khóa tài khoản đang đăng nhập.
- Không thể khóa/xóa super_admin active cuối cùng.

## Cấu hình hiển thị Units theo role (chỉ super_admin)

### Lấy cấu hình theo role

`GET /api/unit-display-configs?role=sale`

### Cập nhật cấu hình theo role

`PUT /api/unit-display-configs/:role`

`role` hỗ trợ: `super_admin`, `sale`, `admin`

Body:

```json
{
  "items": [
    {
      "catalog_field_id": 1,
      "is_visible": true,
      "sort_order": 1,
      "bg_color": "#FFF200",
      "text_color": "#000000"
    },
    {
      "catalog_field_key": "trang_thai",
      "is_visible": true,
      "sort_order": 2
    }
  ],
  "visibility_rules": [
    {
      "catalog_field_id": 2,
      "operator": "eq",
      "compare_value": "Đã bán",
      "effect": "hide",
      "sort_order": 1
    },
    {
      "catalog_field_key": "trang_thai",
      "operator": "neq",
      "compare_value": "Còn hàng",
      "effect": "hide",
      "sort_order": 2
    }
  ],
  "primary_sort_filters": [
    {
      "catalog_field_key": "gia",
      "sort_direction": "desc",
      "label": "Giá cao đến thấp",
      "sort_order": 1
    },
    {
      "catalog_field_key": "gia",
      "sort_direction": "asc",
      "label": "Giá thấp đến cao",
      "sort_order": 2
    }
  ],
  "catalog_filter_configs": [
    {
      "catalog_field_key": "gia",
      "filter_type": "select",
      "label": "Khoảng giá",
      "sort_order": 1,
      "select_options": [
        {
          "option_label": "Dưới 2 tỷ",
          "option_value": "duoi_2_ty",
          "range_min": null,
          "range_max": 2000000000,
          "sort_order": 1
        },
        {
          "option_label": "2-5 tỷ",
          "option_value": "2_5_ty",
          "range_min": 2000000000,
          "range_max": 5000000000,
          "sort_order": 2
        },
        {
          "option_label": "Trên 5 tỷ",
          "option_value": "tren_5_ty",
          "range_min": 5000000000,
          "range_max": null,
          "sort_order": 3
        }
      ]
    },
    {
      "catalog_field_key": "ma_can",
      "filter_type": "input",
      "label": "Mã căn",
      "placeholder": "Nhập mã căn",
      "sort_order": 2
    }
  ]
}
```

Response trả về gồm:

- `display_configs`: cấu hình cột hiển thị (catalog, thứ tự, màu)
- `visibility_rules`: rule show/hide theo điều kiện catalog value
- `primary_sort_filters`: cấu hình sort chính cho role (field + direction + label)
- `catalog_filter_configs`: cấu hình filter catalog cho role (`input` hoặc `select`)

Quy tắc `visibility_rules`:

- `operator`: `eq` (bằng), `neq` (khác)
- `effect`: `show`, `hide`
- Nếu có ít nhất 1 rule `show`, unit phải khớp một rule `show` mới được hiện
- Rule `hide` luôn có quyền ẩn unit khi khớp

Quy tắc `catalog_filter_configs` - Select Options with Range:

- `select_options` array: danh sách các option để user chọn
- Mỗi option có cấu trúc:
  - `option_label` (string): nhãn hiển thị cho user (VD: "Dưới 2 tỷ")
  - `option_value` (string): giá trị nội bộ để gửi API (VD: "duoi_2_ty")
  - `range_min` (number|null): giá trị tối thiểu của range (có thể null để tạo khoảng mở)
  - `range_max` (number|null): giá trị tối đa của range (có thể null để tạo khoảng mở)
  - `sort_order` (number): thứ tự hiển thị option trong dropdown
- FE Validation:
  - Nếu `range_min` hoặc `range_max` có giá trị, phải là số hợp lệ
  - `range_min` <= `range_max` (nếu đều có giá trị)
  - Không được có duplicate `option_value` trong cùng filter
  - Select filter bắt buộc phải có ≥1 option hợp lệ
- FE Rendering:
  - Select dropdown: user chọn theo `option_label`
  - Lưu `option_value` vào filter khi lưu state
  - Hiển thị filter áp dụng: dùng `option_label`, không hiển thị range
  - Backend xử lý range: FE chỉ cần gửi `option_value` được chọn, không cần tự lọc
- Khả năng tương thích ngược:
  - Option cũ không có range fields: FE vẫn hoạt động bình thường (range_min/max = null)
  - Option có range: FE gửi đúng `option_value` được chọn, backend lọc theo range

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
    ],
    "preview_formats": [
      [
        { "bgColor": "#FFFFFF", "textColor": "#000000" },
        { "bgColor": "#FFF200", "textColor": "#000000" },
        { "bgColor": "#FFFFFF", "textColor": "#000000" },
        { "bgColor": "#FFFFFF", "textColor": "#000000" }
      ],
      [
        { "bgColor": "#FFFFFF", "textColor": "#000000" },
        { "bgColor": "#FFFFFF", "textColor": "#000000" },
        { "bgColor": "#FFEEEE", "textColor": "#CC0000" },
        { "bgColor": "#FFFFFF", "textColor": "#000000" }
      ]
    ]
  }
}
```

Ghi chú:

- `preview_formats` có cùng số dòng/số cột với `preview`.
- Mỗi ô gồm `bgColor`, `textColor` dạng hex (`#RRGGBB`) hoặc `null`.
- FE dùng `preview` + `preview_formats` để cấu hình mapping theo màu.

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
  "data_start_condition": {
    "column_name": "Mã căn",
    "operator": "not_empty"
  },
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
- Có thể cấu hình `data_start_condition` để tự xác định mốc bắt đầu dữ liệu.
- Nếu dùng `data_start_condition`, hệ thống sẽ bắt đầu sync từ **chính dòng khớp điều kiện**.
- `data_start_row_index` luôn được ưu tiên hơn `data_start_condition` nếu truyền đồng thời.
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
- `agency_id`
- `schema_id`
- `page`
- `limit`

Filter/sort mới theo cấu hình role:

- `sort_field_key`
- `sort_direction` (`asc` | `desc`)

### Filter gần đúng theo 1 catalog field

Có thể truyền theo `catalog_field_key` hoặc `catalog_field_id`.

Ví dụ theo key:

`GET /api/units?catalog_field_key=ma_can&catalog_field_value=A-10`

Ví dụ theo id:

`GET /api/units?catalog_field_id=5&catalog_field_value=A-10`

Behavior:

- Backend chỉ lấy các `unit` thuộc schema có chứa catalog field đó.
- Sau đó so khớp gần đúng bằng `ILIKE` trên `units.dynamic_data[field_key]`.
- Có thể kết hợp với `agency_id`, `schema_id`, `unit_code` theo logic `AND`.

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
- Nếu catalog được cấu hình `filter_type=input`: giá trị được tìm theo kiểu gần đúng `ILIKE`.
- Nếu catalog được cấu hình `filter_type=select`: giá trị được so khớp chính xác (không gần đúng).

### Sort theo cấu hình role

Ví dụ:

`GET /api/units?sort_field_key=gia&sort_direction=desc`

Behavior:

- Chỉ cho phép sort theo cấu hình trong `primary_sort_filters` của role.
- Nếu truyền sort không nằm trong cấu hình role: trả `403`.
- Nếu role có cấu hình sort nhưng không truyền sort: backend tự áp dụng option đầu tiên.

### Validate

- `catalog_field_id` phải là số nguyên dương.
- `catalog_field_key` chỉ gồm chữ thường, số, `_`, `-`.
- Khi truyền `catalog_field_id` hoặc `catalog_field_key` thì bắt buộc có `catalog_field_value`.
- `catalog_filters` phải là JSON array, mỗi item phải có `catalog_field_id` hoặc `catalog_field_key`, và `value`.
- `sort_field_key` và `sort_direction` phải đi cùng nhau.
- `sort_direction` chỉ nhận `asc` hoặc `desc`.
- Với catalog cấu hình `select`, giá trị filter phải nằm trong danh sách `select_options` của role.
- Với `select_options` có `range_min`/`range_max`, backend sẽ lọc theo khoảng số (hữu ích cho field giá).

Quy ước range cho `select_options`:

- `range_min`: cận dưới (nullable)
- `range_max`: cận trên (nullable)
- Có thể để một đầu `null` để biểu diễn khoảng mở
  - ví dụ `range_min=null, range_max=2000000000`: nhỏ hơn hoặc bằng 2 tỷ
  - ví dụ `range_min=5000000000, range_max=null`: lớn hơn hoặc bằng 5 tỷ

### Metadata trả thêm từ GET /api/units

Response list units có thêm:

- `display_catalogs`: danh sách catalog được hiển thị theo role
- `visibility_rules`: rule show/hide đang áp dụng
- `primary_sort_filters`: danh sách sort được phép dùng cho role
- `catalog_filter_configs`: danh sách filter catalog được phép dùng cho role
- `active_sort`: sort thực tế backend đang áp dụng
- `visible_count`: số bản ghi còn lại sau khi áp visibility rules

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
      "source_cell_bg_color": "#FFF200",
      "source_cell_text_color": "#000000",
      "source_color_value_map": [
        { "bgColor": "#FFF200", "value": "Còn hàng" },
        { "bgColor": "#FFEEEE", "textColor": "#CC0000", "value": "Hết hàng" }
      ],
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
      "source_cell_bg_color": null,
      "source_cell_text_color": null,
      "source_color_value_map": null,
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

Ví dụ dễ hiểu theo kiểu "nguồn là gì thì lưu là gì":

`transform_rule: "map:dd=đảo dừa|cl=chà là|*=khác"`

| Giá trị nguồn (sau khi trim) | Giá trị lưu vào DB |
|---|---|
| `dd` | `đảo dừa` |
| `cl` | `chà là` |
| `xx` (không có trong map) | `khác` (do `*`) |
| `""` (rỗng) | `default_value` nếu có, không thì `null` |

Option map theo màu ô "màu gì lưu gì":

- `source_color_value_map` là array các rule map màu -> giá trị lưu.
- Mỗi item gồm:
  - `bgColor` (optional, hex)
  - `textColor` (optional, hex)
  - `value` (required): giá trị sẽ lưu vào DB nếu màu khớp

Ví dụ:

```json
{
  "schema_field_id": 14,
  "source_column_name": "Trạng thái",
  "source_color_value_map": [
    { "bgColor": "#FFF200", "value": "Còn hàng" },
    { "bgColor": "#FFEEEE", "textColor": "#CC0000", "value": "Đã bán" }
  ]
}
```

Ý nghĩa:

- Nếu ô có nền `#FFF200` -> lưu `Còn hàng`
- Nếu ô có nền `#FFEEEE` và chữ `#CC0000` -> lưu `Đã bán`
- Nếu không khớp rule nào -> coi như rỗng, sau đó mới xét `default_value` nếu có

Lưu ý quan trọng:

- So khớp map đang theo lowercase + trim (không phân biệt hoa/thường ở key nguồn).
- Cú pháp hỗ trợ cả `=` hoặc `=>`.
  - Ví dụ tương đương: `map:1=ocean park|2=ocean park 2`
  - Hoặc: `map:1=>ocean park;2=>ocean park 2`
- Nếu muốn map theo màu + theo giá trị thì cấu hình cả màu (`source_cell_bg_color`/`source_cell_text_color`) và `transform_rule: map:...` trên cùng một mapping item.
- Nếu muốn map trực tiếp "màu nào -> lưu gì" thì dùng `source_color_value_map`.

Kết hợp nhiều rule:

- `transform_rule: "fillDown,map:lk=liền kề|bt=biệt thự|*=khác"`
  - Dòng rỗng sẽ lấy giá trị dòng trước cùng cột trước khi map

Rule mapping theo màu:

- `source_cell_bg_color` (optional): chỉ map ô có màu nền khớp hex (`#RRGGBB`).
- `source_cell_text_color` (optional): chỉ map ô có màu chữ khớp hex (`#RRGGBB`).
- Có thể dùng 1 trong 2 hoặc dùng cả 2 cùng lúc.
- Khi có cấu hình màu, bắt buộc mapping phải có `source_column_name` hoặc `source_column_index`.
- Nếu màu ô không khớp điều kiện: giá trị ô đó coi như rỗng, rồi mới xét `default_value` nếu có.
- `source_color_value_map` (optional): map theo danh sách rule màu -> giá trị lưu.

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
      "source_cell_bg_color": null,
      "source_cell_text_color": null,
      "source_color_value_map": null,
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
- Upsert theo khóa toàn cục `unit_code` (không phân biệt hoa/thường).
- Nếu trùng `unit_code` thì update bản ghi cũ, không tạo mới.
- Nếu không trùng thì insert mới.
- Mặc định bỏ qua các dòng đang bị ẩn trên Google Sheet (`hiddenByUser` hoặc `hiddenByFilter`).
- Nếu có `data_start_condition` (và không có `data_start_row_index`), hệ thống tìm dòng đầu tiên thỏa điều kiện và bắt đầu lấy dữ liệu từ **chính dòng đó**.
- Nếu có `data_end_condition` (và không có `data_end_row_index`), hệ thống dừng ở **dòng ngay trước** dòng thỏa điều kiện.
- Nếu mapping có `source_cell_bg_color`/`source_cell_text_color`, hệ thống chỉ map value khi màu ô thỏa điều kiện.
- Nếu mapping có `source_color_value_map`, hệ thống ưu tiên map theo màu để ra giá trị lưu.

`data_start_condition` và `data_end_condition` hỗ trợ:

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
