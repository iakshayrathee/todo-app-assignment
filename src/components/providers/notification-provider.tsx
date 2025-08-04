'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher';
import { toast } from 'sonner';
import type { Channel } from 'pusher-js';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const channelRef = useRef<Channel | null>(null);

  // Generate a unique ID for each notification
  const generateId = () => Math.random().toString(36).substring(2, 11);

  // Add a new notification (store only, don't show toast to avoid duplicates)
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, id?: string, timestamp?: Date) => {
    const newNotification: Notification = {
      ...notification,
      id: id || generateId(),
      timestamp: timestamp || new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Clear a specific notification
  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Handle recent todo notifications for admin users
  const handleRecentTodo = useCallback(
    (data: {
      todoId: number;
      todoTitle: string;
      userId: number;
      userName: string;
      action: "created" | "updated" | "completed" | "deleted";
      timestamp: string;
    }) => {
      console.log('[NotificationProvider] Received recent-todo event:', data);
      
      // Only show notifications to admins
      const user = session?.user as { id: string; role: string } | undefined;
      if (user?.role !== "admin") {
        console.log('[NotificationProvider] Ignoring recent-todo event - user is not admin');
        return;
      }

      console.log('[NotificationProvider] Processing recent-todo for admin user:', user?.id);

      // Determine notification type based on action
      let type: "info" | "success" | "warning" = "info";
      let title = "";

      switch (data.action) {
        case "created":
          type = "info";
          title = `New Todo Created: ${data.todoTitle}`;
          break;
        case "updated":
          type = "info";
          title = `Todo Updated: ${data.todoTitle}`;
          break;
        case "completed":
          type = "success";
          title = `Todo Completed: ${data.todoTitle}`;
          break;
        case "deleted":
          type = "warning";
          title = `Todo Deleted: ${data.todoTitle}`;
          break;
      }

      console.log('[NotificationProvider] Creating notification with title:', title);

      // Add notification to state
      const notificationId = `todo-${data.todoId}-${data.action}-${Date.now()}`;
      addNotification({
        title,
        message: `By ${data.userName}`,
        type,
      }, notificationId, new Date(data.timestamp));

      // Show toast notification
      toast(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{title}</span>
          <span className="text-sm">By {data.userName}</span>
        </div>,
        {
          action: {
            label: "View",
            onClick: () => router.push("/admin"),
          },
        }
      );

      console.log('[NotificationProvider] Finished processing recent-todo event');
    },
    [session?.user, addNotification, router]
  );

  // Set up Pusher subscription
  useEffect(() => {
    if (!session?.user || !('id' in session.user)) {
      console.log('No user session, skipping Pusher setup');
      return;
    }

    const user = session.user as { id: string; role: string };
    console.log('Initializing Pusher with user ID:', user.id);
    
    // Enable Pusher debugging
    if (process.env.NODE_ENV === 'development') {
      // @ts-expect-error - Pusher debug property
      window.PUSHER_DEBUG = true;
      console.log('Pusher debug logging enabled');
    }

    // Log all Pusher connection state changes
    const connection = pusherClient.connection;
    const logConnectionState = () => {
      console.log('Pusher connection state:', connection.state);
    };
    
    // Log initial state
    logConnectionState();
    
    // Bind to all connection state changes
    connection.bind('state_change', (states: { current: string; previous: string }) => {
      console.log('Pusher connection state changed:', states);
    });
    
    connection.bind('connected', () => {
      console.log('Pusher connected successfully');    
    });
    
    connection.bind('error', (err: Error) => {
      console.error('Pusher connection error:', err);
    });

    // Subscribe to user's private channel
    const channelName = `private-user-${user.id}`;
    console.log('Attempting to subscribe to channel:', channelName);
    
    try {
      channelRef.current = pusherClient.subscribe(channelName);
      
      // Log subscription events
      channelRef.current.bind('pusher:subscription_succeeded', () => {
        console.log('Successfully subscribed to channel:', channelName);
      });
      
      channelRef.current.bind('pusher:subscription_error', (err: Error) => {
        console.error('Failed to subscribe to channel:', channelName, err);
      });
      
      console.log('Pusher subscription initiated, waiting for confirmation...');
    } catch (error) {
      console.error('Failed to subscribe to Pusher channel:', error);
      return;
    }

    // Listen for new notifications (store and show toast)
    const handleTaskDue = (data: { taskId: string; title: string; dueDate: string }) => {
      console.log('Received task due notification on channel:', channelName, data);
      
      // Store the notification
      addNotification({
        type: 'info',
        title: data.title,
        message: `Task ${data.taskId} is due on ${data.dueDate}`,
        action: undefined,
      });

      // Show toast notification
      toast(data.title, {
        description: `Task ${data.taskId} is due on ${data.dueDate}`,
      });
    };

    const handleUserRegistered = (data: { userId: number; userName: string; userEmail: string; timestamp: string }) => {
      console.log('Received user registration notification on channel:', channelName, data);
      
      // Only show toast notification for admins
      if (user.role === 'admin') {
        // Store the notification
        addNotification({
          type: 'info',
          title: 'New User Registration',
          message: `${data.userName} (${data.userEmail}) has registered and is pending approval.`,
          action: {
            label: 'Review User',
            onClick: () => window.location.href = '/admin'
          },
        });

        // Show toast notification
        toast('New User Registration', {
          description: `${data.userName} (${data.userEmail}) has registered and is pending approval.`,
          action: {
            label: 'Review',
            onClick: () => window.location.href = '/admin'
          }
        });
      }
    };

    const handleUserApproved = (data: { userId: number }) => {
      console.log('Received user approval notification on channel:', channelName, data);
      
      // Only show toast notification for admins
      if (user.role === 'admin') {
        // Store the notification
        addNotification({
          type: 'success',
          title: 'User Approval Update',
          message: `User has been processed successfully.`,
          action: undefined,
        });

        // Show toast notification
        toast('User Approval Update', {
          description: `User has been processed successfully.`,
        });
      }
    };

    channelRef.current.bind('task_due', handleTaskDue);
    channelRef.current.bind('user-registered', handleUserRegistered);
    channelRef.current.bind('user-approved', handleUserApproved);
    channelRef.current.bind('recent-todo', handleRecentTodo);

    // Log all events received on the channel (for debugging)
    channelRef.current.bind_global((eventName: string, data: Record<string, unknown>) => {
      console.log(`Global event ${eventName} received:`, data);
    });

    // Subscribe to admin channel if user is admin
    if (user.role === 'admin') {
      console.log('User is admin, subscribing to admin channel');
      const adminChannel = pusherClient.subscribe('private-admin');
      
      adminChannel.bind('pusher:subscription_succeeded', () => {
        console.log('Successfully subscribed to admin channel');
      });
      
      adminChannel.bind('admin-notification', (data: { type?: string; title: string; message: string; action?: { label: string; onClick: () => void } }) => {
        console.log('Received admin notification:', data);
        addNotification({
          type: (data.type as 'info' | 'success' | 'warning' | 'error') || 'info',
          title: data.title,
          message: data.message,
          action: data.action,
        });
      });
    }

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        pusherClient.unsubscribe(channelRef.current.name);
      }
      if (user.role === 'admin') {
        pusherClient.unsubscribe('private-admin');
      }
    };
  }, [session, addNotification, router, handleRecentTodo]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        markAsRead,
        clearNotification,
        clearAllNotifications,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
