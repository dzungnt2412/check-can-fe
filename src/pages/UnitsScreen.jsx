import UnitsPage from '../components/UnitsPage';

export default function UnitsScreen({ catalog }) {
  return <UnitsPage projects={catalog.allProjects} agencies={catalog.agencies} />;
}
