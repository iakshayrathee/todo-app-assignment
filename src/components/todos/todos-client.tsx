'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { TodoList } from './todo-list';
import { Todo } from '@/lib/db/schema';

interface TodosClientProps {
  userId: number;
  filter: string;
  search: string;
}

export interface TodosClientRef {
  refreshTodos: () => void;
}

export const TodosClient = forwardRef<TodosClientRef, TodosClientProps>(
  function TodosClient({ userId, filter, search }, ref) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/todos?userId=${userId}&filter=${filter}&search=${encodeURIComponent(search)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch todos');
        }
        
        const data = await response.json();
        setTodos(data);
      } catch (err) {
        console.error('Error fetching todos:', err);
        setError('Failed to load todos. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodos();
  }, [userId, filter, search]);

  const refreshTodos = useCallback(async () => {
    try {
      const response = await fetch(`/api/todos?userId=${userId}&filter=${filter}&search=${encodeURIComponent(search)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch updated todos');
      }
      
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      console.error('Error updating todos:', err);
      setError('Failed to update todos. Please try again.');
    }
  }, [userId, filter, search]);

  // Expose refreshTodos method to parent components
  useImperativeHandle(ref, () => ({
    refreshTodos,
  }), [refreshTodos]);

  if (isLoading) {
    return <div>Loading todos...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <TodoList 
      todos={todos} 
      onUpdate={refreshTodos} 
    />
  );
});
