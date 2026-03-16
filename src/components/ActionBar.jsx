import { Button, Space, Tag } from 'antd';
import { SaveOutlined, SyncOutlined } from '@ant-design/icons';

export default function ActionBar({
  sourceId,
  loadingSaveMapping,
  loadingSync,
  onSaveMapping,
  onSyncNow,
  showSaveMapping = true,
  showSyncNow = true,
}) {
  return (
    <div
      style={{
        position: 'sticky', bottom: 0, zIndex: 10,
        background: '#fff', padding: '12px 16px',
        borderRadius: 8, boxShadow: '0 -2px 8px rgba(0,0,0,.06)',
        border: '1px solid #f0f0f0',
      }}
    >
      <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
        <Space>
          <span style={{ color: '#595959', fontSize: 13 }}>Source ID:</span>
          {sourceId ? <Tag color="blue">{sourceId}</Tag> : <Tag>Chưa tạo source</Tag>}
        </Space>
        <Space wrap>
          {showSaveMapping ? (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loadingSaveMapping}
              disabled={!sourceId}
              onClick={onSaveMapping}
            >
              Save Mapping
            </Button>
          ) : null}
          {showSyncNow ? (
            <Button
              icon={<SyncOutlined />}
              loading={loadingSync}
              disabled={!sourceId}
              onClick={onSyncNow}
              style={{ background: '#7c3aed', color: '#fff', borderColor: '#7c3aed' }}
            >
              Sync now
            </Button>
          ) : null}
        </Space>
      </Space>
    </div>
  );
}
