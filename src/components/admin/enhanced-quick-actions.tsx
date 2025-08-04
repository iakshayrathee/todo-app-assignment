'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AllUsersModal } from './all-users-modal';
import { Users, FileText, Database } from 'lucide-react';
import { toast } from 'sonner';

export function EnhancedQuickActions() {
  const [exportingTodos, setExportingTodos] = useState(false);

  const exportTodos = async (format: 'csv' | 'json') => {
    setExportingTodos(true);
    try {
      const response = await fetch(`/api/admin/export-todos?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Failed to export todos');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todos_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Todos exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
      console.error('Error exporting todos:', error);
      toast.error('Failed to export todos. Please try again.');
    } finally {
      setExportingTodos(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          ⚡ Quick Actions
        </CardTitle>
        <CardDescription>
          Common admin tasks and data management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* View All Users */}
        <AllUsersModal 
          trigger={
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              View All Users
            </Button>
          }
        />

        {/* Export Todos */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Export Recent Todos</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTodos('csv')}
              disabled={exportingTodos}
              className="justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTodos('json')}
              disabled={exportingTodos}
              className="justify-start"
            >
              <Database className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>

        {/* System Health */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2 text-sm text-muted-foreground">System Health</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Database</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                ✅ Online
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Notifications</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                ✅ Active
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Real-time Updates</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                ✅ Connected
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
