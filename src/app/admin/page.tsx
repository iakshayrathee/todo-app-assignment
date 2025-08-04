import { db } from '@/lib/db';
import { users, todos } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { ErrorBoundary } from '@/components/ui/error-boundary';

import { PendingUsersClient } from '@/components/admin/pending-users-client';
import { AdminStatsClient } from '@/components/admin/admin-stats-client';
import { EnhancedQuickActions } from '@/components/admin/enhanced-quick-actions';
import { TodosOverview } from '@/components/admin/todos-overview';

export default async function AdminDashboard() {
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

            {/* Stats Cards - Real-time Client Component */}
            <AdminStatsClient initialStats={stats} />

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
