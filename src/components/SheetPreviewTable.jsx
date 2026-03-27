import { Table, Card, Empty, Spin, Typography } from 'antd';

const { Text } = Typography;

export default function SheetPreviewTable({
  headers,
  previewRows,
  previewFormats,
  loading,
}) {
  const columns = headers.map((h, i) => ({
    key: `col_${i}`,
    title: h,
    dataIndex: `col_${i}`,
    ellipsis: true,
    render: (value, _, rowIdx) => {
      let style = {};
      if (previewFormats && previewFormats[rowIdx] && previewFormats[rowIdx][i]) {
        const fmt = previewFormats[rowIdx][i];
        if (fmt.bgColor) {
          style.backgroundColor = fmt.bgColor;
        }
        if (fmt.textColor) {
          style.color = fmt.textColor;
        }
      }

      const cellStyle = {
        ...style,
        padding: '8px 12px',
      };

      return (
        <div style={cellStyle}>
          {String(value || '')}
        </div>
      );
    },
  }));

  const dataSource = previewRows.map((row, rowIdx) => {
    const obj = { key: rowIdx };
    headers.forEach((h, i) => {
      obj[`col_${i}`] = Array.isArray(row) ? row[i] : (row?.[h] ?? '');
    });
    return obj;
  });

  return (
    <Card title="2) Preview">
      <Text type="secondary">Hiển thị headers và 5 dòng dữ liệu mẫu.</Text>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : !headers.length ? (
        <Empty description="Chưa có dữ liệu preview." style={{ marginTop: 16 }} />
      ) : (
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          size="small"
          scroll={{ x: true }}
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
}
