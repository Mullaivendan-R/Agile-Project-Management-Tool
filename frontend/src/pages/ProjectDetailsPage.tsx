import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Kanban,
  ListTree,
  AlertCircle,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { storyService } from '../services/storyService';
import { taskService } from '../services/taskService';
import {
  Project,
  ProjectHierarchy,
  Story,
  Task,
  HierarchyStory,
  HierarchyTask,
  ProjectStatus,
  StoryStatus,
  TaskStatus,
  Priority,
  StoryCreate,
  StoryUpdate,
  TaskCreate,
  TaskUpdate,
  ProjectUpdate,
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';
import { StoryModal } from '../components/StoryModal';
import { TaskModal } from '../components/TaskModal';
import { ProjectModal } from '../components/ProjectModal';

interface ProjectDetailsPageProps {
  projectId: number;
  onBack: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({
  projectId,
  onBack,
  showToast,
}) => {
  const [hierarchy, setHierarchy] = useState<ProjectHierarchy | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'board'>('hierarchy');

  // Story Accordion expansion state
  const [expandedStories, setExpandedStories] = useState<Record<number, boolean>>({});

  // Modals state
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [storyModalState, setStoryModalState] = useState<{
    isOpen: boolean;
    story?: Story | null;
  }>({ isOpen: false });

  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    storyId: number;
    task?: Task | null;
  }>({ isOpen: false, storyId: 0 });

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'project' | 'story' | 'task';
    id: number;
    name: string;
  }>({ isOpen: false, type: 'project', id: 0, name: '' });

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadHierarchy();
  }, [projectId]);

  const loadHierarchy = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await projectService.getHierarchy(projectId);
      setHierarchy(data);
      // Expand all stories initially
      const initialExpand: Record<number, boolean> = {};
      data.stories.forEach((s) => {
        initialExpand[s.id] = true;
      });
      setExpandedStories(initialExpand);
    } catch (err: any) {
      setError(err?.message || 'Failed to load project details');
      showToast('Could not load project hierarchy', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStoryExpand = (storyId: number) => {
    setExpandedStories((prev) => ({
      ...prev,
      [storyId]: !prev[storyId],
    }));
  };

  // Status updates
  const handleUpdateProjectStatus = async (newStatus: ProjectStatus) => {
    if (!hierarchy) return;
    try {
      await projectService.update(hierarchy.id, { status: newStatus });
      setHierarchy({ ...hierarchy, status: newStatus });
      showToast(`Project status updated to ${newStatus}`, 'success');
    } catch {
      showToast('Failed to update project status', 'error');
    }
  };

  const handleUpdateStoryStatus = async (storyId: number, newStatus: StoryStatus) => {
    try {
      await storyService.update(storyId, { status: newStatus });
      setHierarchy((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          stories: prev.stories.map((s) => (s.id === storyId ? { ...s, status: newStatus } : s)),
        };
      });
      showToast(`Story status updated to ${newStatus}`, 'success');
    } catch {
      showToast('Failed to update story status', 'error');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await taskService.update(taskId, { status: newStatus });
      setHierarchy((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          stories: prev.stories.map((s) => ({
            ...s,
            tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
          })),
        };
      });
      showToast(`Task status updated to ${newStatus}`, 'success');
    } catch {
      showToast('Failed to update task status', 'error');
    }
  };

  // Modal submissions
  const handleSaveProject = async (data: ProjectUpdate) => {
    if (!hierarchy) return;
    await projectService.update(hierarchy.id, data);
    showToast('Project updated successfully', 'success');
    loadHierarchy();
  };

  const handleSaveStory = async (data: StoryCreate | StoryUpdate) => {
    if (storyModalState.story) {
      await storyService.update(storyModalState.story.id, data as StoryUpdate);
      showToast('Story updated successfully', 'success');
    } else {
      await storyService.create(projectId, data as StoryCreate);
      showToast('Story created successfully', 'success');
    }
    loadHierarchy();
  };

  const handleSaveTask = async (data: TaskCreate | TaskUpdate) => {
    if (taskModalState.task) {
      await taskService.update(taskModalState.task.id, data as TaskUpdate);
      showToast('Task updated successfully', 'success');
    } else {
      await taskService.create(taskModalState.storyId, data as TaskCreate);
      showToast('Task created successfully', 'success');
    }
    loadHierarchy();
  };

  // Delete execution
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      if (deleteConfirm.type === 'project') {
        await projectService.delete(deleteConfirm.id);
        showToast('Project deleted successfully', 'success');
        setDeleteConfirm({ isOpen: false, type: 'project', id: 0, name: '' });
        onBack();
        return;
      } else if (deleteConfirm.type === 'story') {
        await storyService.delete(deleteConfirm.id);
        showToast('User Story deleted', 'success');
      } else if (deleteConfirm.type === 'task') {
        await taskService.delete(deleteConfirm.id);
        showToast('Task deleted', 'success');
      }
      setDeleteConfirm({ isOpen: false, type: 'project', id: 0, name: '' });
      loadHierarchy();
    } catch {
      showToast(`Failed to delete ${deleteConfirm.type}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading project hierarchy...</p>
        </div>
      </div>
    );
  }

  if (error || !hierarchy) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900">Project Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">{error || 'This project could not be loaded.'}</p>
        <button
          onClick={onBack}
          className="mt-5 px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  // Calculate task summary
  let totalTasks = 0;
  let doneTasks = 0;
  hierarchy.stories.forEach((s) => {
    s.tasks.forEach((t) => {
      totalTasks += 1;
      if (t.status === 'DONE') doneTasks += 1;
    });
  });
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Back button and navigation */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </button>
      </div>

      {/* Project Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                Project #{hierarchy.id}
              </span>
              {/* Direct Project Status Dropdown */}
              <select
                value={hierarchy.status}
                onChange={(e) => handleUpdateProjectStatus(e.target.value as ProjectStatus)}
                className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-300 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer transition"
              >
                <option value="PLANNING">PLANNING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {hierarchy.name}
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              {hierarchy.description || 'No project description provided.'}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Created {new Date(hierarchy.created_at).toLocaleDateString()}
              </span>
              <span>&bull;</span>
              <span>{hierarchy.stories.length} User Stories</span>
              <span>&bull;</span>
              <span>{totalTasks} Total Tasks</span>
            </div>
          </div>

          {/* Header Action Buttons & Progress Meter */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStoryModalState({ isOpen: true })}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add User Story
              </button>
              <button
                onClick={() => setIsEditProjectOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                title="Edit Project"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setDeleteConfirm({
                    isOpen: true,
                    type: 'project',
                    id: hierarchy.id,
                    name: hierarchy.name,
                  })
                }
                className="p-2 text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Overall Progress */}
            <div className="w-full sm:w-56 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
                <span>Total Completion</span>
                <span className="font-bold text-slate-900">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1 text-right">
                {doneTasks} of {totalTasks} tasks done
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'hierarchy'
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ListTree className="w-4 h-4" />
            Hierarchy View (Project &rarr; Story &rarr; Task)
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'board'
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Kanban className="w-4 h-4" />
            Task Board (Kanban)
          </button>
        </div>
      </div>

      {/* TAB 1: Complete Hierarchical Tree View */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              Hierarchical Breakdown
            </h2>
            <button
              onClick={() => setStoryModalState({ isOpen: true })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add User Story
            </button>
          </div>

          {hierarchy.stories.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No User Stories</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Break this project down into user stories with clear acceptance criteria.
              </p>
              <button
                onClick={() => setStoryModalState({ isOpen: true })}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition"
              >
                Create First User Story
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {hierarchy.stories.map((story) => {
                const isExpanded = expandedStories[story.id] !== false;
                const storyDoneTasks = story.tasks.filter((t) => t.status === 'DONE').length;
                const storyProgress =
                  story.tasks.length > 0 ? Math.round((storyDoneTasks / story.tasks.length) * 100) : 0;

                return (
                  <div
                    key={story.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition"
                  >
                    {/* Level 2: User Story Header Bar */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => toggleStoryExpand(story.id)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 transition mt-0.5"
                          title={isExpanded ? 'Collapse story tasks' : 'Expand story tasks'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-400">Story #{story.id}</span>
                            <StatusBadge priority={story.priority} />
                            {/* Inline Story Status Dropdown */}
                            <select
                              value={story.status}
                              onChange={(e) =>
                                handleUpdateStoryStatus(story.id, e.target.value as StoryStatus)
                              }
                              className="text-xs font-semibold px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-sky-500 outline-none cursor-pointer"
                            >
                              <option value="BACKLOG">BACKLOG</option>
                              <option value="TODO">TODO</option>
                              <option value="IN_PROGRESS">IN_PROGRESS</option>
                              <option value="DONE">DONE</option>
                            </select>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1">{story.title}</h3>
                          {story.description && (
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {story.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Story Actions & Task Count */}
                      <div className="flex items-center gap-3 pl-8 md:pl-0 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs font-semibold text-slate-700">
                            {storyDoneTasks}/{story.tasks.length} Tasks
                          </div>
                          <div className="text-[10px] text-slate-400">{storyProgress}% done</div>
                        </div>

                        <button
                          onClick={() => setTaskModalState({ isOpen: true, storyId: story.id })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition"
                          title="Add task under this user story"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Task
                        </button>

                        <button
                          onClick={() => setStoryModalState({ isOpen: true, story })}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                          title="Edit story"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              isOpen: true,
                              type: 'story',
                              id: story.id,
                              name: story.title,
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title="Delete story and its tasks"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Level 3: Child Tasks Section */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 bg-white">
                        {story.tasks.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                            <p className="text-xs">No tasks added to this story yet.</p>
                            <button
                              onClick={() => setTaskModalState({ isOpen: true, storyId: story.id })}
                              className="mt-2 text-xs font-semibold text-sky-600 hover:text-sky-700"
                            >
                              + Add first task
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {story.tasks.map((task) => {
                              const isOverdue =
                                task.status !== 'DONE' &&
                                task.due_date &&
                                new Date(task.due_date).getTime() < Date.now();

                              return (
                                <div
                                  key={task.id}
                                  className={`p-3.5 rounded-lg border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                    task.status === 'DONE'
                                      ? 'bg-slate-50/60 border-slate-200'
                                      : isOverdue
                                      ? 'bg-rose-50/40 border-rose-200'
                                      : 'bg-white border-slate-200 hover:border-sky-300 shadow-sm'
                                  }`}
                                >
                                  {/* Task Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[11px] font-semibold text-slate-400">
                                        Task #{task.id}
                                      </span>
                                      <StatusBadge priority={task.priority} />
                                      {/* Inline Task Status Dropdown */}
                                      <select
                                        value={task.status}
                                        onChange={(e) =>
                                          handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)
                                        }
                                        className="text-xs font-semibold px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-sky-500 outline-none cursor-pointer"
                                      >
                                        <option value="TODO">TODO</option>
                                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                                        <option value="DONE">DONE</option>
                                      </select>
                                    </div>
                                    <h4
                                      className={`text-sm font-semibold text-slate-800 mt-1 ${
                                        task.status === 'DONE' ? 'line-through text-slate-400' : ''
                                      }`}
                                    >
                                      {task.title}
                                    </h4>
                                    {task.description && (
                                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                        {task.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Task Meta & Controls */}
                                  <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                                    {task.assigned_to && (
                                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-[11px]">
                                        <User className="w-3 h-3 text-slate-400" />
                                        {task.assigned_to}
                                      </span>
                                    )}

                                    {task.due_date && (
                                      <span
                                        className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md ${
                                          isOverdue
                                            ? 'bg-rose-100 text-rose-800 font-bold'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        <Calendar className="w-3 h-3" />
                                        {new Date(task.due_date).toLocaleDateString([], {
                                          month: 'short',
                                          day: 'numeric',
                                        })}
                                      </span>
                                    )}

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() =>
                                          setTaskModalState({
                                            isOpen: true,
                                            storyId: story.id,
                                            task,
                                          })
                                        }
                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                                        title="Edit task"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          setDeleteConfirm({
                                            isOpen: true,
                                            type: 'task',
                                            id: task.id,
                                            name: task.title,
                                          })
                                        }
                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                        title="Delete task"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Interactive Kanban Board View */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map((colStatus) => {
            // Collect all tasks matching this status across all stories
            const colTasks: Array<{ task: HierarchyTask; story: HierarchyStory }> = [];
            hierarchy.stories.forEach((story) => {
              story.tasks.forEach((task) => {
                if (task.status === colStatus) {
                  colTasks.push({ task, story });
                }
              });
            });

            const colHeaders: Record<TaskStatus, { title: string; color: string; countBg: string }> = {
              TODO: { title: 'To Do', color: 'border-amber-400', countBg: 'bg-amber-100 text-amber-800' },
              IN_PROGRESS: { title: 'In Progress', color: 'border-sky-500', countBg: 'bg-sky-100 text-sky-800' },
              DONE: { title: 'Completed', color: 'border-emerald-500', countBg: 'bg-emerald-100 text-emerald-800' },
            };

            const headerInfo = colHeaders[colStatus];

            return (
              <div
                key={colStatus}
                className="bg-slate-100/70 rounded-xl p-4 flex flex-col min-h-[500px] border border-slate-200"
              >
                {/* Column Header */}
                <div
                  className={`flex items-center justify-between pb-3 mb-3 border-b-2 ${headerInfo.color}`}
                >
                  <h3 className="font-bold text-sm text-slate-800">{headerInfo.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${headerInfo.countBg}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg">
                      No tasks
                    </div>
                  ) : (
                    colTasks.map(({ task, story }) => (
                      <div
                        key={task.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-sky-600 truncate max-w-[150px]">
                            {story.title}
                          </span>
                          <StatusBadge priority={task.priority} />
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900 leading-snug">{task.title}</h4>

                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                          <span className="text-[11px]">
                            {task.assigned_to ? task.assigned_to : 'Unassigned'}
                          </span>
                          {/* Quick status dropdown on board */}
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)
                            }
                            className="text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 outline-none cursor-pointer"
                          >
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="DONE">DONE</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={isEditProjectOpen}
        project={hierarchy}
        onClose={() => setIsEditProjectOpen(false)}
        onSubmit={handleSaveProject}
      />

      {/* Story Modal */}
      <StoryModal
        isOpen={storyModalState.isOpen}
        story={storyModalState.story}
        projectId={projectId}
        onClose={() => setStoryModalState({ isOpen: false })}
        onSubmit={handleSaveStory}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModalState.isOpen}
        task={taskModalState.task}
        storyId={taskModalState.storyId}
        onClose={() => setTaskModalState({ isOpen: false, storyId: 0 })}
        onSubmit={handleSaveTask}
      />

      {/* Destructive Action Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={`Delete ${deleteConfirm.type === 'project' ? 'Project' : deleteConfirm.type === 'story' ? 'User Story' : 'Task'}?`}
        message={
          deleteConfirm.type === 'project'
            ? `Are you sure you want to delete "${deleteConfirm.name}"? All associated stories and tasks will be permanently removed.`
            : deleteConfirm.type === 'story'
            ? `Are you sure you want to delete "${deleteConfirm.name}"? All tasks under this user story will be permanently deleted.`
            : `Are you sure you want to delete task "${deleteConfirm.name}"?`
        }
        confirmLabel="Delete"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'project', id: 0, name: '' })}
      />
    </div>
  );
};
