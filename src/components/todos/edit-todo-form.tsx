'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Todo } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

interface EditTodoFormProps {
  todo: Todo;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditTodoForm({ todo, onClose, onSuccess }: EditTodoFormProps) {
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || '');
  const [dueDate, setDueDate] = useState(
    todo.dueDate ? new Date(todo.dueDate).toISOString() : ''
  );
  const [tags, setTags] = useState(todo.tags ? todo.tags.join(' ') : '');
  const [loading, setLoading] = useState(false);
  const [error] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!title.trim()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/todos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: todo.id,
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate || null,
          tags: tags.trim() ? tags.split(' ').map(tag => tag.trim()).filter(Boolean) : [],
        }),
      });

      if (response.ok) {
        toast.success('✏️ Task updated successfully!');
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        const data = await response.json();
        const errorMsg = data.error || 'Failed to update todo';
        toast.error(errorMsg);
      }
    } catch {
      setLoading(false);
      toast.error('Failed to update task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-title">Title *</Label>
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter todo title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-dueDate" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Due Date & Time
          </Label>
          <DateTimePicker
            value={dueDate}
            onChange={(value) => setDueDate(value || '')}
            placeholder="Select due date and time"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter todo description (optional)"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-tags">Tags</Label>
        <Input
          id="edit-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Enter tags separated by spaces (e.g., work urgent personal)"
        />
      </div>

      <div className="flex space-x-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Updating...' : 'Update Todo'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
