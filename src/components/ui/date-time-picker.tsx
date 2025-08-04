'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [timeValue, setTimeValue] = React.useState<string>(() => {
    if (value) {
      return formatTime(new Date(value));
    }
    // Set to current time rounded to nearest 15 minutes
    const now = new Date();
    const minutes = Math.round(now.getMinutes() / 15) * 15;
    now.setMinutes(minutes, 0, 0);
    return formatTime(now);
  });

  // Reset internal state when value prop changes to empty
  React.useEffect(() => {
    if (!value) {
      setSelectedDate(undefined);
      // Reset to current time
      const now = new Date();
      const minutes = Math.round(now.getMinutes() / 15) * 15;
      now.setMinutes(minutes, 0, 0);
      setTimeValue(formatTime(now));
    } else {
      setSelectedDate(new Date(value));
      setTimeValue(formatTime(new Date(value)));
    }
  }, [value]);

  function formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  function formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const handleDateChange = (dateString: string) => {
    if (dateString) {
      const date = new Date(dateString);
      setSelectedDate(date);
      // Combine date with current time
      const [hours, minutes] = timeValue.split(':');
      const newDateTime = new Date(date);
      newDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      onChange?.(newDateTime.toISOString());
    }
  };

  const handleTimeChange = (time: string) => {
    setTimeValue(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(':');
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      onChange?.(newDateTime.toISOString());
    }
  };



  const clearDateTime = () => {
    setSelectedDate(undefined);
    setTimeValue('09:00');
    onChange?.(undefined);
    setOpen(false);
  };

  const formatDisplayValue = () => {
    if (!selectedDate) return '';
    return formatDisplayDate(selectedDate);
  };

  // Generate time options (every 15 minutes)
  const timeOptions = React.useMemo(() => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const date = new Date(`2000-01-01T${timeString}`);
        const displayTime = date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        options.push({ value: timeString, label: displayTime });
      }
    }
    return options;
  }, []);



  return (
    <div className={cn("grid gap-2", className)}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-11",
              !selectedDate && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? formatDisplayValue() : placeholder}
            {selectedDate && (
              <X 
                className="ml-auto h-4 w-4 hover:text-destructive" 
                onClick={(e) => {
                  e.stopPropagation();
                  clearDateTime();
                }}
              />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Date & Time</DialogTitle>
            <DialogDescription>
              Choose when this task is due
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Date Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Date
              </Label>
              <Input
                type="date"
                value={selectedDate ? selectedDate.toISOString().slice(0, 10) : ''}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="h-11"
              />
            </div>

            {/* Time Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              <Select value={timeValue} onValueChange={handleTimeChange}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>



            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={clearDateTime}
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
