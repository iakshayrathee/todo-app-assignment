'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import type { Channel } from 'pusher-js';

interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | Date | null;
  createdAt: string | Date;
  userEmail: string | null;
}

interface TodosOverviewClientProps {
  initialTodos: Todo[];
}

interface TodoEvent {
  todoId: number;
  todoTitle: string;
  userId: number;
  userName: string;
  action: 'created' | 'updated' | 'completed' | 'deleted';
  timestamp: string;
}

export function TodosOverviewClient({ initialTodos }: TodosOverviewClientProps) {
  const { data: session } = useSession();
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const channelRef = useRef<Channel | null>(null);

  console.log('[TodosOverviewClient] Initializing with initial todos:', initialTodos);

  // Listen for Pusher events directly
  useEffect(() => {
    if (!session?.user?.id || session?.user?.role !== 'admin') {
      console.log('[TodosOverviewClient] No session or not admin, skipping Pusher setup');
      return;
    }

    const userId = session.user.id;
    console.log('[TodosOverviewClient] Setting up Pusher subscription with user ID:', userId);
    
    // Define the channel name
    const channelName = `private-user-${userId}`;
    
    // Clean up any existing subscription
    if (channelRef.current) {
      console.log('[TodosOverviewClient] Cleaning up existing subscription');
      channelRef.current.unbind_all();
      pusherClient.unsubscribe(channelName);
    }
    
    // Create a new subscription
    try {
      channelRef.current = pusherClient.subscribe(channelName);
      console.log('[TodosOverviewClient] Subscribed to channel:', channelName);
    } catch (error) {
      console.error('[TodosOverviewClient] Error subscribing to channel:', error);
      return;
    }

    // Handle real-time todo updates
    const handleRecentTodo = (data: TodoEvent) => {
      console.log('[TodosOverviewClient] Received recent-todo event:', data);
      
      const { todoId, todoTitle, userName, action, timestamp } = data;
      
      switch (action) {
        case 'created':
          console.log('[TodosOverviewClient] Handling CREATE action for todo:', todoId);
          
          const newTodo: Todo = {
            id: todoId,
            title: todoTitle,
            description: null,
            completed: false,
            dueDate: null,
            createdAt: new Date(timestamp),
            userEmail: userName,
          };
          
          setTodos(prev => {
            // Check if todo already exists to prevent duplicates
            if (prev.some(todo => todo.id === todoId)) return prev;
            
            // Add new todo at the top, keep only 10 items
            const newTodos = [newTodo, ...prev.slice(0, 9)];
            console.log('[TodosOverviewClient] New todos state after CREATE:', newTodos);
            return newTodos;
          });
          break;
          
        case 'updated':
          console.log('[TodosOverviewClient] Handling UPDATE action for todo:', todoId);
          
          setTodos(prev => {
            const updatedTodos = prev.map(todo => 
              todo.id === todoId ? { ...todo, title: todoTitle } : todo
            );
            console.log('[TodosOverviewClient] New todos state after UPDATE:', updatedTodos);
            return updatedTodos;
          });
          break;
          
        case 'completed':
          console.log('[TodosOverviewClient] Handling COMPLETE action for todo:', todoId);
          
          setTodos(prev => {
            const updatedTodos = prev.map(todo => 
              todo.id === todoId ? { ...todo, completed: true } : todo
            );
            console.log('[TodosOverviewClient] New todos state after COMPLETE:', updatedTodos);
            return updatedTodos;
          });
          break;
          
        case 'deleted':
          console.log('[TodosOverviewClient] Handling DELETE action for todo:', todoId);
          
          setTodos(prev => {
            const updatedTodos = prev.filter(todo => todo.id !== todoId);
            console.log('[TodosOverviewClient] New todos state after DELETE:', updatedTodos);
            return updatedTodos;
          });
          break;
          
        default:
          console.log('[TodosOverviewClient] Unknown action:', action);
      }
    };
    
    // Bind the event handler
    if (channelRef.current) {
      channelRef.current.bind('recent-todo', handleRecentTodo);
      console.log('[TodosOverviewClient] Bound recent-todo event handler');
    }
    
    // Cleanup on unmount
    return () => {
      console.log('[TodosOverviewClient] Cleaning up Pusher subscription');
      if (channelRef.current) {
        channelRef.current.unbind('recent-todo');
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [session]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Todos</CardTitle>
        <CardDescription>
          Overview of all user todos (read-only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
          {todos.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No todos found
            </p>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {todo.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {todo.title}
                    </p>
                    {todo.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {todo.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      by {todo.userEmail} • {new Date(todo.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {todo.dueDate && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(todo.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <Badge variant={todo.completed ? "default" : "secondary"}>
                    {todo.completed ? "Completed" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
