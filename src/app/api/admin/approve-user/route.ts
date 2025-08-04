import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, approved } = await request.json();

    if (typeof userId !== 'number' || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    if (approved) {
      // Approve the user
      await db
        .update(users)
        .set({ approved: true })
        .where(eq(users.id, userId));

      return NextResponse.json({ message: 'User approved successfully' });
    } else {
      // Reject the user (delete their account)
      await db.delete(users).where(eq(users.id, userId));

      return NextResponse.json({ message: 'User rejected and removed' });
    }
  } catch (error) {
    console.error('User approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
