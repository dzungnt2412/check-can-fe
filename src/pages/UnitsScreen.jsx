import UnitsPage from '../components/UnitsPage';

export default function UnitsScreen({ catalog }) {
  return (
    <UnitsPage
      agencies={catalog.agencies}
      allProjects={catalog.allProjects}
      investors={catalog.investors}
    />
  );
}
