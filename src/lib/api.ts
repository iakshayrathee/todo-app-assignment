import { handleApiError, showToast, showLoadingToast, showSuccessToast } from './toast';
import { ApiError } from './validations';

// Enhanced fetch wrapper with error handling and loading states
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    showLoading = true,
    loadingMessage?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let loadingToastId: string | number | undefined;

    try {
      // Show loading toast if enabled
      if (showLoading && loadingMessage) {
        loadingToastId = showToast.loading(loadingMessage);
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      // Dismiss loading toast
      if (loadingToastId) {
        showToast.dismiss(loadingToastId);
      }

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Dismiss loading toast on error
      if (loadingToastId) {
        showToast.dismiss(loadingToastId);
      }
      
      handleApiError(error);
      throw error;
    }
  }

  // Todo API methods
  async getTodos(filter = 'all', search = '') {
    const params = new URLSearchParams();
    if (filter !== 'all') params.append('filter', filter);
    if (search) params.append('search', search);
    
    const queryString = params.toString();
    return this.request(`/todos${queryString ? `?${queryString}` : ''}`, {}, false);
  }

  async createTodo(data: { title: string; description?: string; dueDate?: string; tags?: string[] }) {
    const result = await this.request('/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true, 'Creating task...');
    
    showSuccessToast.todoCreated();
    return result;
  }

  async updateTodo(data: { id: number; title: string; description?: string; dueDate?: string; tags?: string[] }) {
    const result = await this.request('/todos', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true, 'Updating task...');
    
    showSuccessToast.todoUpdated();
    return result;
  }

  async deleteTodo(id: number) {
    const result = await this.request('/todos', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }, true, 'Deleting task...');
    
    showSuccessToast.todoDeleted();
    return result;
  }

  async toggleTodo(todoId: number, completed: boolean) {
    const result = await this.request('/todos/toggle', {
      method: 'POST',
      body: JSON.stringify({ todoId, completed }),
    }, false);
    
    if (completed) {
      showSuccessToast.todoCompleted();
    } else {
      showSuccessToast.todoUncompleted();
    }
    return result;
  }

  async bulkAction(ids: number[], action: 'complete' | 'delete') {
    const loadingToastId = showLoadingToast.bulkAction(action, ids.length);
    
    try {
      const result = await this.request('/todos/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ ids, action }),
      }, false);
      
      showToast.dismiss(loadingToastId);
      
      if (action === 'complete') {
        showSuccessToast.bulkCompleted(ids.length);
      } else {
        showSuccessToast.bulkDeleted(ids.length);
      }
      
      return result;
    } catch (error) {
      showToast.dismiss(loadingToastId);
      throw error;
    }
  }

  async exportTodos(format: 'json' | 'csv' = 'json') {
    const loadingToastId = showLoadingToast.exporting(format);
    
    try {
      const response = await fetch(`${this.baseUrl}/todos/export?format=${format}`);
      showToast.dismiss(loadingToastId);
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todos.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccessToast.exportCompleted(format);
    } catch (error) {
      showToast.dismiss(loadingToastId);
      handleApiError(error);
      throw error;
    }
  }

  // Admin API methods
  async approveUser(userId: number, approved: boolean) {
    const loadingToastId = showLoadingToast.approvingUser();
    
    try {
      const result = await this.request('/admin/approve-user', {
        method: 'POST',
        body: JSON.stringify({ userId, approved }),
      }, false);
      
      showToast.dismiss(loadingToastId);
      
      if (approved) {
        showSuccessToast.userApproved();
      } else {
        showSuccessToast.userRejected();
      }
      
      return result;
    } catch (error) {
      showToast.dismiss(loadingToastId);
      throw error;
    }
  }

  // Auth methods
  async signUp(data: { name: string; email: string; password: string }) {
    const loadingToastId = showLoadingToast.signingUp();
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      showToast.dismiss(loadingToastId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Signup failed' }));
        throw new Error(errorData.error);
      }
      
      showSuccessToast.signUpSuccess();
      return await response.json();
    } catch (error) {
      showToast.dismiss(loadingToastId);
      handleApiError(error);
      throw error;
    }
  }
}

// Create singleton instance
export const api = new ApiClient();

// API utility functions

export const todoApi = {
  getAll: (filter?: string, search?: string) => api.getTodos(filter, search),
  create: (data: Parameters<typeof api.createTodo>[0]) => api.createTodo(data),
  update: (data: Parameters<typeof api.updateTodo>[0]) => api.updateTodo(data),
  delete: (id: number) => api.deleteTodo(id),
  toggle: (id: number, completed: boolean) => api.toggleTodo(id, completed),
  bulkComplete: (ids: number[]) => api.bulkAction(ids, 'complete'),
  bulkDelete: (ids: number[]) => api.bulkAction(ids, 'delete'),
  exportJson: () => api.exportTodos('json'),
  exportCsv: () => api.exportTodos('csv'),
};

export const adminApi = {
  approveUser: (userId: number) => api.approveUser(userId, true),
  rejectUser: (userId: number) => api.approveUser(userId, false),
};

export const authApi = {
  signUp: (data: Parameters<typeof api.signUp>[0]) => api.signUp(data),
};
