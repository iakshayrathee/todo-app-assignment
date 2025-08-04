'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User } from '@/lib/db/schema';
import { useRouter } from 'next/navigation';

interface UserApprovalCardProps {
  user: User;
  onUpdate?: () => void;
}

export function UserApprovalCard({ user, onUpdate }: UserApprovalCardProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleApproval = async (approved: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          approved,
        }),
      });

      if (response.ok) {
        // Call onUpdate callback if provided, otherwise refresh
        if (onUpdate) {
          onUpdate();
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      console.error('Error updating user approval:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.email}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Registered: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="secondary">{user.role}</Badge>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApproval(false)}
              disabled={loading}
            >
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => handleApproval(true)}
              disabled={loading}
            >
              Approve
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
