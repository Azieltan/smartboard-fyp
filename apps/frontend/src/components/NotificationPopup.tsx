'use client';

import { useEffect, useState } from 'react';
import type { Notification } from '../types/notification';

interface NotificationPopupProps {
  notification: Notification;
  onDismiss: () => void;
  onAction?: () => void;
}

const typeColors: Record<string, string> = {
  friend_request: 'border-l-pink-500',
  group_invite: 'border-l-blue-500',
  chat_message: 'border-l-emerald-500',
  task_assigned: 'border-l-amber-500',
};

const typeIcons: Record<string, string> = {
  friend_request: '👤',
  group_invite: '👥',
  chat_message: '💬',
  task_assigned: '📋',
};

export function NotificationPopup({ notification, onDismiss, onAction }: NotificationPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Match animation duration
  };

  const handleClick = () => {
    if (onAction) {
      onAction();
    }
    handleDismiss();
  };

  const borderColor = typeColors[notification.type] || 'border-l-blue-500';
  const icon = typeIcons[notification.type] || '🔔';

  return (
    <div
      className={`
                w-80 bg-[#1e293b] rounded-xl shadow-2xl border border-white/10 overflow-hidden
                border-l-4 ${borderColor}
                transition-all duration-300 ease-out cursor-pointer
                ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
      onClick={handleClick}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {notification.title}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      <div className="h-0.5 bg-white/5">
        <div
          className={`h-full bg-blue-500 transition-all ease-linear ${isVisible && !isExiting ? 'w-0' : 'w-full'}`}
          style={{ transitionDuration: isVisible && !isExiting ? '3000ms' : '0ms' }}
        />
      </div>
    </div>
  );
}
