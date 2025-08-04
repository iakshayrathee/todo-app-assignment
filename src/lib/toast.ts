import { toast } from 'sonner';
import { ApiError } from './validations';

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Enhanced toast notification functions
export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },

  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 6000,
    });
  },

  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 5000,
    });
  },

  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },
};

// API error handler with proper error messages
export function handleApiError(error: unknown, fallbackMessage = 'An unexpected error occurred') {
  console.error('API Error:', error);

  if (error instanceof Response) {
    // Handle Response objects
    error.json().then((errorData: ApiError) => {
      showToast.error(
        errorData.error || fallbackMessage,
        errorData.details || `Status: ${error.status}`
      );
    }).catch(() => {
      showToast.error(fallbackMessage, `HTTP ${error.status}: ${error.statusText}`);
    });
    return;
  }

  if (error instanceof Error) {
    // Handle Error objects
    if (error.message.includes('fetch')) {
      showToast.error('Network Error', 'Please check your internet connection and try again.');
      return;
    }

    if (error.message.includes('timeout')) {
      showToast.error('Request Timeout', 'The request took too long. Please try again.');
      return;
    }

    if (error.message.includes('Account pending approval')) {
      showToast.warning('Account Pending', 'Your account is awaiting admin approval. Please contact support if this takes too long.');
      return;
    }

    showToast.error('Error', error.message);
    return;
  }

  // Handle string errors
  if (typeof error === 'string') {
    showToast.error('Error', error);
    return;
  }

  // Handle object errors with error property
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const apiError = error as ApiError;
    showToast.error(
      apiError.error || fallbackMessage,
      apiError.details
    );
    return;
  }

  // Fallback for unknown error types
  showToast.error(fallbackMessage, 'Please try again or contact support if the problem persists.');
}

// Success message handlers for common operations
export const showSuccessToast = {
  todoCreated: () => showToast.success('Task Created', 'Your new task has been added successfully.'),
  todoUpdated: () => showToast.success('Task Updated', 'Your task has been updated successfully.'),
  todoDeleted: () => showToast.success('Task Deleted', 'Your task has been removed successfully.'),
  todoCompleted: () => showToast.success('Task Completed', 'Great job! Task marked as completed.'),
  todoUncompleted: () => showToast.success('Task Reopened', 'Task marked as pending.'),
  bulkCompleted: (count: number) => showToast.success('Tasks Completed', `${count} task${count > 1 ? 's' : ''} marked as completed.`),
  bulkDeleted: (count: number) => showToast.success('Tasks Deleted', `${count} task${count > 1 ? 's' : ''} removed successfully.`),
  userApproved: () => showToast.success('User Approved', 'User has been approved and can now access the system.'),
  userRejected: () => showToast.success('User Rejected', 'User has been rejected and removed from the system.'),
  exportCompleted: (format: string) => showToast.success('Export Completed', `Your tasks have been exported as ${format.toUpperCase()}.`),
  signInSuccess: (name?: string) => showToast.success('Welcome Back!', name ? `Hello ${name}` : 'You have been signed in successfully.'),
  signUpSuccess: () => showToast.info('Account Created', 'Your account has been created and is pending admin approval.'),
  signOutSuccess: () => showToast.info('Signed Out', 'You have been signed out successfully.'),
};

// Loading states for async operations
export const showLoadingToast = {
  creatingTodo: () => showToast.loading('Creating task...'),
  updatingTodo: () => showToast.loading('Updating task...'),
  deletingTodo: () => showToast.loading('Deleting task...'),
  bulkAction: (action: string, count: number) => showToast.loading(`${action === 'complete' ? 'Completing' : 'Deleting'} ${count} task${count > 1 ? 's' : ''}...`),
  exporting: (format: string) => showToast.loading(`Exporting as ${format.toUpperCase()}...`),
  signingIn: () => showToast.loading('Signing in...'),
  signingUp: () => showToast.loading('Creating account...'),
  approvingUser: () => showToast.loading('Processing approval...'),
};
