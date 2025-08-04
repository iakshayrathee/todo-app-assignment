import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { todos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { parse } from 'json2csv';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Get all todos for the current user
    const userTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, parseInt(session.user.id)));

    // Format todos for export
    const formattedTodos = userTodos.map(todo => ({
      id: todo.id,
      title: todo.title,
      description: todo.description || '',
      completed: todo.completed ? 'Yes' : 'No',
      createdAt: new Date(todo.createdAt).toISOString(),
      updatedAt: new Date(todo.updatedAt).toISOString(),
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : '',
      tags: todo.tags ? todo.tags.join(', ') : ''
    }));

    // Return in requested format
    if (format.toLowerCase() === 'csv') {
      const csv = parse(formattedTodos);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="todos.csv"',
        },
      });
    }

    // Default to JSON
    return NextResponse.json(formattedTodos, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="todos.json"',
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
