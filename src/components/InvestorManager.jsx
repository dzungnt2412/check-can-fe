import { useState } from 'react';
import { Card, Table, Input, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';

export default function InvestorManager({
  investors,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    await onCreate(newName.trim());
    setAdding(false);
    setNewName('');
  }

  async function handleSave(id) {
    if (!editingName.trim()) return;
    setSaving(true);
    await onUpdate(id, editingName.trim());
    setSaving(false);
    setEditingId(null);
    setEditingName('');
  }

  const rows = investors.map((inv) => ({
    key: inv.id,
    id: inv.id,
    name: editingId === inv.id ? (
      <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
    ) : inv.name,
    actions: editingId === inv.id ? (
      <Space>
        <Button type="primary" size="small" icon={<SaveOutlined />} loading={saving} onClick={() => handleSave(inv.id)}>Lưu</Button>
        <Button size="small" icon={<CloseOutlined />} onClick={() => { setEditingId(null); setEditingName(''); }}>Huỷ</Button>
      </Space>
    ) : (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(inv.id); setEditingName(inv.name); }}>Sửa</Button>
        <Popconfirm title={`Xóa chủ đầu tư "${inv.name}"?`} onConfirm={() => onDelete(inv.id)}>
          <Button danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
        </Popconfirm>
      </Space>
    ),
  }));
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Hành động', dataIndex: 'actions', key: 'actions', width: 200 },
  ];

  return (
    <Card title="Chủ đầu tư">
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={handleAdd}
          placeholder="Tên chủ đầu tư mới..."
        />
        <Button type="primary" icon={<PlusOutlined />} loading={adding} disabled={!newName.trim()} onClick={handleAdd}>
          Thêm
        </Button>
      </Space.Compact>
      <Table columns={columns} dataSource={rows} loading={loading} pagination={false} locale={{ emptyText: 'Chưa có chủ đầu tư nào.' }} />
    </Card>
  );
}
