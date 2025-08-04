import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export async function GET() {
  console.log('[Pusher Test] Starting test request...');
  
  try {
    // Get user session
    console.log('[Pusher Test] Getting server session...');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('[Pusher Test] Unauthorized - No valid session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const channelName = `private-user-${userId}`;
    const testEvent = 'notification'; // Changed from 'test-event' to 'notification' to match client listener
    const testData = { 
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification from Pusher',
      timestamp: new Date().toISOString(),
      userId,
      channel: channelName
    };

    console.log(`[Pusher Test] Sending test event to channel: ${channelName}`, {
      event: testEvent,
      data: testData
    });

    // Test Pusher server connection
    const pusherResponse = await pusherServer.trigger(
      channelName,
      testEvent,
      testData
    );

    console.log('[Pusher Test] Pusher response:', {
      status: 'success',
      pusherResponse,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true,
      message: 'Pusher test event triggered successfully',
      channel: channelName,
      event: testEvent,
      data: testData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Pusher Test] Error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to trigger Pusher event',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
