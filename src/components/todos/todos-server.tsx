import { db } from '@/lib/db';
import { todos } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { TodoList } from './todo-list';
import { Todo } from '@/lib/db/schema';

interface TodosServerProps {
  userId: number;
  filter: string;
  search: string;
}

export async function TodosServer({
  userId,
  filter,
  search,
}: TodosServerProps) {
  try {
    const userTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(desc(todos.createdAt));

    // Apply filters
    const filteredTodos = userTodos.filter((todo: Todo) => {
      const matchesFilter = 
        filter === 'all' || 
        (filter === 'completed' && todo.completed) || 
        (filter === 'pending' && !todo.completed);
      
      const matchesSearch = todo.title.toLowerCase().includes(search.toLowerCase()) ||
                          (todo.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
      
      return matchesFilter && matchesSearch;
    });

    return <TodoList todos={filteredTodos} onUpdate={() => {}} />;
  } catch (error) {
    console.error('Error fetching todos:', error);
    return <div>Error loading todos. Please try again later.</div>;
  }
}
