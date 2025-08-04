'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

interface Stats {
  totalUsers: number;
  pendingUsers: number;
  totalTodos: number;
  completedTodos: number;
  completionRate: number;
}

interface AdminStatsClientProps {
  initialStats: Stats;
}

export function AdminStatsClient({ initialStats }: AdminStatsClientProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>(initialStats);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = pusherClient.subscribe(`private-user-${session.user.id}`);

    // Handle new user registration - increment total users and pending users
    channel.bind('user-registered', () => {
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers + 1,
        pendingUsers: prev.pendingUsers + 1
      }));
    });

    // Handle user approval - decrement pending users
    channel.bind('user-approved', () => {
      setStats(prev => ({
        ...prev,
        pendingUsers: Math.max(0, prev.pendingUsers - 1)
      }));
    });

    // Handle new todo creation - increment total todos and recalculate completion rate
    channel.bind('todo-created', () => {
      setStats(prev => {
        const newTotalTodos = prev.totalTodos + 1;
        const newCompletionRate = newTotalTodos > 0 
          ? Math.round((prev.completedTodos / newTotalTodos) * 100)
          : 0;
        
        return {
          ...prev,
          totalTodos: newTotalTodos,
          completionRate: newCompletionRate
        };
      });
    });

    // Handle todo completion toggle - update completed todos and recalculate completion rate
    channel.bind('todo-completed', (data: { completed: boolean }) => {
      setStats(prev => {
        const newCompletedTodos = data.completed 
          ? prev.completedTodos + 1 
          : Math.max(0, prev.completedTodos - 1);
        
        const newCompletionRate = prev.totalTodos > 0 
          ? Math.round((newCompletedTodos / prev.totalTodos) * 100)
          : 0;
        
        return {
          ...prev,
          completedTodos: newCompletedTodos,
          completionRate: newCompletionRate
        };
      });
    });

    // Handle todo deletion - decrement total todos and recalculate completion rate
    channel.bind('todo-deleted', (data: { wasCompleted: boolean }) => {
      setStats(prev => {
        const newTotalTodos = Math.max(0, prev.totalTodos - 1);
        const newCompletedTodos = data.wasCompleted 
          ? Math.max(0, prev.completedTodos - 1)
          : prev.completedTodos;
        
        const newCompletionRate = newTotalTodos > 0 
          ? Math.round((newCompletedTodos / newTotalTodos) * 100)
          : 0;
        
        return {
          ...prev,
          totalTodos: newTotalTodos,
          completedTodos: newCompletedTodos,
          completionRate: newCompletionRate
        };
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [session?.user?.id]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Registered users
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.pendingUsers}</div>
          <div className="flex items-center gap-2 mt-1">
            {stats.pendingUsers > 0 ? (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Needs attention
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground">All caught up!</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.totalTodos}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Created by users
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completionRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.completedTodos} of {stats.totalTodos} completed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
