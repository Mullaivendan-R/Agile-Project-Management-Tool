import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { ProjectModal } from './components/ProjectModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { projectService } from './services/projectService';
import { Project, ProjectCreate, ProjectUpdate } from './types';

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'projects' | 'project-details'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Global project create/edit modal
  const [projectModalState, setProjectModalState] = useState<{
    isOpen: boolean;
    project?: Project | null;
  }>({ isOpen: false });

  // Toast feedback state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    setCurrentView('project-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateProject = () => {
    setProjectModalState({ isOpen: true, project: null });
  };

  const handleEditProject = (project: Project) => {
    setProjectModalState({ isOpen: true, project });
  };

  const handleSaveProject = async (data: ProjectCreate | ProjectUpdate) => {
    try {
      if (projectModalState.project) {
        await projectService.update(projectModalState.project.id, data as ProjectUpdate);
        showToast('Project updated successfully', 'success');
      } else {
        const created = await projectService.create(data as ProjectCreate);
        showToast('Project created successfully', 'success');
        handleSelectProject(created.id);
      }
      setProjectModalState({ isOpen: false });
    } catch (err: any) {
      showToast(err?.message || 'Failed to save project', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setSelectedProjectId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        showToast={showToast}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <DashboardPage
            onNavigate={(view) => setCurrentView(view)}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
          />
        )}

        {currentView === 'projects' && (
          <ProjectsPage
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onEditProject={handleEditProject}
            showToast={showToast}
          />
        )}

        {currentView === 'project-details' && selectedProjectId !== null && (
          <ProjectDetailsPage
            projectId={selectedProjectId}
            onBack={() => {
              setCurrentView('projects');
              setSelectedProjectId(null);
            }}
            showToast={showToast}
          />
        )}
      </main>

      {/* Project Modal */}
      <ProjectModal
        isOpen={projectModalState.isOpen}
        project={projectModalState.project}
        onClose={() => setProjectModalState({ isOpen: false })}
        onSubmit={handleSaveProject}
      />

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Agile Project Management Tool &bull; <span className="font-semibold text-slate-700">Project &rarr; User Story &rarr; Task</span>
          </p>
          <div className="flex items-center gap-4 text-sky-600 font-medium">
            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Swagger OpenAPI (/docs)
            </a>
            <a href="http://localhost:8000/redoc" target="_blank" rel="noopener noreferrer" className="hover:underline">
              ReDoc (/redoc)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
