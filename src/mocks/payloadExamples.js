export const mockCreateSourcePayload = {
  source_code: 'SRC_GOOGLE_001',
  source_name: 'Nguon du lieu du an A',
  project_ids: [2, 5, 8],
  project_id: 2,
  agency_id: 3,
  spreadsheet_id: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456',
  spreadsheet_url: 'https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456/edit#gid=0',
  sheet_name: 'RawData',
  gid: '0',
  header_row_index: 1,
  data_start_row_index: 2,
  data_end_row_index: 500,
};

export const mockSaveMappingsPayload = {
  mappings: [
    {
      schema_field_id: 101,
      source_column_name: 'Tên khách hàng',
      transform_rule: 'trim',
      default_value: '',
      is_active: true,
    },
    {
      schema_field_id: 102,
      source_column_index: 3,
      transform_rule: 'parseViNumber',
      default_value: '0',
      is_active: true,
    },
  ],
};
