'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
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
    if (!session?.user?.id) return;

    const channel = pusherClient.subscribe(`private-user-${session.user.id}`);

    // Handle real-time user registration updates (data only, no notifications)
    channel.bind('user-registered', (data: any) => {
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

      // Scroll to the user approval section when new user is added
      setTimeout(() => {
        const approvalSection = document.getElementById('user-approvals');
        if (approvalSection) {
          approvalSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [session?.user?.id]);

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
