import { request } from './api';
import { Task, TaskCreate, TaskUpdate } from '../types';

export const taskService = {
  async getByStory(storyId: number): Promise<Task[]> {
    return request<Task[]>(`/stories/${storyId}/tasks`);
  },

  async getById(id: number): Promise<Task> {
    return request<Task>(`/tasks/${id}`);
  },

  async create(storyId: number, data: TaskCreate): Promise<Task> {
    return request<Task>(`/stories/${storyId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: TaskUpdate): Promise<Task> {
    return request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    return request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};
