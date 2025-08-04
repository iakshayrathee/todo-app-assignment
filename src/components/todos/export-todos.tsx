'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export function ExportTodos() {
  const exportAsCSV = async () => {
    try {
      const response = await fetch('/api/todos/export?format=csv');
      if (!response.ok) {
        throw new Error('Failed to export todos as CSV');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'todos.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Todos exported as CSV successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export todos');
    }
  };

  const exportAsJSON = async () => {
    try {
      const response = await fetch('/api/todos/export?format=json');
      if (!response.ok) {
        throw new Error('Failed to export todos as JSON');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'todos.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Todos exported as JSON successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export todos');
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportAsCSV}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportAsJSON}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        JSON
      </Button>
    </div>
  );
}
