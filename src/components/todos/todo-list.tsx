'use client';

import { useState, useCallback } from 'react';
import { Todo } from '@/lib/db/schema';
import { TodoItem } from './todo-item';
import { BulkActions } from './bulk-actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface TodoListProps {
  todos: Todo[];
  onUpdate?: () => void;
}

export function TodoList({ todos, onUpdate }: TodoListProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const toggleSelectAll = () => {
    if (selectAll || selectedIds.length > 0) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(todos.map(todo => todo.id));
      setSelectAll(true);
    }
  };

  const toggleTodoSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(todoId => todoId !== id)
        : [...prev, id]
    );
    setSelectAll(false);
  };

  const handleBulkActionSuccess = useCallback(() => {
    setSelectedIds([]);
    setSelectAll(false);
    onUpdate?.();
  }, [onUpdate]);

  if (todos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          No todos found. Create your first todo above!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={selectAll || (selectedIds.length > 0 && selectedIds.length === todos.length)}
            onCheckedChange={toggleSelectAll}
            className="h-5 w-5 rounded-md border-gray-300"
          />
          {isSelecting || selectedIds.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedIds([]);
                setSelectAll(false);
                setIsSelecting(false);
              }}
              className="h-8 px-2 text-sm text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSelecting(true)}
              className="h-8 px-2 text-sm text-muted-foreground"
            >
              <Check className="h-4 w-4 mr-1" />
              Select
            </Button>
          )}
        </div>
        
        {(isSelecting || selectedIds.length > 0) && (
          <div className="text-sm text-muted-foreground">
            {selectedIds.length} of {todos.length} selected
          </div>
        )}
      </div>

      {(isSelecting || selectedIds.length > 0) && (
        <BulkActions 
          selectedIds={selectedIds} 
          onSuccess={handleBulkActionSuccess} 
        />
      )}

      <div className={`space-y-3 ${todos.length > 4 ? 'max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800' : ''}`}>
        {todos.map((todo) => (
          <div key={todo.id} className="flex items-start space-x-3">
            {(isSelecting || selectedIds.length > 0) && (
              <div className="pt-2.5">
                <Checkbox
                  id={`todo-${todo.id}`}
                  checked={selectedIds.includes(todo.id)}
                  onCheckedChange={() => toggleTodoSelection(todo.id)}
                  className="h-5 w-5 rounded-md border-gray-300"
                />
              </div>
            )}
            <div className="flex-1">
              <TodoItem todo={todo} onUpdate={onUpdate} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
