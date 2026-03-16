import CatalogPage from '../components/CatalogPage';

export default function CatalogScreen({ catalog }) {
  return (
    <CatalogPage
      investors={catalog.investors}
      allProjects={catalog.allProjects}
      agencies={catalog.agencies}
      loadingInvestors={catalog.loadingInvestors}
      loadingProjects={catalog.loadingProjects}
      loadingAgencies={catalog.loadingAgencies}
      error={catalog.error}
      success={catalog.success}
      onCreateInvestor={catalog.createInvestor}
      onUpdateInvestor={catalog.updateInvestor}
      onDeleteInvestor={catalog.deleteInvestor}
      onCreateProject={catalog.createProject}
      onUpdateProject={catalog.updateProject}
      onDeleteProject={catalog.deleteProject}
      onCreateAgency={catalog.createAgency}
      onUpdateAgency={catalog.updateAgency}
      onDeleteAgency={catalog.deleteAgency}
    />
  );
}
