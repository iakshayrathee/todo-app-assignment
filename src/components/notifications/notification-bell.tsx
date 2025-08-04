'use client';

import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNotifications } from '../providers/notification-provider';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const { 
    notifications, 
    markAsRead, 
    clearNotification, 
    clearAllNotifications, 
    unreadCount 
  } = useNotifications();

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    // You can add navigation or other actions here
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearAllNotifications();
              }}
              className="h-6 text-xs"
            >
              Clear all
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        ) : (
          <ScrollArea className="h-72">
            <DropdownMenuGroup>
              {notifications.map((notification) => (
                <div key={notification.id} className="relative">
                  <DropdownMenuItem
                    className={cn(
                      'flex flex-col items-start gap-1 py-3 pr-8',
                      !notification.read && 'bg-muted/50'
                    )}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex w-full items-start justify-between">
                      <span className="font-medium">{notification.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 opacity-0 group-hover:opacity-100',
                        !notification.read && 'opacity-100'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
              ))}
            </DropdownMenuGroup>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
