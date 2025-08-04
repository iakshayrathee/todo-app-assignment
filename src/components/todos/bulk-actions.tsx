'use client';

import { useState } from 'react';
import { Loader2, Trash2, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BulkActionsProps {
  selectedIds: number[];
  onSuccess: () => void;
}

export function BulkActions({ selectedIds, onSuccess }: BulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'complete' | 'delete' | null>(null);

  const handleBulkAction = async (action: 'complete' | 'delete') => {
    if (selectedIds.length === 0) return;
    
    setIsLoading(true);
    setAction(action);
    
    try {
      const response = await fetch('/api/todos/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedIds,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} todos`);
      }

      toast.success(
        action === 'complete' 
          ? `${selectedIds.length} ${selectedIds.length === 1 ? 'task' : 'tasks'} marked as complete`
          : `${selectedIds.length} ${selectedIds.length === 1 ? 'task' : 'tasks'} deleted`
      );
      
      onSuccess();
    } catch (error) {
      console.error(`Error ${action}ing todos:`, error);
      toast.error(`Failed to ${action} selected todos`);
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
      <span className="text-sm text-muted-foreground mr-2">
        {selectedIds.length} {selectedIds.length === 1 ? 'task' : 'tasks'} selected
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleBulkAction('complete')}
        disabled={isLoading && action === 'complete'}
        className="h-8 gap-1"
      >
        {isLoading && action === 'complete' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckSquare className="h-4 w-4" />
        )}
        Mark as Complete
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleBulkAction('delete')}
        disabled={isLoading && action === 'delete'}
        className="h-8 gap-1 text-destructive hover:text-destructive"
      >
        {isLoading && action === 'delete' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        Delete
      </Button>
    </div>
  );
}
