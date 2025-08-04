"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="space-y-4 max-w-md">
        <h2 className="text-2xl font-bold text-destructive">
          Something went wrong!
        </h2>
        <p className="text-muted-foreground">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="pt-4">
          <Button
            onClick={() => reset()}
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
