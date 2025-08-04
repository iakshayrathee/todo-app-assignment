'use client';

import { useState } from 'react';
import { Todo } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EditTodoForm } from './edit-todo-form';
import { DeleteTodoButton } from './delete-todo-button';
import { Calendar, Clock, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface TodoItemProps {
  todo: Todo;
  onUpdate?: () => void;
}

export function TodoItem({ todo, onUpdate }: TodoItemProps) {
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  const handleToggleComplete = async () => {
    setLoading(true);
    const newStatus = !todo.completed;
    
    try {
      const response = await fetch('/api/todos/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          todoId: todo.id,
          completed: newStatus,
        }),
      });

      if (response.ok) {
        // Show success notification
        toast.success(
          newStatus 
            ? `✅ Task "${todo.title}" marked as complete!` 
            : `🔄 Task "${todo.title}" marked as incomplete`
        );
        if (onUpdate) {
          onUpdate();
        } else {
          router.refresh();
        }
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
      toast.error(
        `Failed to ${newStatus ? 'complete' : 'mark as incomplete'} task. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

  return (
    <Card className={`transition-all ${todo.completed ? 'opacity-75' : ''} ${isOverdue ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' : ''}`}>
      <CardContent className="pt-4">
        <div className="flex items-start space-x-4">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={handleToggleComplete}
            disabled={loading}
            className="mt-1"
          />
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                {todo.title}
              </h3>
              <div className="flex items-center space-x-2">
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Todo</DialogTitle>
                    </DialogHeader>
                    <EditTodoForm 
                      todo={todo} 
                      onClose={() => setEditOpen(false)} 
                      onSuccess={() => {
                        setEditOpen(false);
                        if (onUpdate) {
          onUpdate();
        }
                      }}
                    />
                  </DialogContent>
                </Dialog>
                <DeleteTodoButton 
                  todoId={todo.id} 
                  onSuccess={onUpdate}
                />
              </div>
            </div>
            
            {todo.description && (
              <p className={`text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                {todo.description}
              </p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              {todo.dueDate && (
                <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                  <Calendar className="h-4 w-4" />
                  <span>Due: {new Date(todo.dueDate).toLocaleDateString()}</span>
                  {isOverdue && <Badge variant="destructive" className="ml-2">Overdue</Badge>}
                </div>
              )}
              
              {todo.tags && todo.tags.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="h-4 w-4" />
                  <div className="flex space-x-1">
                    {todo.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Created: {new Date(todo.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
