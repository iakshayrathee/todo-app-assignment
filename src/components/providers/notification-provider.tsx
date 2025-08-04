'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher';
import { toast } from 'sonner';
import type { Channel } from 'pusher-js';

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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const channelRef = useRef<Channel | null>(null);

  // Generate a unique ID for each notification
  const generateId = () => Math.random().toString(36).substring(2, 11);

  // Add a new notification (store only, don't show toast to avoid duplicates)
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  }, [setNotifications]);

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
      console.log('Received notification event on channel:', channelName, data);
      
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
  }, [session, addNotification]);

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
