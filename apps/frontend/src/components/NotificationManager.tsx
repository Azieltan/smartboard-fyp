'use client';

import { useState, useEffect, useCallback } from 'react';
import { NotificationPopup } from './NotificationPopup';
import type { Notification } from '../types/notification';
import { socket } from '../lib/socket';
import { useRouter } from 'next/navigation';

interface NotificationManagerProps {
  userId: string;
}

const MAX_VISIBLE_NOTIFICATIONS = 3;

export function NotificationManager({ userId }: NotificationManagerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => {
      // Prevent duplicates
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }
      // Keep only the latest MAX_VISIBLE_NOTIFICATIONS
      const updated = [notification, ...prev].slice(0, MAX_VISIBLE_NOTIFICATIONS);
      return updated;
    });
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleNotificationAction = useCallback((notification: Notification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'friend_request':
        router.push('/dashboard/chat');
        break;
      case 'group_invite':
        if (notification.metadata?.groupId) {
          router.push(`/dashboard/chat`);
        }
        break;
      case 'chat_message':
        router.push('/dashboard/chat');
        break;
      case 'task_assigned':
        router.push('/dashboard/tasks');
        break;
      default:
        break;
    }
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    // Connect socket
    socket.connect();

    // Join user's personal room for notifications
    socket.emit('join_room', userId);

    // Listen for new notifications
    const handleNewNotification = (notification: Notification) => {
      console.log('Received notification:', notification);
      addNotification(notification);
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [userId, addNotification]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3">
      {notifications.map((notification) => (
        <NotificationPopup
          key={notification.id}
          notification={notification}
          onDismiss={() => removeNotification(notification.id)}
          onAction={() => handleNotificationAction(notification)}
        />
      ))}
    </div>
  );
}
