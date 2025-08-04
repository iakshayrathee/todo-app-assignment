import { db } from '@/lib/db';
import { todos, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { TodosOverviewClient } from './todos-overview-client';

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

  // Convert Date objects to serializable format for client component
  const serializedTodos = allTodos.map(todo => ({
    ...todo,
    createdAt: todo.createdAt instanceof Date ? todo.createdAt.toISOString() : todo.createdAt,
    dueDate: todo.dueDate instanceof Date ? todo.dueDate.toISOString() : todo.dueDate,
  }));

  return <TodosOverviewClient initialTodos={serializedTodos} />;
}
