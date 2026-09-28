import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { Project, ProjectHierarchy, ProjectStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';

interface ProjectsPageProps {
  onSelectProject: (projectId: number) => void;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  onSelectProject,
  onCreateProject,
  onEditProject,
  showToast,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hierarchies, setHierarchies] = useState<Record<number, ProjectHierarchy>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await projectService.getAll();
      setProjects(data);

      // Fetch hierarchies for metrics
      const hierarchyPromises = data.map(async (p) => {
        try {
          const h = await projectService.getHierarchy(p.id);
          return { id: p.id, hierarchy: h };
        } catch {
          return null;
        }
      });
      const hierarchyResults = await Promise.all(hierarchyPromises);
      const hMap: Record<number, ProjectHierarchy> = {};
      hierarchyResults.forEach((res) => {
        if (res) hMap[res.id] = res.hierarchy;
      });
      setHierarchies(hMap);
    } catch {
      showToast('Failed to load projects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await projectService.delete(deleteTarget.id);
      showToast(`Project "${deleteTarget.name}" deleted successfully`, 'success');
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete project', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = ['ALL', 'PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your product initiatives and oversee User Stories & Tasks.
          </p>
        </div>
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 rounded-lg">
          {statusOptions.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse space-y-4">
              <div className="h-5 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No projects found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your search criteria or status filter.'
              : 'Create your first project to start organizing user stories and tasks.'}
          </p>
          <button
            onClick={onCreateProject}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const hierarchy = hierarchies[project.id];
            let totalTasks = 0;
            let doneTasks = 0;
            const storiesCount = hierarchy ? hierarchy.stories.length : 0;

            if (hierarchy) {
              hierarchy.stories.forEach((s) => {
                s.tasks.forEach((t) => {
                  totalTasks += 1;
                  if (t.status === 'DONE') doneTasks += 1;
                });
              });
            }
            const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={project.status} />
                      </div>
                      <h3
                        onClick={() => onSelectProject(project.id)}
                        className="text-base font-bold text-slate-900 mt-2.5 group-hover:text-sky-600 transition cursor-pointer"
                      >
                        {project.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditProject(project)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                        title="Edit project"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(project)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Description */}
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>

                  {/* Progress section */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span className="font-medium text-slate-700">Sprint Progress</span>
                      <span className="font-semibold text-slate-800">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-sky-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {storiesCount} Stories
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {doneTasks}/{totalTasks} Tasks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer action button */}
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => onSelectProject(project.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 group/btn transition"
                  >
                    Open Project
                    <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cascade Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Project?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated User Stories and Tasks will be permanently removed (Cascading Delete). This action cannot be undone.`}
        confirmLabel="Delete Project"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
