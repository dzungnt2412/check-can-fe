import { Table, Card, Empty, Spin, Typography } from 'antd';

const { Text } = Typography;

export default function SheetPreviewTable({ headers, previewRows, loading }) {
  const columns = headers.map((h, i) => ({
    key: `col_${i}`,
    title: h,
    dataIndex: `col_${i}`,
    ellipsis: true,
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
