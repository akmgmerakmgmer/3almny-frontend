"use client"
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { useChat } from "@/hooks/useChat"
import { Messages } from "@/components/chat/Messages"
import { Composer } from "@/components/chat/Composer"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { ChatFullAreaSkeleton, ChatMessagesSkeleton, ChatComposerSkeleton } from "@/components/chat/ChatSkeletons"
import { useAuthContext } from "@/contexts/AuthContext"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { getChat } from "@/services/chats"
import { useT } from '@/i18n/useT';
import { cn } from '@/lib/utils';
import { BookmarkCheck, X } from "lucide-react";

export default function ChatPage() {
  const params = useParams<{ lang: string }>()
  const lang = params?.lang || 'en'
  const search = useSearchParams();
  const router = useRouter();
  const chatQueryId = search?.get('chat') || undefined;
  // For now we do not preload history; we just pass chatId so new messages persist if existing id.
  // Later we can fetch existing messages and hydrate initialMessages.
  const [initialMessages, setInitialMessages] = useState<{ id: string; role: 'user' | 'assistant' | 'system'; content: string; meta?: Record<string, unknown> }[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [sidebarRefreshTick, setSidebarRefreshTick] = useState(0)
  const [localChatId, setLocalChatId] = useState<string | undefined>(chatQueryId)
  const hookKey = useMemo(() => localChatId || 'new', [localChatId])

  // Hydrate history when selecting existing chat
  useEffect(() => {
    if (!chatQueryId) {
      setLocalChatId(undefined)
      // IMPORTANT: use null (not empty array) so useChat does NOT overwrite freshly typed
      // first user message + streaming assistant reply when a brand‑new chat gets created.
      // Passing [] made the effect in useChat treat it as provided history and wipe messages
      // right after createChat() resolved, causing the first prompt & answer to disappear.
      setInitialMessages(null)
      return
    }
    let active = true
    setHistoryLoading(true)
    getChat(chatQueryId)
      .then(data => {
        if (!active) return
        const mapped = (data.messages || []).map((m: { id: string; role: 'user' | 'assistant' | 'system'; content: string; meta?: Record<string, unknown> }) => ({ id: m.id, role: m.role, content: m.content, meta: m.meta }))
        setInitialMessages(mapped)
        setLocalChatId(data.id)
      })
      .catch(() => { if (active) { setInitialMessages([]) } })
      .finally(() => active && setHistoryLoading(false))
    return () => { active = false }
  }, [chatQueryId])

  const [optimisticChats, setOptimisticChats] = useState<{ id: string; title: string }[]>([])
  const { messages, input, loading, streaming, bottomRef, setInput, sendPrompt, onKeyDown, unauthorized, error, stop, chatId, reset, articleEligible, toggleBookmark, bookmarkSavingIds, bookmarkToast, dismissBookmarkToast } = useChat({
    chatId: localChatId,
    initialMessages: initialMessages || undefined,
    persist: true,
    onChatCreated: (id, title) => {
      setLocalChatId(id)
      // Show immediately in sidebar without loading state
      setOptimisticChats(prev => [{ id, title }, ...prev.filter(c => c.id !== id)])
      // After some time, clean up optimistic entry (once real list is loaded)
      setTimeout(() => setOptimisticChats(prev => prev.filter(c => c.id !== id)), 3000)
    }
  })
  const { user, fullUser, loading: authLoading, error: authError, refresh, updatePreferences } = useAuthContext()
  const [triedRefresh, setTriedRefresh] = useState(false)
  const displayedMessages = messages
  const displayedEmptyLabel = undefined
  const displayedLoading = loading
  const scrollRef = bottomRef

  useEffect(() => {
    let active = true;
    if (!user) {
      (async () => {
        // Only the chat page triggers session check
        try { await refresh() } catch { }
        if (active) setTriedRefresh(true)
      })()
    } else {
      setTriedRefresh(false)
    }
    return () => { active = false }
  }, [])

  // Redirect immediately to login if an API call flags unauthorized
  useEffect(() => {
    if (unauthorized) {
      router.replace(`/${lang}/login`)
    }
  }, [unauthorized, router, lang])

  const showSkeleton = (authLoading || !triedRefresh) && !user
  const notAuthed = !authLoading && triedRefresh && !user

  // If after refresh attempt the user is still not authenticated, redirect immediately
  useEffect(() => {
    if (notAuthed) {
      router.replace(`/${lang}/login`)
    }
  }, [notAuthed, router, lang])
  const { t } = useT();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen(s => !s), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSidebar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeSidebar]);

  // Close sidebar when switching chats (for better mobile UX)
  useEffect(() => { closeSidebar(); }, [chatQueryId, closeSidebar]);

  // Handle education system selection
  const handleEducationSystemChange = useCallback(async (systemId: string | null) => {
    try {
      // Changing system invalidates grade and subject; clear both
      await updatePreferences({ educationSystem: systemId, grade: null, subject: null });
    } catch (error) {
      console.error('Failed to update education system:', error);
    }
  }, [updatePreferences]);

  const handleGradeChange = useCallback(async (gradeId: string | null) => {
    try {
      // Changing grade can change subject availability; clear it
      await updatePreferences({ grade: gradeId, subject: null });
    } catch (error) {
      console.error('Failed to update grade:', error);
    }
  }, [updatePreferences]);

  const handleSubjectChange = useCallback(async (subjectId: string | null) => {
    try {
      await updatePreferences({ subject: subjectId });
    } catch (error) {
      console.error('Failed to update subject:', error);
    }
  }, [updatePreferences]);

  // (Auto‑routing to newly created chat id after first assistant response removed per user request)

  return (
    <div className="flex h-[100dvh]">
      {/* Desktop sidebar */}
      {user && (
        <div className="hidden md:block">
          <ChatSidebar
            currentChatId={chatQueryId || chatId}
            refreshSignal={sidebarRefreshTick}
            onSelect={(id) => {
              const url = new URL(window.location.href)
              if (id) url.searchParams.set('chat', id); else url.searchParams.delete('chat')
              router.replace(url.pathname + url.search)
            }}
            onNew={() => {
              const url = new URL(window.location.href)
              url.searchParams.delete('chat')
              router.replace(url.pathname + url.search)
              setLocalChatId(undefined)
              setInitialMessages(null)
              setOptimisticChats([])
              reset()
            }}
            optimisticChats={optimisticChats}
          />
        </div>
      )}
      {!user && (
        <div className="w-64 md:w-72 border-r bg-background/50 hidden md:block" aria-hidden="true" />
      )}

      {/* Mobile overlay sidebar */}
      {user && (
        <>
          <div
            className={cn(
              'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden',
              sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
            onClick={closeSidebar}
            aria-hidden={!sidebarOpen}
          />
          <div
            className={cn(
              'fixed z-50 top-0 left-0 h-full w-72 translate-x-0 md:hidden transition-transform duration-300 will-change-transform',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}
            role="dialog"
            aria-modal="true"
            aria-label={t('chat.sidebar.title')}
          >
            <ChatSidebar
              currentChatId={chatQueryId || chatId}
              refreshSignal={sidebarRefreshTick}
              onSelect={(id) => {
                const url = new URL(window.location.href)
                if (id) url.searchParams.set('chat', id); else url.searchParams.delete('chat')
                router.replace(url.pathname + url.search)
                closeSidebar();
              }}
              onNew={() => {
                const url = new URL(window.location.href)
                url.searchParams.delete('chat')
                router.replace(url.pathname + url.search)
                setLocalChatId(undefined)
                setInitialMessages(null)
                setOptimisticChats([])
                reset()
                closeSidebar();
              }}
              optimisticChats={optimisticChats}
              variant="overlay"
            />
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col">
        {user && (
          <div className="px-2 pt-2 md:hidden flex items-center">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-background hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
              aria-controls="chat-mobile-sidebar"
            >
              <span className="relative block w-5 h-5">
                <span className={cn('absolute left-0 top-[4px] h-0.5 w-5 bg-current transition-transform', sidebarOpen && 'translate-y-2 rotate-45')} />
                <span className={cn('absolute left-0 top-[10px] h-0.5 w-5 bg-current transition-opacity', sidebarOpen && 'opacity-0')} />
                <span className={cn('absolute left-0 top-[16px] h-0.5 w-5 bg-current transition-transform', sidebarOpen && '-translate-y-2 -rotate-45')} />
              </span>
            </button>
          </div>
        )}
        {showSkeleton ? (
          <ChatFullAreaSkeleton />
        ) : (
          <>
            {error && <div className="mx-auto w-full max-w-3xl px-4 pt-2 text-xs text-red-600">{error}</div>}
            {historyLoading && messages.length === 0 ? (
              <>
                <ChatMessagesSkeleton />
                <ChatComposerSkeleton />
              </>
            ) : (
              <>
                <div className="mx-auto w-full max-w-3xl px-4 pt-2 pb-3" />
                {/* Pass only `loading` so the typing indicator disappears once the first assistant chunk starts streaming */}
                <Messages
                  messages={displayedMessages}
                  loading={displayedLoading}
                  bottomRef={scrollRef}
                  chatId={chatQueryId || chatId}
                  onToggleBookmark={toggleBookmark}
                  bookmarkSavingIds={bookmarkSavingIds}
                  emptyLabel={displayedEmptyLabel}
                />
                <Composer 
                  input={input} 
                  loading={loading} 
                  streaming={streaming} 
                  setInput={setInput} 
                  onKeyDown={onKeyDown} 
                  onSend={sendPrompt} 
                  onStop={stop} 
                  disabled={unauthorized || notAuthed}
                  selectedEducationSystem={fullUser?.educationSystem}
                  selectedGrade={fullUser?.grade}
                  selectedSubject={fullUser?.subject}
                  onEducationSystemChange={handleEducationSystemChange}
                  onGradeChange={handleGradeChange}
                  onSubjectChange={handleSubjectChange}
                />
              </>
            )}
          </>
        )}
      </div>
      {bookmarkToast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-lg">
            <BookmarkCheck className="h-4 w-4" />
            <span className="text-sm font-medium">{bookmarkToast}</span>
            <button
              type="button"
              onClick={dismissBookmarkToast}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/40 text-primary-foreground transition hover:bg-primary/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
