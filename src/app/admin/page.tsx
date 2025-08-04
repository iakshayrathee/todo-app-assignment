import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, todos } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserApprovalCard } from '@/components/admin/user-approval-card';
import { TodosOverview } from '@/components/admin/todos-overview';
import { ErrorBoundary } from '@/components/ui/error-boundary';

import { PendingUsersClient } from '@/components/admin/pending-users-client';
import { EnhancedQuickActions } from '@/components/admin/enhanced-quick-actions';
import { Users, Clock, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  // Get pending users for approval
  const pendingUsers = await db.query.users.findMany({
    where: eq(users.approved, false),
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });

  // Get stats
  const [totalUsersResult, pendingUsersResult, totalTodosResult, completedTodosResult] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(users).where(eq(users.approved, false)),
    db.select({ count: count() }).from(todos),
    db.select({ count: count() }).from(todos).where(eq(todos.completed, true)),
  ]);

  const stats = {
    totalUsers: totalUsersResult[0].count,
    pendingUsers: pendingUsersResult[0].count,
    totalTodos: totalTodosResult[0].count,
    completedTodos: completedTodosResult[0].count,
    completionRate: totalTodosResult[0].count > 0 
      ? Math.round((completedTodosResult[0].count / totalTodosResult[0].count) * 100)
      : 0,
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6 lg:space-y-8">
              {/* Header Section */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  🛡️ Admin Dashboard
                </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Manage users and monitor system activity
              </p>
            </div>

            {/* Stats Cards */}
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Pending User Approvals - Real-time Client Component */}
              <PendingUsersClient initialPendingUsers={pendingUsers} />

              {/* Enhanced Quick Actions & Stats */}
              <div className="lg:col-span-1">
                <EnhancedQuickActions />
              </div>
            </div>

            {/* Todos Overview */}
            <ErrorBoundary>
              <TodosOverview />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
