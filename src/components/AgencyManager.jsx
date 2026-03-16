import { useState } from 'react';
import { Card, Table, Input, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';

export default function AgencyManager({ agencies, loading, onCreate, onUpdate, onDelete }) {
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

  const rows = agencies.map((agency) => ({
    key: agency.id,
    id: agency.id,
    name: editingId === agency.id ? <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} /> : agency.name,
    actions: editingId === agency.id ? (
      <Space>
        <Button type="primary" size="small" icon={<SaveOutlined />} loading={saving} onClick={() => handleSave(agency.id)}>Lưu</Button>
        <Button size="small" icon={<CloseOutlined />} onClick={() => { setEditingId(null); setEditingName(''); }}>Huỷ</Button>
      </Space>
    ) : (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(agency.id); setEditingName(agency.name); }}>Sửa</Button>
        <Popconfirm title={`Xóa đại lý "${agency.name}"?`} onConfirm={() => onDelete(agency.id)}>
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
    <Card title="Đại lý">
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={handleAdd}
          placeholder="Tên đại lý mới..."
        />
        <Button type="primary" icon={<PlusOutlined />} loading={adding} disabled={!newName.trim()} onClick={handleAdd}>
          Thêm
        </Button>
      </Space.Compact>
      <Table columns={columns} dataSource={rows} loading={loading} pagination={false} locale={{ emptyText: 'Chưa có đại lý nào.' }} />
    </Card>
  );
}
