import React, { useState, useEffect, useRef } from 'react';
import {
  FolderKanban,
  LayoutDashboard,
  Folders,
  Bell,
  CheckCheck,
  RefreshCw,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types';
import { StatusBadge } from './StatusBadge';

interface NavbarProps {
  currentView: 'dashboard' | 'projects' | 'project-details';
  onNavigate: (view: 'dashboard' | 'projects') => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, showToast }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isWorkerRunning, setIsWorkerRunning] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getAll(false, 30);
      setNotifications(data);
      const unread = data.filter((n) => !n.read_at).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      showToast('Could not mark notification as read', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch {
      showToast('Failed to mark all as read', 'error');
    }
  };

  const handleTriggerWorker = async () => {
    setIsWorkerRunning(true);
    try {
      const result = await notificationService.runWorker();
      showToast(result.message, 'info');
      await fetchNotifications();
    } catch {
      showToast('Failed to run background worker cycle', 'error');
    } finally {
      setIsWorkerRunning(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight">AgileFlow</span>
                <span className="block text-[10px] uppercase font-semibold tracking-wider text-sky-600 -mt-1">
                  Project Manager
                </span>
              </div>
            </button>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              <button
                onClick={() => onNavigate('projects')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'projects' || currentView === 'project-details'
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Folders className="w-4 h-4" />
                Projects
              </button>
            </nav>
          </div>

          {/* Right actions: Docs link & Notification Bell */}
          <div className="flex items-center gap-3">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="Open Swagger OpenAPI Documentation"
            >
              API Docs
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-red-500 rounded-full border-2 border-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-800">Notifications</h4>
                      <p className="text-xs text-slate-500">
                        {unreadCount} unread task {unreadCount === 1 ? 'alert' : 'alerts'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleTriggerWorker}
                        disabled={isWorkerRunning}
                        title="Scan pending tasks now"
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md transition disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isWorkerRunning ? 'animate-spin text-sky-600' : ''}`} />
                      </button>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          title="Mark all as read"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No task notifications</p>
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3.5 hover:bg-slate-50 transition flex items-start gap-3 ${
                            !item.read_at ? 'bg-sky-50/40' : ''
                          }`}
                        >
                          <div className="mt-0.5">
                            <StatusBadge status={item.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800 leading-snug break-words">
                              {item.message}
                            </p>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.created_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {!item.read_at && (
                            <button
                              onClick={() => handleMarkAsRead(item.id)}
                              className="text-xs text-sky-600 hover:text-sky-800 font-medium shrink-0"
                            >
                              Read
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
