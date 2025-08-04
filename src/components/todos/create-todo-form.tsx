'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Tag, Plus, Loader2 } from 'lucide-react';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { todoApi } from '@/lib/api';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface CreateTodoFormProps {
  onSuccess?: () => void;
}

export function CreateTodoForm({ onSuccess }: CreateTodoFormProps = {}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Create a simple form schema for input
  const formSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    tags: z.string().optional(),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      tags: '',
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      // Transform tags from string to array
      const tagsArray = values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];
      
      await todoApi.create({
        title: values.title,
        description: values.description,
        dueDate: values.dueDate,
        tags: tagsArray,
      });

      // Reset form on success
      form.reset({
        title: '',
        description: '',
        dueDate: '',
        tags: '',
      });
      
      // Call onSuccess callback to trigger real-time UI update
      if (onSuccess) {
        onSuccess();
      } else {
        // Fallback to router refresh if no callback provided
        router.refresh();
      }
    } catch (error) {
      // Error handling is done in the API layer
      console.error('Error creating todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedTags = form.watch('tags');
  const tagArray = watchedTags ? watchedTags.split(' ').map((tag: string) => tag.trim()).filter(Boolean) : [];

  return (
    <ErrorBoundary>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Create New Task</CardTitle>
          </div>
          <CardDescription>
            Add a new task to your todo list with optional details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Task Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="What needs to be done?"
                        className="h-11"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add more details about this task (optional)"
                        className="resize-none min-h-[80px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Due Date
                    </FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select due date and time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="work personal urgent (separate with spaces)"
                        className="h-11"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-muted-foreground">
                      Separate tags with spaces. Tags containing spaces will be split into multiple tags. (max 5 tags, 20 chars each)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tag Preview */}
              {tagArray.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Tag Preview:</p>
                  <div className="flex flex-wrap gap-2">
                    {tagArray.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 font-medium" 
                disabled={isSubmitting || !form.formState.isValid}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Task...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
