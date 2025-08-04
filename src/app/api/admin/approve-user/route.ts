import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { pusherServer } from '@/lib/pusher';

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

      // Notify all admins about the approval
      try {

        const admins = await db
          .select()
          .from(users)
          .where(eq(users.role, 'admin'));

        for (const admin of admins) {
          // Send UI update event (hyphen for PendingUsersClient)
          await pusherServer.trigger(
            `private-user-${admin.id}`,
            'user-approved',
            { userId }
          );
        }
      } catch (error) {
        console.error('Error sending approval notification:', error);
      }

      return NextResponse.json({ message: 'User approved successfully' });
    } else {
      // Reject the user (delete their account)
      await db.delete(users).where(eq(users.id, userId));

      // Notify all admins about the rejection
      try {
        const admins = await db
          .select()
          .from(users)
          .where(eq(users.role, 'admin'));

        for (const admin of admins) {
          // Send UI update event (hyphen for PendingUsersClient)
          await pusherServer.trigger(
            `private-user-${admin.id}`,
            'user-approved',
            { userId }
          );
        }
      } catch (error) {
        console.error('Error sending rejection notification:', error);
      }

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
