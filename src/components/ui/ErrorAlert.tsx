// src/components/ui/ErrorAlert.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <span className="block sm:inline">{message}</span>
      </div>
      {onRetry && (
        <div className="mt-2">
          <button 
            onClick={onRetry} 
            className="text-sm underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}