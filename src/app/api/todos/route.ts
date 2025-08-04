import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { todos, users } from '@/lib/db/schema';
import { eq, and, or, desc, sql, type SQL } from 'drizzle-orm';
import { sendNotification, sendTaskCompleteNotification } from '@/lib/notifications';

// GET - Fetch user's todos with optional filtering and searching
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = parseInt(session.user.id);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';

    // Build the query conditions
    const conditions = [eq(todos.userId, userId)];
    
    // Apply status filter
    if (filter === 'completed') {
      conditions.push(eq(todos.completed, true));
    } else if (filter === 'pending') {
      conditions.push(eq(todos.completed, false));
    }

    // Apply search filter if provided
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      const searchConditions: SQL[] = [
        sql`LOWER(${todos.title}) LIKE ${searchTerm}`,
        sql`LOWER(COALESCE(${todos.description}, '')) LIKE ${searchTerm}`
      ];
      
      conditions.push(or(...searchConditions));
    }

    // Execute the query with all conditions
    const userTodos = await db
      .select()
      .from(todos)
      .where(and(...conditions))
      .orderBy(desc(todos.createdAt));

    return NextResponse.json(userTodos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new todo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, dueDate, tags } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
    const [newTodo] = await db
      .insert(todos)
      .values({
        title: title.trim(),
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags || [],
        userId,
        completed: false,
      })
      .returning();

    // Send notification for new task
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      const now = new Date();
      const timeUntilDue = dueDateObj.getTime() - now.getTime();
      
      // Only schedule notification if due date is in the future
      if (timeUntilDue > 0) {
        // Schedule notification for 1 hour before due
        const notificationTime = new Date(dueDateObj.getTime() - 60 * 60 * 1000);
        
        // In a production app, you would use a job queue for this
        setTimeout(() => {
          sendNotification({
            userId,
            type: 'warning',
            title: 'Task Due Soon',
            message: `"${title.trim()}" is due in 1 hour.`,
            action: {
              label: 'View Task',
              url: '/dashboard',
            },
          });
        }, notificationTime.getTime() - now.getTime());
      }
    }

    return NextResponse.json(newTodo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update todo
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, title, description, dueDate, tags } = await request.json();

    if (!id || !title || !title.trim()) {
      return NextResponse.json(
        { error: 'ID and title are required' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Verify the todo belongs to the user
    const existingTodo = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .limit(1);

    if (existingTodo.length === 0) {
      return NextResponse.json(
        { error: 'Todo not found or unauthorized' },
        { status: 404 }
      );
    }

    const [updatedTodo] = await db
      .update(todos)
      .set({
        title: title.trim(),
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags || [],
        updatedAt: new Date(),
      })
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning();

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete todo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Verify the todo belongs to the user
    const existingTodo = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .limit(1);

    if (existingTodo.length === 0) {
      return NextResponse.json(
        { error: 'Todo not found or unauthorized' },
        { status: 404 }
      );
    }

    await db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)));

    return NextResponse.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
