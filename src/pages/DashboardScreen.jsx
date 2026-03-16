import DashboardPage from '../components/DashboardPage';

export default function DashboardScreen({ catalog, onGoToCreateSource, onGoToCatalog }) {
  return (
    <DashboardPage
      investors={catalog.investors}
      allProjects={catalog.allProjects}
      agencies={catalog.agencies}
      loadingInvestors={catalog.loadingInvestors}
      loadingProjects={catalog.loadingProjects}
      loadingAgencies={catalog.loadingAgencies}
      onGoToConfig={onGoToCreateSource}
      onGoToCatalog={onGoToCatalog}
    />
  );
}
