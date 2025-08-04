import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { pusherServer } from './pusher';

// Check if Pusher is properly configured
const isPusherConfigured = 
  process.env.PUSHER_APP_ID && 
  process.env.NEXT_PUBLIC_PUSHER_APP_KEY && 
  process.env.PUSHER_SECRET && 
  process.env.PUSHER_CLUSTER;

if (!isPusherConfigured) {
  console.warn('Pusher is not properly configured. Notifications will be disabled.');
}

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationOptions {
  userId?: number | string;
  type?: NotificationType;
  title: string;
  message: string;
  action?: {
    label: string;
    url: string;
  };
}

export async function sendNotification(options: NotificationOptions) {
  try {
    // If Pusher is not configured, just log the notification and return
    if (!isPusherConfigured || !pusherServer) {
      console.log('Notification (Pusher not configured):', options);
      return;
    }

    const { userId, type = 'info', title, message, action } = options;

    // If userId is provided, send to specific user
    if (userId) {
      await pusherServer.trigger(
        `private-user-${userId}`,
        'notification',
        {
          type,
          title,
          message,
          action: action ? {
            label: action.label,
            url: action.url
          } : undefined,
        }
      );
      return;
    }

    // If no userId, send to all admins
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    for (const admin of admins) {
      await pusherServer.trigger(
        `private-user-${admin.id}`,
        'notification',
        {
          type,
          title: `[Admin] ${title}`,
          message,
          action: action ? {
            label: action.label,
            url: action.url
          } : undefined,
        }
      );
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Helper function to send task due notifications
export async function sendTaskDueNotification(
  userId: string,
  taskTitle: string,
  dueDate: Date
) {
  const timeUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60));
  
  await sendNotification({
    userId,
    type: 'warning',
    title: 'Task Due Soon',
    message: `"${taskTitle}" is due in ${timeUntilDue} hours.`,
    action: {
      label: 'View Task',
      url: `/dashboard`,
    },
  });
}

// Helper function to send task completion notification to admin
export async function sendTaskCompleteNotification(
  taskTitle: string,
  userName: string
) {
  await sendNotification({
    type: 'success',
    title: 'Task Completed',
    message: `"${taskTitle}" has been marked as completed by ${userName}.`,
    action: {
      label: 'View Task',
      url: `/admin`,
    },
  });
}

// Helper function to send new user registration notification to admin
export async function sendNewUserNotification(
  userName: string,
  userEmail: string,
  userId: number
) {
  try {
    if (!isPusherConfigured || !pusherServer) {
      console.log('New user notification (Pusher not configured):', { userName, userEmail, userId });
      return;
    }

    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    // Send both notification and real-time update to each admin
    for (const admin of admins) {
      // Send notification
      await pusherServer.trigger(
        `private-user-${admin.id}`,
        'notification',
        {
          type: 'info',
          title: 'New User Registration',
          message: `${userName} (${userEmail}) has registered and is pending approval.`,
          action: {
            label: 'Review User',
            url: '/admin'
          }
        }
      );

      // Send real-time data update for UI (hyphen for PendingUsersClient)
      await pusherServer.trigger(
        `private-user-${admin.id}`,
        'user-registered',
        {
          userId,
          userName,
          userEmail,
          timestamp: new Date().toISOString()
        }
      );
    }
  } catch (error) {
    console.error('Error sending new user notification:', error);
  }
}

// Helper function to send recent todo notification
export async function sendRecentTodoNotification(
  todoId: number,
  todoTitle: string,
  todoUserId: number,
  action: 'created' | 'updated' | 'completed' | 'deleted'
) {
  try {
    if (!isPusherConfigured || !pusherServer) {
      console.log('Recent todo notification (Pusher not configured):', { todoId, todoTitle, todoUserId, action });
      return;
    }

    // Get the user who owns the todo
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, todoUserId))
      .limit(1);

    if (!user.length) {
      console.error('User not found for todo notification');
      return;
    }

    const userName = user[0].name;

    // Get all admins to notify them
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    // Send both notification and real-time update to each admin
    for (const admin of admins) {
      // Determine notification details based on action
      let title = '';
      let message = '';
      let type: NotificationType = 'info';

      switch (action) {
        case 'created':
          title = 'New Todo Created';
          message = `${userName} created a new todo: "${todoTitle}"`;
          type = 'info';
          break;
        case 'updated':
          title = 'Todo Updated';
          message = `${userName} updated todo: "${todoTitle}"`;
          type = 'info';
          break;
        case 'completed':
          title = 'Todo Completed';
          message = `${userName} completed todo: "${todoTitle}"`;
          type = 'success';
          break;
        case 'deleted':
          title = 'Todo Deleted';
          message = `${userName} deleted todo: "${todoTitle}"`;
          type = 'warning';
          break;
      }

      // Send notification
      await pusherServer.trigger(
        `private-user-${admin.id}`,
        'notification',
        {
          type,
          title,
          message,
          action: {
            label: 'View Todos',
            url: '/admin'
          }
        }
      );

      // Send real-time data update for UI
      await pusherServer.trigger(
        `private-user-${admin.id}`,
        'recent-todo',
        {
          todoId,
          todoTitle,
          userId: todoUserId,
          userName,
          action,
          timestamp: new Date().toISOString()
        }
      );
    }
  } catch (error) {
    console.error('Error sending recent todo notification:', error);
  }
}
