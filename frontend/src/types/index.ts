export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type StoryStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NotificationType = 'DUE_SOON' | 'OVERDUE';

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
}

export interface Story {
  id: number;
  project_id: number;
  title: string;
  description?: string | null;
  status: StoryStatus;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export interface StoryCreate {
  title: string;
  description?: string | null;
  status?: StoryStatus;
  priority?: Priority;
}

export interface StoryUpdate {
  title?: string;
  description?: string | null;
  status?: StoryStatus;
  priority?: Priority;
}

export interface Task {
  id: number;
  user_story_id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  assigned_to?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  assigned_to?: string | null;
  due_date?: string | null;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  assigned_to?: string | null;
  due_date?: string | null;
}

export interface HierarchyTask extends Task {}

export interface HierarchyStory extends Story {
  tasks: HierarchyTask[];
}

export interface ProjectHierarchy extends Project {
  stories: HierarchyStory[];
}

export interface NotificationItem {
  id: number;
  task_id: number;
  message: string;
  type: NotificationType;
  created_at: string;
  read_at?: string | null;
}
