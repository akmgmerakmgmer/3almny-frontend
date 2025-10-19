"use client"

import React from "react";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type Props = {
  lang: string;
  children: React.ReactNode;
};

export default function PageWithSidebar({ lang, children }: Props) {
  const { user } = useAuthContext();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const showSidebar = Boolean(user);
  const closeSidebar = React.useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = React.useCallback(() => setSidebarOpen((v) => !v), []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeSidebar(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSidebar]);

  return (
    <div className="flex h-[100dvh] scrollbar-hide">
      {showSidebar && (
        <div className="hidden md:block">
          <ChatSidebar
            currentChatId={undefined}
            refreshSignal={0}
            onSelect={(id) => {
              if (!id) { router.push(`/${lang}/chat`); return; }
              router.push(`/${lang}/chat?chat=${id}`);
            }}
            onNew={() => { router.push(`/${lang}/chat`); }}
            optimisticChats={[]}
          />
        </div>
      )}

      {showSidebar && (
        <>
          <div
            className={cn(
              "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden",
              sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            onClick={closeSidebar}
            aria-hidden={!sidebarOpen}
          />
          <div
            className={cn(
              "fixed z-50 top-0 left-0 h-full w-72 translate-x-0 md:hidden transition-transform duration-300 will-change-transform",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Sidebar"
          >
            <ChatSidebar
              currentChatId={undefined}
              refreshSignal={0}
              onSelect={(id) => {
                if (!id) { router.push(`/${lang}/chat`); }
                else { router.push(`/${lang}/chat?chat=${id}`); }
                closeSidebar();
              }}
              onNew={() => { router.push(`/${lang}/chat`); closeSidebar(); }}
              optimisticChats={[]}
              variant="overlay"
            />
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {showSidebar && (
          <div className="px-2 pt-2 md:hidden flex items-center">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-background hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
            >
              <span className="relative block w-5 h-5">
                <span className={cn("absolute left-0 top-[4px] h-0.5 w-5 bg-current transition-transform", sidebarOpen && "translate-y-2 rotate-45")} />
                <span className={cn("absolute left-0 top-[10px] h-0.5 w-5 bg-current transition-opacity", sidebarOpen && "opacity-0")} />
                <span className={cn("absolute left-0 top-[16px] h-0.5 w-5 bg-current transition-transform", sidebarOpen && "-translate-y-2 -rotate-45")} />
              </span>
            </button>
          </div>
        )}
          <main className="flex-1 overflow-y-auto scrollbar-hide">{children}</main>
      </div>
    </div>
  );
}


