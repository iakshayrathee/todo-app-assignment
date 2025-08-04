import { pusherServer } from '@/lib/pusher';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await req.formData();
    const socketId = formData.get('socket_id') as string;
    const channel = formData.get('channel_name') as string;
    const userId = session.user.id;

    // Verify the user is authorized to subscribe to this channel
    if (channel === `private-user-${userId}` || 
        (channel === 'private-admin' && session.user.role === 'admin')) {
      const auth = pusherServer.authorizeChannel(socketId, channel, {
        user_id: userId,
        user_info: {
          id: userId,
          email: session.user.email,
          role: session.user.role,
        },
      });
      return NextResponse.json(auth);
    }

    return new NextResponse('Forbidden', { status: 403 });
  } catch (error) {
    console.error('Pusher auth error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
