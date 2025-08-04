'use client';

import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';
import { CreateTodoForm } from '@/components/todos/create-todo-form';
import { TodoFilters } from '@/components/todos/todo-filters';
import { ExportTodos } from '@/components/todos/export-todos';
import { TodoSkeleton } from '@/components/todos/todo-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TodosClient, TodosClientRef } from '@/components/todos/todos-client';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin');
    },
  });

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return null; // This should not happen due to required: true, but TypeScript needs it
  }

  const userId = parseInt(session.user.id);
  const filter = searchParams?.get('filter') || 'all';
  const search = searchParams?.get('search') || '';
  
  // Create a ref to trigger todos refresh
  const todosClientRef = useRef<TodosClientRef | null>(null);
  
  const handleTodoCreated = () => {
    // Trigger refresh of todos list
    if (todosClientRef.current) {
      todosClientRef.current.refreshTodos();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Welcome back, <span className="font-medium text-foreground">{session.user.name || 'User'}</span>! 👋
              </p>
            </div>
            <div className="flex items-center gap-3">
              <TodoFilters />
              <ExportTodos />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Create Task Section - Takes full width on mobile, 1 column on xl */}
            <div className="xl:col-span-1">
              <CreateTodoForm onSuccess={handleTodoCreated} />
            </div>

            {/* Tasks Section - Takes full width on mobile, 2 columns on xl */}
            <div className="xl:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        📋 Your Tasks
                      </CardTitle>
                      <CardDescription>
                        Manage and track your tasks efficiently
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                      <span className="font-medium">
                        {filter === 'all' ? '📊 All tasks' : 
                         filter === 'completed' ? '✅ Completed tasks' : 
                         '⏳ Pending tasks'}
                      </span>
                      {search && (
                        <span className="text-primary font-medium">
                          matching "{search}"
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <ErrorBoundary>
                      <TodosClient 
                        ref={todosClientRef}
                        userId={userId}
                        filter={filter}
                        search={search}
                      />
                    </ErrorBoundary>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
