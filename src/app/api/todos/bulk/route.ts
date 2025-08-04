import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { todos } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

type BulkAction = 'complete' | 'delete';

interface BulkRequest {
  ids: number[];
  action: BulkAction;
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { ids, action }: BulkRequest = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return new NextResponse('No todo IDs provided', { status: 400 });
    }

    if (action !== 'complete' && action !== 'delete') {
      return new NextResponse('Invalid action', { status: 400 });
    }

    const userId = parseInt(session.user.id);
    // Only allow actions on todos that belong to the current user
    const userTodos = await db
      .select({ id: todos.id })
      .from(todos)
      .where(
        and(
          inArray(todos.id, ids),
          eq(todos.userId, userId)
        )
      );

    const validIds = userTodos.map(todo => todo.id);
    
    if (validIds.length === 0) {
      return new NextResponse('No valid todos found', { status: 404 });
    }

    if (action === 'complete') {
      await db
        .update(todos)
        .set({ 
          completed: true,
          updatedAt: new Date()
        })
        .where(inArray(todos.id, validIds));
    } else if (action === 'delete') {
      await db
        .delete(todos)
        .where(inArray(todos.id, validIds));
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully ${action}d ${validIds.length} ${validIds.length === 1 ? 'todo' : 'todos'}`,
      count: validIds.length
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
