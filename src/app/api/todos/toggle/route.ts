import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { todos, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendTaskCompleteNotification, sendRecentTodoNotification } from '@/lib/notifications';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { todoId, completed } = await request.json();

    if (typeof todoId !== 'number' || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Verify the todo belongs to the user
    const existingTodo = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
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
        completed,
        updatedAt: new Date(),
      })
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
      .returning();

    // If task was just marked as completed, send notification to admin
    if (completed && !existingTodo[0].completed) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user) {
        await sendTaskCompleteNotification(
          updatedTodo.title,
          user.name || user.email || 'A user'
        );
        
        // Also send recent todo notification for completion
        await sendRecentTodoNotification(
          updatedTodo.id,
          updatedTodo.title,
          userId,
          'completed'
        );
      }
    }

    // Send real-time event to admin dashboard for stats update
    try {
      const admins = await db
        .select()
        .from(users)
        .where(eq(users.role, 'admin'));

      for (const admin of admins) {
        await pusherServer.trigger(
          `private-user-${admin.id}`,
          'todo-completed',
          {
            todoId: todoId,
            userId: userId,
            completed: completed
          }
        );
      }
    } catch (error) {
      console.error('Error sending todo completion notification:', error);
    }

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error('Error toggling todo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
