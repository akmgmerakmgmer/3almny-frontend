"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { chatPromptStream } from "@/services/api"
import { addMessage, createChat } from "@/services/chats"
import { useChatCache } from "@/contexts/ChatCacheContext"
import { getBookmarks, createBookmark, deleteBookmark, type Bookmark } from "@/services/bookmarks"

export type ChatMessage = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  meta?: Record<string, any>
  bookmarked?: boolean
  bookmarkId?: string
  chatId?: string | null
  savedAt?: string
}

interface UseChatOptions {
  chatId?: string;
  initialMessages?: ChatMessage[];
  onChatCreated?: (id: string, title: string) => void;
  persist?: boolean; // default true
}

export function useChat(options: UseChatOptions = {}) {
  const { chatId: controlledChatId, initialMessages, onChatCreated, persist = true } = options;
  const [chatId, setChatId] = useState<string | undefined>(controlledChatId);
  // initialMessages may already contain meta (e.g., articleEligible) loaded from history
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || [])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [articleEligible, setArticleEligible] = useState<boolean | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const bookmarksRef = useRef<Bookmark[]>([])
  const [bookmarkSavingIds, setBookmarkSavingIds] = useState<string[]>([])
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { upsertChat, refresh } = useChatCache()
  const pendingInitialSyncRef = useRef(false)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages])

  useEffect(() => {
    bookmarksRef.current = bookmarks
    const entryMap = new Map(bookmarks.map(b => [b.messageId, b]))
    setMessages(prev => {
      let changed = false
      const next = prev.map(m => {
        const entry = entryMap.get(m.id)
        if (entry) {
          if (!m.bookmarked || m.bookmarkId !== entry.id || m.savedAt !== entry.savedAt || m.chatId !== (entry.chatId ?? m.chatId)) {
            changed = true
            return {
              ...m,
              bookmarked: true,
              bookmarkId: entry.id,
              savedAt: entry.savedAt,
              chatId: entry.chatId ?? m.chatId ?? null,
            }
          }
          return m
        }
        if (m.bookmarked || m.bookmarkId || m.savedAt) {
          changed = true
          return {
            ...m,
            bookmarked: false,
            bookmarkId: undefined,
            savedAt: undefined,
          }
        }
        return m
      })
      return changed ? next : prev
    })
  }, [bookmarks])

  // Sync external changes to chatId / initialMessages
  useEffect(() => {
    setChatId(controlledChatId)
  }, [controlledChatId])

  useEffect(() => {
    // Only hydrate when an actual history array is supplied (length >= 0) AND it's not the same ref
    // Accept empty array as valid history for existing chat, but ignore null/undefined to avoid wiping in-progress messages
    if (Array.isArray(initialMessages)) {
      setMessages(prev => (prev === initialMessages ? prev : initialMessages))
      return
    }
    // For brand new chats (no controlled id yet) we keep whatever user typed
    if (!controlledChatId && initialMessages == null) {
      // Do not force reset here; creation flow handles clearing explicitly when user clicks "New Chat"
      return
    }
  }, [initialMessages, controlledChatId])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await getBookmarks({ limit: 200 })
        if (!active) return
        setBookmarks(res.bookmarks)
      } catch (err: any) {
        if (err?.message === 'UNAUTHORIZED') {
          setUnauthorized(true)
        } else {
          console.warn('Failed to load bookmarks', err)
        }
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  const showBookmarkToast = useCallback((message: string) => {
    setBookmarkToast(message)
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = setTimeout(() => setBookmarkToast(null), 3000)
  }, [])

  const dismissBookmarkToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
    setBookmarkToast(null)
  }, [])

  const sendPrompt = useCallback(async () => {
    const prompt = input.trim()
    if (!prompt) return
    if (loading || streaming) return
    setLoading(true)
    setError(null)
    // New user input invalidates previous eligibility until new assistant response completes
    setArticleEligible(null)

    // Append user message locally
    const newUser: ChatMessage = { id: crypto.randomUUID(), role: "user", content: prompt, chatId: chatId ?? controlledChatId ?? null }
    setMessages((prev) => [...prev, newUser])
    setInput("")

    try {
      // Ensure chat exists if persisting and no id yet
      let activeChatId = chatId
      if (!activeChatId && persist) {
        try {
          const cleanedTitle = 'New Chat'
          const created = await createChat(cleanedTitle)
          activeChatId = created.id
          pendingInitialSyncRef.current = true
          setChatId(created.id)
          upsertChat({ id: created.id, title: created.title, createdAt: created.createdAt, updatedAt: created.updatedAt })
          onChatCreated?.(created.id, cleanedTitle)
        } catch (e) {
          // Fallback: continue without persistence
          console.warn('Failed to create chat, continuing ephemeral', e)
        }
      }
      // Persist user message if chat exists
      if (persist && activeChatId) {
        addMessage(activeChatId, { type: 'text', content: prompt, role: 'user' })
          .then(saved => {
            upsertChat({ id: activeChatId!, updatedAt: saved.createdAt })
            if (pendingInitialSyncRef.current) {
              pendingInitialSyncRef.current = false
              refresh().catch(() => undefined)
            }
          })
          .catch(err => console.warn('Persist user message failed', err))
      }
      // Placeholder assistant to stream into
      const replyId = crypto.randomUUID()
    setMessages((prev) => [...prev, { id: replyId, role: "assistant", content: "", chatId: activeChatId ?? chatId ?? controlledChatId ?? null }])
      let gotFirstChunk = false
      try {
        abortRef.current = new AbortController()
        setStreaming(true)
        // Build lightweight history context (exclude the just-added user message and streaming placeholder)
        const prior = messagesRef.current
          .filter(m => m.id !== replyId) // exclude placeholder
          .slice(-12) // last 12 exchanges/messages
          .map(m => ({ role: m.role, content: compressContent(m.content) }));
        for await (const chunk of chatPromptStream({ prompt, history: prior }, abortRef.current.signal)) {
          if (!gotFirstChunk && chunk) {
            setLoading(false)
            gotFirstChunk = true
          }
          setMessages((prev) => {
            const next = [...prev]
            const idx = next.findIndex((m) => m.id === replyId)
            if (idx !== -1) {
              next[idx] = { ...next[idx], content: next[idx].content + chunk }
            }
            return next
          })
        }
        // Persist assistant message final content
        const finalAssistant = messagesRef.current?.find(m => m.id === replyId)
        if (persist && activeChatId && finalAssistant) {
          addMessage(activeChatId, { type: 'text', content: finalAssistant.content, role: 'assistant' })
            .then(saved => {
              // Replace the temporary UUID id with the persisted backend ObjectId so messageId param works for PDF
              setMessages(prev => prev.map(m => m.id === replyId ? { ...m, id: (saved as any).id, meta: (saved as any).meta, chatId: activeChatId ?? m.chatId ?? null } : m))
              const eligible = (saved as any)?.meta?.articleEligible;
              setArticleEligible(typeof eligible === 'boolean' ? eligible : null);
              upsertChat({ id: activeChatId!, updatedAt: saved.createdAt })
            })
            .catch(err => console.warn('Persist assistant message failed', err))
        }
      } catch (e) {
        if (e instanceof Error && e.message === 'UNAUTHORIZED') {
          setUnauthorized(true)
          setMessages((prev) => prev.filter(m => m.id !== replyId))
        } else if (e instanceof DOMException && e.name === 'AbortError') {
          // Remove empty assistant placeholder on abort
          setMessages((prev) => prev.filter(m => !(m.id === replyId && !m.content.trim())))
        } else {
          const msg = 'Something went wrong. Please try again.'
            setError(msg)
            const reply: ChatMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: msg,
              chatId: activeChatId ?? chatId ?? controlledChatId ?? null,
            }
            setMessages((prev) => [...prev, reply])
        }
      }
    } catch {
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
        chatId: chatId ?? controlledChatId ?? null,
      }
      setMessages((prev) => [...prev, reply])
    } finally {
      // In case stream ended without any chunks
      setLoading(false)
      setStreaming(false)
      abortRef.current = null
    }
  }, [input, loading, streaming, chatId, persist, onChatCreated])

