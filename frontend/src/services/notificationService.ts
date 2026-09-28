import { request } from './api';
import { NotificationItem } from '../types';

export const notificationService = {
  async getAll(unreadOnly = false, limit = 50): Promise<NotificationItem[]> {
    return request<NotificationItem[]>(`/notifications?unread_only=${unreadOnly}&limit=${limit}`);
  },

  async markAsRead(id: number): Promise<NotificationItem> {
    return request<NotificationItem>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllAsRead(): Promise<{ marked_read: number }> {
    return request<{ marked_read: number }>('/notifications/read-all', {
      method: 'POST',
    });
  },

  async runWorker(): Promise<{ checked_tasks: number; notifications_created: number; message: string }> {
    return request<{ checked_tasks: number; notifications_created: number; message: string }>(
      '/notifications/run-worker',
      {
        method: 'POST',
      }
    );
  },
};
