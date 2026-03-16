import { useNavigate } from 'react-router-dom';
import SourceManager from '../components/SourceManager';

export default function SourcesScreen({ catalog }) {
  const navigate = useNavigate();

  function goToDetail(source) {
    navigate(`/sources/${source.id}`);
  }

  return (
    <SourceManager
      sources={catalog.sources}
      allProjects={catalog.allProjects}
      agencies={catalog.agencies}
      loading={catalog.loadingSources}
      onDelete={catalog.deleteSource}
      onGoToConfig={() => navigate('/sources/create')}
      onGoToDetail={goToDetail}
    />
  );
}
