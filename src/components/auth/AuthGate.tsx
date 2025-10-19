"use client";

import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import React from "react";
import { usePathname } from "next/navigation";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { loading } = useAuthContext();
  const pathname = usePathname();

  const isAuthRoute = /^\/(en|ar)\/(login|sign-up)(\b|\/|$)/.test(pathname ?? "");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex-1 h-full w-full min-h-0 animate-in fade-in-0 duration-300",
        "slide-in-from-bottom-2"
      )}
    >
      {children}
    </div>
  );
}
