import { request } from './api';
import { Story, StoryCreate, StoryUpdate } from '../types';

export const storyService = {
  async getByProject(projectId: number): Promise<Story[]> {
    return request<Story[]>(`/projects/${projectId}/stories`);
  },

  async getById(id: number): Promise<Story> {
    return request<Story>(`/stories/${id}`);
  },

  async create(projectId: number, data: StoryCreate): Promise<Story> {
    return request<Story>(`/projects/${projectId}/stories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: StoryUpdate): Promise<Story> {
    return request<Story>(`/stories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    return request<void>(`/stories/${id}`, {
      method: 'DELETE',
    });
  },
};
