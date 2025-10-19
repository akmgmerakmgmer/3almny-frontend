"use client";
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * ChatLoadingSkeleton
 * Renders the placeholder skeleton UI for the chat panel while
 * auth/session or history is loading. Extracted from chat page for reuse & cleanliness.
 */
export function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3" />
            <div className="mt-2 space-y-2">
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <div className="flex-1 max-w-[80%]">
            <Skeleton className="h-3 w-4/5 ml-auto" />
            <Skeleton className="h-3 w-2/5 ml-auto mt-2" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24" />
            <div className="mt-2 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t p-4">
        <div className="mx-auto w-full max-w-3xl">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
