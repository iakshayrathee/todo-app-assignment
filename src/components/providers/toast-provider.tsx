'use client';

import { useEffect, useRef } from 'react';
import { pusherClient } from '@/lib/pusher';
import { toast } from 'sonner';
import type { Channel } from 'pusher-js';
import { useSession } from 'next-auth/react';

// This is a simplified provider that only handles toast notifications
// without the context/hook functionality that was causing errors
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const channelRef = useRef<Channel | null>(null);
  
  useEffect(() => {
    // Only set up notifications if we have a session
    if (!session?.user?.id) return;
    
    console.log('[ToastProvider] Setting up Pusher subscription for user:', session.user.id);
    
    // Subscribe to user's private channel
    const channelName = `private-user-${session.user.id}`;
    
    try {
      channelRef.current = pusherClient.subscribe(channelName);
      console.log('[ToastProvider] Subscribed to channel:', channelName);
      
      // Listen for notifications and show toasts
      
      // Task due notifications
      channelRef.current.bind('task_due', (data: { taskId: string; title: string; dueDate: string }) => {
        console.log('[ToastProvider] Received task_due event:', data);
        toast(data.title, {
          description: `Task ${data.taskId} is due on ${data.dueDate}`,
        });
      });
      
      // User registered notifications (for admins)
      channelRef.current.bind('user-registered', (data: { userId: number; userName: string; userEmail: string; timestamp: string }) => {
        console.log('[ToastProvider] Received user-registered event:', data);
        if (session.user.role === 'admin') {
          toast('New User Registration', {
            description: `${data.userName} (${data.userEmail}) has registered and is awaiting approval.`,
          });
        }
      });
      
      // Recent todo notifications (for admins)
      channelRef.current.bind('recent-todo', (data: { 
        todoId: number; 
        todoTitle: string; 
        userId: number; 
        userName: string; 
        action: 'created' | 'updated' | 'completed' | 'deleted';
        timestamp: string;
      }) => {
        console.log('[ToastProvider] Received recent-todo event:', data);
        
        if (session.user.role === 'admin') {
          let title = '';
          let description = '';
          
          switch (data.action) {
            case 'created':
              title = 'New Todo Created';
              description = `${data.todoTitle} by ${data.userName}`;
              break;
            case 'updated':
              title = 'Todo Updated';
              description = `${data.todoTitle} by ${data.userName}`;
              break;
            case 'completed':
              title = 'Todo Completed';
              description = `${data.todoTitle} by ${data.userName}`;
              break;
            case 'deleted':
              title = 'Todo Deleted';
              description = `${data.todoTitle} by ${data.userName}`;
              break;
          }
          
          toast(title, { description });
        }
      });
    } catch (error) {
      console.error('[ToastProvider] Failed to subscribe to Pusher channel:', error);
    }
    
    // Cleanup on unmount
    return () => {
      console.log('[ToastProvider] Cleaning up Pusher subscription');
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
      }
    };
  }, [session]);
  
  return children;
}