// Simple content compressor: trims, collapses whitespace, shortens very long messages
function compressContent(text: string): string {
  if (!text) return '';
  let t = text.replace(/\s+/g, ' ').trim();
  if (t.length > 800) {
    t = t.slice(0, 650) + '... ' + t.slice(-120); // keep start & tail context
  }
  return t;
}

  // Keep a ref of messages for persistence after stream
  const messagesRef = useRef<ChatMessage[]>(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])

  // Derive eligibility from latest assistant message if not explicitly set
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && m.content.trim());
    if (lastAssistant && lastAssistant.meta && typeof lastAssistant.meta.articleEligible === 'boolean') {
      setArticleEligible(lastAssistant.meta.articleEligible);
    }
  }, [messages])

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendPrompt()
    }
  }

  const toggleBookmark = useCallback(async (messageId: string) => {
    const target = messagesRef.current.find(m => m.id === messageId)
    if (!target) return
    const existing = bookmarksRef.current.find(b => b.messageId === messageId)
    try {
      if (existing) {
        await deleteBookmark(existing.id)
        setBookmarks(prev => prev.filter(b => b.id !== existing.id))
      } else {
        const payload = {
          chatId: chatId ?? controlledChatId ?? null,
          messageId,
          role: target.role,
          content: target.content,
          meta: target.meta ?? {},
        }
        setBookmarkSavingIds(prev => (prev.includes(messageId) ? prev : [...prev, messageId]))
        const bookmark = await createBookmark(payload)
        setBookmarks(prev => [bookmark, ...prev.filter(b => b.id !== bookmark.id)])
        showBookmarkToast('Saved to bookmarks')
      }
    } catch (err: any) {
      if (err?.message === 'UNAUTHORIZED') {
        setUnauthorized(true)
      } else {
        console.warn('Bookmark toggle failed', err)
      }
    } finally {
      setBookmarkSavingIds(prev => prev.filter(id => id !== messageId))
    }
  }, [chatId, controlledChatId])

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
  }, [])

  return {
    chatId,
    messages,
    input,
    loading,
    streaming,
    unauthorized,
    error,
    articleEligible,
    bottomRef,
    setInput,
    sendPrompt,
    onKeyDown,
    stop,
    bookmarks,
    bookmarkSavingIds,
    bookmarkToast,
    dismissBookmarkToast,
    toggleBookmark,
    reset: () => {
      // Clear current chat context to start a fresh one
      setChatId(undefined)
      setMessages([])
      setInput("")
      setError(null)
    }
  }
}
