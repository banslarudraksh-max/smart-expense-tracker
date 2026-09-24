import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, AlertTriangle, ArrowRight, ShieldCheck, IndianRupee } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { NotificationItem } from '../../types/database';

interface NotificationDropdownProps {
  onNavigateToNotifications?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigateToNotifications }) => {
  const {
    notifications,
    unreadNotificationsCount,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    handleDeleteNotification,
  } = useFinance();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Budget Alert':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'Transaction':
        return <IndianRupee className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="text-[11px] font-mono text-cyan-400">
                  ({unreadNotificationsCount} unread)
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => handleMarkAllNotificationsRead()}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No notifications logged. Threshold warnings and activity alerts will appear here.
              </div>
            ) : (
              notifications.slice(0, 8).map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${
                    notif.read ? 'bg-transparent text-slate-400' : 'bg-slate-800/40 text-slate-200'
                  } hover:bg-slate-800/70`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="mt-0.5">{getIcon(notif.type)}</div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{notif.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkNotificationRead(notif.id)}
                        title="Mark as read"
                        className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotification(notif.id)}
                      title="Delete"
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
