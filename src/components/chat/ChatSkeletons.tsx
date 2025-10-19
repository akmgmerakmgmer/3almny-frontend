"use client";
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ChatSidebarSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="py-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="px-3 py-2">
          <Skeleton className="h-[18px] w-full" />
        </li>
      ))}
    </ul>
  );
}

export function ChatMessagesSkeleton({ messages = 4 }: { messages?: number }) {
  // Alternate left/right alignment to mimic conversation
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 space-y-8 animate-pulse">
      {Array.from({ length: messages }).map((_, i) => {
        const isUser = i % 2 === 1;
        return (
          <div key={i} className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && <Skeleton className="h-8 w-8 rounded-full" />}
            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%] flex-1`}>
              <Skeleton className={`h-4 ${isUser ? 'w-20' : 'w-24'} mb-2`} />
              <div className="space-y-2 w-full">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                {i % 3 === 0 && <Skeleton className="h-3 w-2/3" />}
              </div>
            </div>
            {isUser && <Skeleton className="h-8 w-8 rounded-full" />}
          </div>
        );
      })}
    </div>
  );
}

export function ChatComposerSkeleton() {
  return (
    <div className="border-t p-4 animate-pulse">
      <div className="mx-auto w-full max-w-3xl">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

// Combined loading block for full chat area (messages + composer)
export function ChatFullAreaSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <ChatMessagesSkeleton />
      <ChatComposerSkeleton />
    </div>
  );
}
