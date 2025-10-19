"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { listChats, type ChatListItem } from "@/services/chats";
import { useAuthContext } from "@/contexts/AuthContext";

type ChatPatch = Partial<ChatListItem> & { id: string };

interface ChatCacheContextValue {
  chats: ChatListItem[];
  total: number;
  offset: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  isLoaded: boolean;
  ensureLoaded: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  upsertChat: (chat: ChatPatch) => void;
  clear: () => void;
}

const ChatCacheContext = createContext<ChatCacheContextValue | undefined>(undefined);

const PAGE_SIZE = 20;

export function ChatCacheProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const initialFetchRef = useRef<Promise<void> | null>(null);

  const resetState = useCallback(() => {
    setChats([]);
    setTotal(0);
    setOffset(0);
    setLoading(false);
    setLoadingMore(false);
    setError(null);
    setIsLoaded(false);
    initialFetchRef.current = null;
  }, []);

  const lastUserIdRef = useRef<string | null>(null);

  const hydrate = useCallback(async (targetUserId: string) => {
    const res = await listChats({ limit: PAGE_SIZE, offset: 0 });
    if (lastUserIdRef.current !== targetUserId) return;
    setChats(res.data);
    setTotal(res.total);
    setOffset(res.data.length);
    setError(null);
    setIsLoaded(true);
  }, []);

  const ensureLoaded = useCallback(async () => {
    if (!user) return;
    if (isLoaded) return;
    if (initialFetchRef.current) {
      await initialFetchRef.current;
      return;
    }
    const targetUserId = user.id;
    lastUserIdRef.current = targetUserId;
    const task = (async () => {
      setLoading(true);
      try {
        await hydrate(targetUserId);
      } catch (err: any) {
        setError(err?.message || "Failed to load chats");
      } finally {
        setLoading(false);
        initialFetchRef.current = null;
      }
    })();
    initialFetchRef.current = task;
    await task;
  }, [hydrate, isLoaded, user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    lastUserIdRef.current = user.id;
    setLoading(true);
    try {
      await hydrate(user.id);
    } catch (err: any) {
      setError(err?.message || "Failed to refresh chats");
    } finally {
      setLoading(false);
    }
  }, [hydrate, user]);

  const loadMore = useCallback(async () => {
    if (!user) return;
    if (loadingMore) return;
    if (offset >= total) return;
    setLoadingMore(true);
    try {
      const targetUserId = user.id;
      lastUserIdRef.current = targetUserId;
      const res = await listChats({ limit: PAGE_SIZE, offset });
      if (lastUserIdRef.current !== targetUserId) {
        return;
      }
      setChats(prev => {
        const seen = new Set(prev.map(item => item.id));
        const merged = [...prev];
        res.data.forEach(item => {
          if (!seen.has(item.id)) merged.push(item);
        });
        return merged;
      });
      setOffset(prev => prev + res.data.length);
      setTotal(res.total);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load more chats");
    } finally {
      setLoadingMore(false);
    }
  }, [user, loadingMore, offset, total]);

  const upsertChat = useCallback((chat: ChatPatch) => {
    const activeUserId = lastUserIdRef.current ?? user?.id ?? null;
    if (!activeUserId) return;
    lastUserIdRef.current = activeUserId;
    setChats(prev => {
      const existingIndex = prev.findIndex(item => item.id === chat.id);

      const applyPatch = (base: ChatListItem): ChatListItem => {
        const next = { ...base } as ChatListItem;
        if ("title" in chat && chat.title !== undefined) {
          next.title = chat.title;
        }
        if ("updatedAt" in chat && chat.updatedAt !== undefined) {
          next.updatedAt = chat.updatedAt;
        }
        if ("createdAt" in chat && chat.createdAt !== undefined) {
          next.createdAt = chat.createdAt;
        }
        return next;
      };

      if (existingIndex === -1) {
        const title = chat.title ?? "New chat";
        const timestamp = chat.updatedAt ?? chat.createdAt ?? new Date().toISOString();
        const createdAt = chat.createdAt ?? timestamp;
        const updatedAt = chat.updatedAt ?? createdAt;
        const newItem: ChatListItem = applyPatch({ id: chat.id, title, createdAt, updatedAt });
        setTotal(prevTotal => prevTotal + 1);
        setOffset(prevOffset => prevOffset + 1);
        return [newItem, ...prev];
      }

      const existing = prev[existingIndex];
      const updatedItem = applyPatch(existing);
      const remainder = prev.filter((_, idx) => idx !== existingIndex);
      return [updatedItem, ...remainder];
    });
  }, [user?.id]);

  const value = useMemo<ChatCacheContextValue>(() => ({
    chats,
    total,
    offset,
    loading,
    loadingMore,
    error,
    isLoaded,
    ensureLoaded,
    refresh,
    loadMore,
    upsertChat,
    clear: resetState,
  }), [chats, total, offset, loading, loadingMore, error, isLoaded, ensureLoaded, refresh, loadMore, upsertChat, resetState]);

  useEffect(() => {
    if (!user) {
      lastUserIdRef.current = null;
      resetState();
      return;
    }

    if (lastUserIdRef.current && lastUserIdRef.current !== user.id) {
      resetState();
    }

    lastUserIdRef.current = user.id;

    if (!isLoaded) {
      ensureLoaded();
    }
  }, [user, isLoaded, ensureLoaded, resetState]);

  return (
    <ChatCacheContext.Provider value={value}>{children}</ChatCacheContext.Provider>
  );
}

export function useChatCache() {
  const ctx = useContext(ChatCacheContext);
  if (!ctx) {
    throw new Error("useChatCache must be used within <ChatCacheProvider>");
  }
  return ctx;
}
