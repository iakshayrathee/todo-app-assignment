import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { todos, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Fetch all todos with user information
    const allTodos = await db
      .select({
        id: todos.id,
        title: todos.title,
        description: todos.description,
        completed: todos.completed,
        dueDate: todos.dueDate,
        tags: todos.tags,
        createdAt: todos.createdAt,
        updatedAt: todos.updatedAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(todos)
      .leftJoin(users, eq(todos.userId, users.id))
      .orderBy(desc(todos.createdAt));

    if (format === 'json') {
      // Return JSON format
      const jsonData = {
        exportDate: new Date().toISOString(),
        totalTodos: allTodos.length,
        todos: allTodos.map(todo => ({
          id: todo.id,
          title: todo.title,
          description: todo.description || '',
          completed: todo.completed,
          dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
          tags: todo.tags || [],
          createdAt: new Date(todo.createdAt).toISOString(),
          updatedAt: new Date(todo.updatedAt).toISOString(),
          user: {
            email: todo.userEmail,
            name: todo.userName || '',
          }
        }))
      };

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="todos_export_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } else {
      // Return CSV format
      const csvHeaders = [
        'ID',
        'Title',
        'Description',
        'Completed',
        'Due Date',
        'Tags',
        'Created At',
        'Updated At',
        'User Email',
        'User Name'
      ];

      const csvRows = allTodos.map(todo => [
        todo.id.toString(),
        `"${todo.title.replace(/"/g, '""')}"`, // Escape quotes in CSV
        `"${(todo.description || '').replace(/"/g, '""')}"`,
        todo.completed ? 'Yes' : 'No',
        todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : '',
        `"${(todo.tags || []).join(', ')}"`,
        new Date(todo.createdAt).toLocaleDateString(),
        new Date(todo.updatedAt).toLocaleDateString(),
        todo.userEmail || '',
        `"${(todo.userName || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="todos_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting todos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
