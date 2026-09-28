import React from 'react';
import { ProjectStatus, StoryStatus, TaskStatus, Priority, NotificationType } from '../types';

interface StatusBadgeProps {
  status?: ProjectStatus | StoryStatus | TaskStatus | NotificationType;
  priority?: Priority;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, priority, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  if (priority) {
    const priorityStyles: Record<Priority, string> = {
      LOW: 'bg-slate-100 text-slate-700 border-slate-300',
      MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
      HIGH: 'bg-amber-50 text-amber-700 border-amber-300',
      CRITICAL: 'bg-red-50 text-red-700 border-red-300 font-semibold',
    };
    return (
      <span className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${priorityStyles[priority] || 'bg-gray-100 text-gray-800'}`}>
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
        {priority}
      </span>
    );
  }

  if (status) {
    const statusStyles: Record<string, string> = {
      // Project statuses
      PLANNING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      COMPLETED: 'bg-blue-50 text-blue-700 border-blue-300',
      ARCHIVED: 'bg-gray-100 text-gray-600 border-gray-300',

      // Story statuses
      BACKLOG: 'bg-slate-100 text-slate-700 border-slate-300',
      
      // Task & Story shared statuses
      TODO: 'bg-amber-50 text-amber-700 border-amber-200',
      IN_PROGRESS: 'bg-sky-50 text-sky-700 border-sky-300',
      DONE: 'bg-emerald-50 text-emerald-700 border-emerald-300',

      // Notification types
      DUE_SOON: 'bg-amber-100 text-amber-800 border-amber-300',
      OVERDUE: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    };

    const formattedLabel = status.replace('_', ' ');

    return (
      <span className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
        {formattedLabel}
      </span>
    );
  }

  return null;
};
