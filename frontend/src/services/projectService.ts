import { request } from './api';
import { Project, ProjectCreate, ProjectUpdate, ProjectHierarchy } from '../types';

export const projectService = {
  async getAll(skip = 0, limit = 100): Promise<Project[]> {
    return request<Project[]>(`/projects?skip=${skip}&limit=${limit}`);
  },

  async getById(id: number): Promise<Project> {
    return request<Project>(`/projects/${id}`);
  },

  async create(data: ProjectCreate): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: ProjectUpdate): Promise<Project> {
    return request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    return request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  async getHierarchy(id: number): Promise<ProjectHierarchy> {
    return request<ProjectHierarchy>(`/projects/${id}/hierarchy`);
  },
};
