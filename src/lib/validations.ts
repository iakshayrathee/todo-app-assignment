import { z } from 'zod';

// Enhanced todo form validation
export const todoFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .refine(val => val.trim().length > 0, 'Title cannot be empty or just spaces'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform(val => val?.trim() || undefined),
  dueDate: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime()) && parsedDate > new Date();
    }, 'Due date must be in the future'),
  tags: z.string()
    .optional()
    .transform(str => 
      str ? str.split(',').map(tag => tag.trim()).filter(Boolean) : []
    )
    .refine(
      (tags) => tags.every(tag => tag.length <= 20 && tag.length > 0),
      'Each tag must be between 1-20 characters'
    )
    .refine(
      (tags) => tags.length <= 5,
      'You can add up to 5 tags'
    )
    .refine(
      (tags) => new Set(tags).size === tags.length,
      'Tags must be unique'
    ),
});

export const signInSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform(val => val.toLowerCase().trim()),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
});

export const signUpSchema = signInSchema.extend({
  name: z.string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .refine(val => val.trim().length > 1, 'Name cannot be empty or just spaces')
    .transform(val => val.trim()),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Bulk operations validation
export const bulkActionSchema = z.object({
  ids: z.array(z.number().positive())
    .min(1, 'Please select at least one item')
    .max(50, 'Cannot perform bulk action on more than 50 items'),
  action: z.enum(['complete', 'delete']),
});

// Admin user approval validation
export const userApprovalSchema = z.object({
  userId: z.number().positive('Invalid user ID'),
  approved: z.boolean(),
});

// Search and filter validation
export const todoFilterSchema = z.object({
  filter: z.enum(['all', 'completed', 'pending']).default('all'),
  search: z.string().max(100, 'Search term too long').optional(),
  page: z.number().positive().default(1).optional(),
  limit: z.number().min(1).max(100).default(20).optional(),
});

// API response schemas for better type safety
export const apiErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  code: z.string().optional(),
});

export const apiSuccessSchema = z.object({
  message: z.string(),
  data: z.any().optional(),
});

// Export types
export type TodoFormValues = z.infer<typeof todoFormSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type BulkActionValues = z.infer<typeof bulkActionSchema>;
export type UserApprovalValues = z.infer<typeof userApprovalSchema>;
export type TodoFilterValues = z.infer<typeof todoFilterSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiSuccess = z.infer<typeof apiSuccessSchema>;
