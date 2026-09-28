import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  TrendingUp,
  Layers,
  Calendar,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { notificationService } from '../services/notificationService';
import { Project, NotificationItem, ProjectHierarchy } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface DashboardPageProps {
  onNavigate: (view: 'dashboard' | 'projects') => void;
  onSelectProject: (projectId: number) => void;
  onCreateProject: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onSelectProject,
  onCreateProject,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hierarchies, setHierarchies] = useState<Record<number, ProjectHierarchy>>({});
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [projList, notifList] = await Promise.all([
        projectService.getAll(0, 10),
        notificationService.getAll(true, 10),
      ]);
      setProjects(projList);
      setNotifications(notifList);

      // Load hierarchies for top projects to compute real task progress
      const hierarchyPromises = projList.slice(0, 5).map(async (p) => {
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
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute metrics
  const activeProjectsCount = projects.filter((p) => p.status === 'ACTIVE').length;
  let totalTasks = 0;
  let doneTasks = 0;
  let inProgressTasks = 0;
  let todoTasks = 0;

  Object.values(hierarchies).forEach((h) => {
    h.stories.forEach((s) => {
      s.tasks.forEach((t) => {
        totalTasks += 1;
        if (t.status === 'DONE') doneTasks += 1;
        else if (t.status === 'IN_PROGRESS') inProgressTasks += 1;
        else if (t.status === 'TODO') todoTasks += 1;
      });
    });
  });

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agile Workspace Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Hierarchical project tracking, sprint execution, and deadline management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCreateProject}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Projects</span>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{activeProjectsCount}</span>
            <span className="text-xs text-slate-400">of {projects.length} total</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Task Completion</span>
            <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{completionRate}%</span>
            <span className="text-xs text-slate-400">({doneTasks}/{totalTasks} tasks)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tasks In Progress</span>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{inProgressTasks}</span>
            <span className="text-xs text-slate-400">{todoTasks} in todo</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Alerts</span>
            <div className={`p-2.5 rounded-lg ${notifications.length > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{notifications.length}</span>
            <span className="text-xs text-slate-400">actionable items</span>
          </div>
        </div>
      </div>

      {/* Grid: Recent Projects & Task Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects List Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              <h2 className="font-semibold text-slate-900">Recent Projects</h2>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 transition"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 text-center">
              <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">No projects created yet</p>
              <p className="text-xs text-slate-400 mt-1">Get started by creating your team's first project.</p>
              <button
                onClick={onCreateProject}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {projects.map((project) => {
                const hierarchy = hierarchies[project.id];
                let pTotal = 0;
                let pDone = 0;
                if (hierarchy) {
                  hierarchy.stories.forEach((s) => {
                    s.tasks.forEach((t) => {
                      pTotal += 1;
                      if (t.status === 'DONE') pDone += 1;
                    });
                  });
                }
                const progress = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;

                return (
                  <div
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className="p-5 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-semibold text-sm text-slate-900 group-hover:text-sky-600 transition truncate">
                          {project.name}
                        </h3>
                        <StatusBadge status={project.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {project.description || 'No description provided'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Updated {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                        {hierarchy && (
                          <span>
                            {hierarchy.stories.length} stories &bull; {pTotal} tasks
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="sm:w-48 shrink-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span className="font-semibold text-slate-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-sky-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Task Alerts Sidebar Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-900">Task Deadlines</h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {notifications.length}
            </span>
          </div>

          <div className="p-5 flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">No overdue or pending alerts</p>
                <p className="text-xs text-slate-400 mt-1">All tasks are currently on schedule!</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={item.type} />
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 mt-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
