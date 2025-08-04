import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

if (!process.env.NEXT_PUBLIC_PUSHER_APP_KEY) {
  throw new Error('Missing NEXT_PUBLIC_PUSHER_APP_KEY environment variable');
}

if (!process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
  throw new Error('Missing NEXT_PUBLIC_PUSHER_CLUSTER environment variable');
}

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    channelAuthorization: {
      endpoint: '/api/pusher/auth',
      transport: 'ajax',
    },
  }
);

// Helper to generate channel name for user-specific notifications
export function getUserChannel(userId: number | string): string {
  return `private-user-${userId}`;
}

// Helper to generate channel name for admin notifications
export function getAdminChannel(): string {
  return 'private-admin';
}
