import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Story, StoryCreate, StoryUpdate, StoryStatus, Priority } from '../types';

interface StoryModalProps {
  isOpen: boolean;
  story?: Story | null;
  projectId: number;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: StoryCreate | StoryUpdate) => Promise<void>;
}

export const StoryModal: React.FC<StoryModalProps> = ({
  isOpen,
  story,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<StoryStatus>('BACKLOG');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (story) {
      setTitle(story.title);
      setDescription(story.description || '');
      setStatus(story.status);
      setPriority(story.priority);
    } else {
      setTitle('');
      setDescription('');
      setStatus('BACKLOG');
      setPriority('MEDIUM');
    }
    setError(null);
  }, [story, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('User Story title is required');
      return;
    }
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save user story');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {story ? 'Edit User Story' : 'New User Story'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Story Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. As a user, I want to reset my password"
                required
                maxLength={255}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Acceptance Criteria / Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed requirements and acceptance criteria..."
                rows={3}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm transition resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StoryStatus)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm transition bg-white"
                >
                  <option value="BACKLOG">BACKLOG</option>
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="DONE">DONE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm transition bg-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isLoading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {story ? 'Save Story' : 'Create Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
