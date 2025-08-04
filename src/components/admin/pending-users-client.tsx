'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { pusherClient } from '@/lib/pusher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserApprovalCard } from './user-approval-card';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Clock, CheckCircle } from 'lucide-react';

interface User {
  id: number;
  name: string | null;
  email: string;
  password: string;
  approved: boolean;
  createdAt: Date;
  role: 'admin' | 'user';
}

interface PendingUsersClientProps {
  initialPendingUsers: User[];
}

export function PendingUsersClient({ initialPendingUsers }: PendingUsersClientProps) {
  const { data: session } = useSession();
  const [pendingUsers, setPendingUsers] = useState<User[]>(initialPendingUsers);

  useEffect(() => {
    if (!session?.user?.id || session?.user?.role !== 'admin') {
      console.log('[PendingUsersClient] No session or not admin, skipping Pusher setup');
      return;
    }

    const channelName = `private-user-${session.user.id}`;
    console.log('[PendingUsersClient] Setting up Pusher subscription with user ID:', session.user.id);
    
    // Clean up any existing subscription
    pusherClient.unsubscribe(channelName);
    
    // Subscribe to the channel
    const channel = pusherClient.subscribe(channelName);
    console.log('[PendingUsersClient] Subscribed to channel:', channelName);

    // Handle real-time user registration updates
    const handleUserRegistered = (data: { userId: number; userName: string; userEmail: string; timestamp: string }) => {
      console.log('[PendingUsersClient] Received user registration:', data);
      
      const newUser: User = {
        id: data.userId,
        name: data.userName,
        email: data.userEmail,
        password: '', // Password not needed for display
        approved: false,
        createdAt: new Date(data.timestamp),
        role: 'user',
      };

      // Add the new user to the pending list
      setPendingUsers(prev => {
        // Check if user already exists to prevent duplicates
        const exists = prev.some(user => user.id === newUser.id);
        if (exists) return prev;
        return [newUser, ...prev];
      });

      console.log('[PendingUsersClient] Adding new user to UI:', newUser);
      
      // Scroll to the approval section after a short delay
      setTimeout(() => {
        const approvalSection = document.getElementById('user-approvals');
        if (approvalSection) {
          console.log('[PendingUsersClient] Scrolling to approval section');
          approvalSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          console.log('[PendingUsersClient] Could not find approval section element');
        }
      }, 100);
    };

    // Handle user approval/rejection updates
    const handleUserApproved = (data: { userId: number }) => {
      setPendingUsers(prev => prev.filter(user => user.id !== data.userId));
    };

    channel.bind('user-registered', handleUserRegistered);
    channel.bind('user-approved', handleUserApproved);

    // Cleanup on unmount
    return () => {
      console.log('[PendingUsersClient] Cleaning up Pusher subscription');
      channel.unbind('user-registered', handleUserRegistered);
      channel.unbind('user-approved', handleUserApproved);
      pusherClient.unsubscribe(channelName);
    };
  }, [session]);

  // Update pending users when a user is approved/rejected
  const handleUserUpdate = (userId: number) => {
    setPendingUsers(prev => prev.filter(user => user.id !== userId));
  };

  return (
    <div className="lg:col-span-2" id="user-approvals">
      {pendingUsers.length > 0 ? (
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-xl">Pending User Approvals</CardTitle>
            </div>
            <CardDescription>
              Review and approve new user registrations ({pendingUsers.length} pending)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
              {pendingUsers.map((user) => (
                <ErrorBoundary key={user.id}>
                  <UserApprovalCard user={user} onUpdate={() => handleUserUpdate(user.id)} />
                </ErrorBoundary>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="h-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground text-center">
              No pending user approvals at the moment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
