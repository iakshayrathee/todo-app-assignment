import { db } from '@/lib/db';
import { todos, users } from '@/lib/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { eq, desc } from 'drizzle-orm';

export async function TodosOverview() {
  const allTodos = await db
    .select({
      id: todos.id,
      title: todos.title,
      description: todos.description,
      completed: todos.completed,
      dueDate: todos.dueDate,
      createdAt: todos.createdAt,
      userEmail: users.email,
    })
    .from(todos)
    .leftJoin(users, eq(todos.userId, users.id))
    .orderBy(desc(todos.createdAt))
    .limit(10);

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
          {allTodos.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No todos found
            </p>
          ) : (
            allTodos.map((todo) => (
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
