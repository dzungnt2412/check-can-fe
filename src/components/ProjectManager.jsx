import { useState } from 'react';
import { Card, Table, Input, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';

export default function ProjectManager({
  allProjects,
  loadingProjects,
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
    await onUpdate(id, { name: editingName.trim() });
    setSaving(false);
    setEditingId(null);
    setEditingName('');
  }

  const rows = allProjects.map((proj) => ({
    key: proj.id,
    id: proj.id,
    name: editingId === proj.id ? <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} /> : proj.name,
    actions: editingId === proj.id ? (
      <Space>
        <Button type="primary" size="small" icon={<SaveOutlined />} loading={saving} onClick={() => handleSave(proj.id)}>Lưu</Button>
        <Button size="small" icon={<CloseOutlined />} onClick={() => { setEditingId(null); setEditingName(''); }}>Huỷ</Button>
      </Space>
    ) : (
      <Space>
        <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingId(proj.id); setEditingName(proj.name); }}>Sửa</Button>
        <Popconfirm title={`Xóa dự án "${proj.name}"?`} onConfirm={() => onDelete(proj.id)}>
          <Button danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
        </Popconfirm>
      </Space>
    ),
  }));
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Tên dự án', dataIndex: 'name', key: 'name' },
    { title: 'Hành động', dataIndex: 'actions', key: 'actions', width: 200 },
  ];

  return (
    <Card title="Dự án">
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={handleAdd}
          placeholder="Tên dự án mới..."
        />
        <Button type="primary" icon={<PlusOutlined />} loading={adding} disabled={!newName.trim()} onClick={handleAdd}>
          Thêm
        </Button>
      </Space.Compact>
      <Table columns={columns} dataSource={rows} loading={loadingProjects} pagination={false} locale={{ emptyText: 'Chưa có dự án nào.' }} />
    </Card>
  );
}
