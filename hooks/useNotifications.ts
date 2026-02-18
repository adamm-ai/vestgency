/**
 * useNotifications Hook - Real-time notifications with API fallback
 * ===================================================================
 * Combines WebSocket real-time updates with API polling fallback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { notificationsAPI, Notification } from '../services/api';

interface UseNotificationsOptions {
  /** Enable polling as fallback (default: true) */
  enablePolling?: boolean;
  /** Polling interval in milliseconds (default: 30000) */
  pollingInterval?: number;
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

interface UseNotificationsReturn {
  /** List of notifications */
  notifications: Notification[];
  /** Number of unread notifications */
  unreadCount: number;
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Error if any occurred */
  error: Error | null;
  /** Whether WebSocket is connected */
  isRealtime: boolean;
  /** Mark a notification as read */
  markAsRead: (id: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Delete a notification */
  deleteNotification: (id: string) => Promise<void>;
  /** Manually refresh notifications */
  refresh: () => Promise<void>;
}

/**
 * Hook for managing notifications with real-time updates
 * Falls back to polling when WebSocket is not available
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead } = useNotifications();
 * ```
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    enablePolling = true,
    pollingInterval = 30000,
    autoFetch = true,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    // Debounce: don't fetch more than once every 2 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) {
      return;
    }
    lastFetchRef.current = now;

    try {
      setIsLoading(true);
      setError(null);

      const response = await notificationsAPI.getAll();
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      console.error('[Notifications] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle new notification from WebSocket
  const handleNewNotification = useCallback((data: unknown) => {
    const notification = data as Notification;

    setNotifications((prev) => {
      // Check if notification already exists
      const exists = prev.some((n) => n.id === notification.id);
      if (exists) return prev;

      // Add new notification at the beginning
      return [notification, ...prev];
    });

    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Handle notification read update from WebSocket
  const handleNotificationRead = useCallback((data: unknown) => {
    const { id } = data as { id: string };

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Handle all notifications marked as read from WebSocket
  const handleAllNotificationsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
    setUnreadCount(0);
  }, []);

  // Handle notification deleted from WebSocket
  const handleNotificationDeleted = useCallback((data: unknown) => {
    const { id } = data as { id: string };

    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === id);
      if (notification && !notification.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  // Subscribe to WebSocket events
  const { isConnected } = useWebSocket({
    'notification:new': handleNewNotification,
    'notification:read': handleNotificationRead,
    'notification:all_read': handleAllNotificationsRead,
    'notification:deleted': handleNotificationDeleted,
  });

  // Mark a notification as read
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationsAPI.markRead(id);
    } catch (err) {
      // Revert optimistic update on error
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: false } : n
        )
      );
      setUnreadCount((prev) => prev + 1);
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
    setUnreadCount(0);

    try {
      await notificationsAPI.markAllRead();
    } catch (err) {
      // Revert optimistic update on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      throw err;
    }
  }, [notifications, unreadCount]);

  // Delete a notification
  const deleteNotification = useCallback(async (id: string) => {
    // Optimistic update
    const notification = notifications.find((n) => n.id === id);
    const previousNotifications = notifications;

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notification && !notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await notificationsAPI.delete(id);
    } catch (err) {
      // Revert optimistic update on error
      setNotifications(previousNotifications);
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
      throw err;
    }
  }, [notifications]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [autoFetch, fetchNotifications]);

  // Polling fallback when WebSocket is not connected
  useEffect(() => {
    // Clear existing interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // Start polling only when not connected via WebSocket
    if (enablePolling && !isConnected) {
      pollingRef.current = setInterval(fetchNotifications, pollingInterval);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isConnected, enablePolling, pollingInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    isRealtime: isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}

export default useNotifications;
