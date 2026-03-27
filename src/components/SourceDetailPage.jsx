import {
  Tag, Space, Typography,
} from 'antd';

const { Title, Text } = Typography;

export default function SourceDetailPage({
  source,
}) {
  const projectTags = Array.isArray(source.linked_projects)
    ? source.linked_projects
      .map((project) => ({
        id: project.id,
        name: project.project_name || project.name || '',
      }))
      .filter((project) => project.name)
    : [];

  const projectIdFallbackTags = !projectTags.length && Array.isArray(source.project_ids)
    ? source.project_ids
      .map((projectId) => Number(projectId))
      .filter((projectId) => Number.isInteger(projectId) && projectId > 0)
      .map((projectId) => ({ id: projectId, name: `#${projectId}` }))
    : [];

  const fallbackProjectName = source.project_name || source.du_an || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Space align="center" wrap>
        <Title level={5} style={{ margin: 0 }}>
          {source.source_name || source.source_code}
        </Title>
        <Tag color={source.is_active ? 'green' : 'default'}>
          {source.is_active ? 'Đang dùng' : 'Tắt'}
        </Tag>
      </Space>
      <Text type="secondary">source_code: {source.source_code || '-'}</Text>
      <Space wrap>
        <Text type="secondary">Dự án:</Text>
        {projectTags.length ? (
          projectTags.map((project) => (
            <Tag color="blue" key={`${source.id}_${project.id}_${project.name}`}>
              {project.name}
            </Tag>
          ))
        ) : projectIdFallbackTags.length ? (
          projectIdFallbackTags.map((project) => (
            <Tag color="blue" key={`${source.id}_${project.id}_${project.name}`}>
              {project.name}
            </Tag>
          ))
        ) : (
          <Text>{fallbackProjectName || '-'}</Text>
        )}
      </Space>
      <Text type="secondary">
        project_ids: {Array.isArray(source.project_ids) && source.project_ids.length ? source.project_ids.join(', ') : '-'}
      </Text>
    </div>
  );
}
