"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { searchChatMessages, ChatMessageSearchResult } from '@/services/chats';
import { cn } from '@/lib/utils';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatSidebarSkeleton } from './ChatSkeletons';
import { useT } from '@/i18n/useT';
import LanguageSwitcher from '@/components/language-switcher';
import { onChatCreated, onChatUpdated } from '@/services/chat-events';
import { useAuthContext } from '@/contexts/AuthContext';
import { useChatCache } from '@/contexts/ChatCacheContext';
import {
  LogOut,
  MessageSquare,
  Sparkles,
  ChevronsDown,
  PenSquare,
  Search,
  Bookmark,
  BookOpen,
  FolderKanban,
  Compass,
  PenLine,
  Clock,
  XCircle,
} from 'lucide-react';

export function ChatSidebar({
  currentChatId,
  onSelect,
  refreshSignal,
  onNew,
  optimisticChats,
  variant = 'default',
}: {
  currentChatId?: string;
  onSelect: (id: string | undefined) => void;
  refreshSignal?: number;
  onNew?: () => void;
  optimisticChats?: { id: string; title: string }[];
  variant?: 'default' | 'overlay';
}) {
  const PAGE_SIZE = 20;
  const {
    chats,
    total,
    offset,
    loadingMore: chatLoadingMore,
    error: chatError,
    isLoaded,
    ensureLoaded,
    refresh,
    loadMore,
    upsertChat,
  } = useChatCache();
  const SEARCH_DEBOUNCE_MS = 300;
  const SEARCH_THROTTLE_MS = 600;
  const initialLoading = !isLoaded && !chatError;
  const error = chatError;
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessageSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);
  const [searchPaginating, setSearchPaginating] = useState(false);
  const [searchResolved, setSearchResolved] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchThrottleRef = useRef(0);
  const searchThrottleTimeoutRef = useRef<number | null>(null);
  const searchActiveQueryRef = useRef('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const refreshReadyRef = useRef(false);
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useT();
  const { logout } = useAuthContext();

  // Removed polling to avoid repeated API calls.

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  useEffect(() => {
    if (refreshSignal === undefined) return;
    if (!refreshReadyRef.current) {
      refreshReadyRef.current = true;
      return;
    }
    refresh().catch(() => undefined);
  }, [refreshSignal, refresh]);

  useEffect(() => {
    const unsub = onChatCreated((payload) => {
      upsertChat({
        id: payload.id,
        title: payload.title,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
      });
    });
    return () => { unsub(); };
  }, [upsertChat]);

  useEffect(() => {
    const unsub = onChatUpdated((payload) => {
      upsertChat({
        id: payload.id,
        title: payload.title,
        updatedAt: payload.updatedAt,
        createdAt: payload.createdAt,
      });
    });
    return () => { unsub(); };
  }, [upsertChat]);

  useEffect(() => {
    if (searchOpen) {
      const id = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    setSearchTerm('');
    setDebouncedQuery('');
    setSearchResults([]);
    setSearchError(null);
    setSearchHasMore(false);
    setSearchOffset(0);
    setSearchPaginating(false);
    setSearchLoading(false);
    setSearchResolved(false);
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }
    if (searchThrottleTimeoutRef.current) {
      window.clearTimeout(searchThrottleTimeoutRef.current);
      searchThrottleTimeoutRef.current = null;
    }
    searchThrottleRef.current = 0;
    searchActiveQueryRef.current = '';
    return undefined;
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchTerm.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchTerm, searchOpen, SEARCH_DEBOUNCE_MS]);

  const executeSearch = useCallback((query: string, options?: { offset?: number; append?: boolean }) => {
    const append = options?.append ?? false;
    const offsetValue = options?.offset ?? 0;

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }

    const controller = new AbortController();
    searchAbortRef.current = controller;
    searchActiveQueryRef.current = query;

    if (!append) {
      setSearchLoading(true);
      setSearchError(null);
      setSearchPaginating(false);
      setSearchResolved(false);
    } else {
      setSearchPaginating(true);
    }

    searchChatMessages({ query, limit: PAGE_SIZE, offset: offsetValue, signal: controller.signal })
      .then(res => {
        if (controller.signal.aborted) return;
        if (!append) {
          setSearchResults(res.results);
        } else {
          setSearchResults(prev => [...prev, ...res.results]);
        }
        setSearchHasMore(res.hasMore);
        setSearchOffset(res.offset + res.results.length);
        setSearchError(null);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        if (!append) {
          setSearchResults([]);
          setSearchHasMore(false);
          setSearchOffset(0);
        }
        setSearchError(err.message || 'Failed to search chats');
      })
      .finally(() => {
        const wasCurrent = controller === searchAbortRef.current;
        if (wasCurrent) {
          searchAbortRef.current = null;
        }
        if (controller.signal.aborted && !wasCurrent) {
          // Another request superseded this one; leave current loading state as-is.
          return;
        }
        if (!append) {
          setSearchLoading(false);
          setSearchResolved(!controller.signal.aborted);
        } else {
          setSearchPaginating(false);
          setSearchResolved(!controller.signal.aborted);
        }
      });
  }, [PAGE_SIZE]);

  useEffect(() => {
    if (!searchOpen) return;

    if (searchThrottleTimeoutRef.current) {
      window.clearTimeout(searchThrottleTimeoutRef.current);
      searchThrottleTimeoutRef.current = null;
    }

    if (!debouncedQuery) {
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
        searchAbortRef.current = null;
      }
      setSearchResults([]);
      setSearchError(null);
      setSearchHasMore(false);
      setSearchOffset(0);
      setSearchLoading(false);
      setSearchPaginating(false);
      setSearchResolved(false);
      searchActiveQueryRef.current = '';
      searchThrottleRef.current = 0;
      return;
    }

    const now = Date.now();
    const elapsed = now - searchThrottleRef.current;
    const remaining = Math.max(0, SEARCH_THROTTLE_MS - elapsed);

    setSearchLoading(true);

    const trigger = () => {
      searchThrottleTimeoutRef.current = null;
      searchThrottleRef.current = Date.now();
      executeSearch(debouncedQuery, { offset: 0, append: false });
    };

    if (remaining > 0) {
      searchThrottleTimeoutRef.current = window.setTimeout(trigger, remaining);
      return () => {
        if (searchThrottleTimeoutRef.current) {
          window.clearTimeout(searchThrottleTimeoutRef.current);
          searchThrottleTimeoutRef.current = null;
        }
      };
    }

    trigger();

    return () => {
      if (searchThrottleTimeoutRef.current) {
        window.clearTimeout(searchThrottleTimeoutRef.current);
        searchThrottleTimeoutRef.current = null;
      }
    };
  }, [debouncedQuery, searchOpen, executeSearch, SEARCH_THROTTLE_MS]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => () => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }
    if (searchThrottleTimeoutRef.current) {
      window.clearTimeout(searchThrottleTimeoutRef.current);
      searchThrottleTimeoutRef.current = null;
    }
  }, []);

  const handleLoadMore = () => {
    if (chatLoadingMore) return;
    if (offset >= total) return;
    void loadMore();
  };

  // Removed infinite scroll logic

  const handleSelect = (id: string) => {
    onSelect(id);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const isChatRoute = /^\/(en|ar)\/chat(\/|$)/.test(url.pathname);
    if (!isChatRoute) return;
    url.searchParams.set('chat', id);
    router.replace(url.pathname + url.search);
  };

  const handleNew = () => {
    // Clear selection to start ephemeral new chat; actual chat will be created on first message
    onSelect(undefined);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const isChatRoute = /^\/(en|ar)\/chat(\/|$)/.test(url.pathname);
    if (!isChatRoute) return;
    url.searchParams.delete('chat');
    router.replace(url.pathname + url.search);
    onNew?.();
  };

  // Use responsive width: keep original mobile overlay width smaller; expand only on md+
  // Keep desktop 72, mobile overlay container now 72 so align widths
  const baseClasses = 'flex h-full w-72 md:w-72 flex-col';
  const variantClasses = variant === 'overlay'
    ? 'bg-white dark:bg-neutral-900 shadow-xl rounded-r-xl border border-neutral-200/70 dark:border-neutral-700 overflow-hidden'
    : 'border-r bg-background/50';

  const optimisticFiltered = useMemo(() => optimisticChats || [], [optimisticChats]);

  const titleHasArabic = useCallback((title: string) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(title), []);

  const optimisticIds = new Set((optimisticChats || []).map(item => item.id));

  const filteredChats = useMemo(
    () => chats.filter(c => !optimisticIds.has(c.id)),
    [chats, optimisticIds]
  );

  const showSearchResults = searchOpen && debouncedQuery.length > 0;

  const searchSnippet = (content?: string) => {
    if (!content) return '';
    const flattened = content.replace(/\s+/g, ' ').trim();
    if (flattened.length <= 160) return flattened;
    return `${flattened.slice(0, 157)}...`;
  };

  const handleSearchLoadMore = () => {
    if (!showSearchResults) return;
    if (!searchHasMore || searchPaginating) return;
    const query = searchActiveQueryRef.current || debouncedQuery;
    if (!query) return;
    executeSearch(query, { offset: searchOffset, append: true });
  };

  const primaryActions = [
    {
      key: 'new',
      label: t('chat.new'),
      icon: PenSquare,
      onClick: () => {
        setSearchOpen(false);
        handleNew();
      },
      shortcut: null as string | null,
      disabled: false,
    },
    {
      key: 'search',
      label: 'Search chats',
      icon: Search,
      onClick: () => {
        setSearchOpen(prev => !prev);
        if (searchOpen) {
          setSearchTerm('');
        }
      },
      shortcut: 'Ctrl + K',
      disabled: false,
    },
    {
      key: 'courses',
      label: 'Courses',
      icon: Compass,
      onClick: () => {
        setSearchOpen(false);
        setSearchTerm('');
        router.push(`/${lang}/courses`);
      },
      shortcut: null,
      disabled: false,
    },
    {
      key: 'records',
      label: 'Study Records',
      icon: Clock,
      onClick: () => {
        setSearchOpen(false);
        setSearchTerm('');
        router.push(`/${lang}/records`);
      },
      shortcut: null,
      disabled: false,
    },
    {
      key: 'bookmarks',
      label: 'Bookmarks',
      icon: Bookmark,
      onClick: () => {
        setSearchOpen(false);
        setSearchTerm('');
        router.push(`/${lang}/bookmarks`);
      },
      shortcut: null,
      disabled: false,
    },
    {
      key: 'library',
      label: 'Library',
      icon: BookOpen,
      onClick: () => {
        // Placeholder for upcoming feature
      },
      shortcut: null,
      disabled: true,
    },
    {
      key: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      onClick: () => {
        // Placeholder for upcoming feature
      },
      shortcut: null,
      disabled: true,
    },
  ];


  return (
    <div className={cn(baseClasses, variantClasses)}>
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-sm">
            AI
          </div>
          <div className="leading-tight">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">AI Education</p>
            <p className="text-base font-semibold">Assistant</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-3 py-3 space-y-5">
          <nav className="space-y-1">
            {primaryActions.map((action) => {
              const Icon = action.icon;
              const isActive = (() => {
                if (!pathname) return false;
                if (action.key === 'new') {
                  return pathname.includes('/chat') && !pathname.includes('/bookmarks') && !pathname.includes('/records');
                }
                if (action.key === 'bookmarks') {
                  return pathname.includes('/bookmarks');
                }
                if (action.key === 'records') {
                  return pathname.includes('/records');
                }
                if (action.key === 'courses') {
                  return pathname.includes('/courses');
                }
                return false;
              })();
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => {
                    if (action.disabled) return;
                    action.onClick?.();
                  }}
                  disabled={action.disabled}
                  className={cn(
                    'group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                      : 'bg-transparent text-foreground hover:bg-muted/70',
                    action.disabled && 'cursor-not-allowed opacity-60 hover:bg-transparent'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="relative flex items-center justify-center">
                      <Icon className={cn('h-4 w-4', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                      {action.key === 'records' && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-2.5 w-2.5 items-center justify-center">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500/30 animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                        </span>
                      )}
                    </span>
                    <span className="font-medium">{action.label}</span>
                  </span>
                  {action.shortcut && (
                    <span className="rounded border border-border/40 px-1.5 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground">
                      {action.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          {searchOpen && (
            <div className="group relative rounded-2xl border border-border/60 bg-background/95 p-3 shadow-sm ring-1 ring-transparent transition hover:border-primary/30 hover:shadow-md focus-within:border-primary/40 focus-within:ring-primary/20">
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="flex items-center gap-3 rounded-xl bg-background/80 px-3 py-2 ring-1 ring-inset ring-border/60 transition focus-within:ring-2 focus-within:ring-primary/40 group-hover:ring-primary/30">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                <Input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search chats by title or message"
                  className="h-8 flex-1 border-none bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setDebouncedQuery('');
                      setSearchResults([]);
                      setSearchError(null);
                      setSearchHasMore(false);
                      setSearchOffset(0);
                      setSearchResolved(false);
                      setSearchPaginating(false);
                      if (searchAbortRef.current) {
                        searchAbortRef.current.abort();
                        searchAbortRef.current = null;
                      }
                      searchInputRef.current?.focus();
                    }}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary/40"
                    aria-label="Clear search"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-2 px-1 text-[11px] font-medium text-muted-foreground/75">
                Tip: Combine subject names and keywords to get precise matches.
              </p>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <div className="sticky top-0 z-10 bg-gradient-to-b from-background via-background/95 to-transparent px-1 pb-2 pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">Chats</p>
          </div>
          {error && <div className="px-3 py-2 text-xs text-red-600">{error}</div>}
          {initialLoading ? (
            <div className="px-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <ChatSidebarSkeleton rows={8} />
            </div>
          ) : (
            <>
              {showSearchResults ? (
                <>
                  {optimisticFiltered.length > 0 && (
                    <ul className="space-y-1 text-[15px] leading-snug animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                      {optimisticFiltered.map((oc) => (
                        <li
                          key={`optimistic-${oc.id}`}
                          data-animate
                          className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
                        >
                          <button
                            onClick={() => {
                              handleSelect(oc.id);
                              setSearchOpen(false);
                            }}
                            className={cn(
                              'w-full truncate rounded-lg px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                              'bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20',
                              oc.id === currentChatId && 'bg-primary/15'
                            )}
                            title={oc.title}
                          >
                            <span className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                              <span
                                className="block truncate font-medium"
                                style={titleHasArabic(oc.title) ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.85rem' } : undefined}
                              >
                                {oc.title}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {searchError && (
                    <div className="px-3 py-2 text-xs text-red-600">{searchError}</div>
                  )}
                  {searchLoading && (
                    <div className="px-1 py-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                      <ChatSidebarSkeleton rows={8} />
                    </div>
                  )}
                  {!searchLoading && searchResolved && !searchResults.length && !optimisticFiltered.length && !searchError && (
                    <div className="px-3 py-8 text-sm text-muted-foreground">No chats or messages found.</div>
                  )}
                  {searchResults.length > 0 && (
                    <ul className="space-y-1 text-[15px] leading-snug animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                      {searchResults.map((item) => (
                        <li
                          key={`${item.chatId}-${item.messageId}`}
                          data-animate
                          className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
                        >
                          <button
                            onClick={() => {
                              handleSelect(item.chatId);
                              setSearchOpen(false);
                            }}
                            className={cn(
                              'w-full rounded-lg px-3 py-2 text-left transition hover:bg-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                              item.chatId === currentChatId && 'bg-muted'
                            )}
                            title={item.chatTitle}
                          >
                            <span className="flex flex-col gap-1">
                              <span className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                                <span
                                  className="block truncate font-medium"
                                  style={item.chatTitle && titleHasArabic(item.chatTitle) ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.85rem' } : undefined}
                                >
                                  {item.chatTitle}
                                </span>
                              </span>
                              {item.messageContent && (
                                <span className="text-xs text-muted-foreground line-clamp-2">
                                  {searchSnippet(item.messageContent)}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {searchHasMore && (
                    <div className="px-1 pt-3">
                      <Button
                        variant="outline"
                        className="w-full text-sm"
                        disabled={searchPaginating}
                        onClick={handleSearchLoadMore}
                      >
                        <span className="inline-flex items-center gap-2">
                          <ChevronsDown className="h-4 w-4" />
                          {searchPaginating ? 'Loading more...' : 'Load more results'}
                        </span>
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {(isLoaded && !optimisticFiltered.length && !filteredChats.length) && (
                    <div className="px-3 py-8 text-sm text-muted-foreground">
                      {t('chat.sidebar.empty')}
                    </div>
                  )}
                  <ul className="space-y-1 text-[15px] leading-snug animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    {optimisticFiltered.map((oc) => (
                      <li
                        key={oc.id}
                        data-animate
                        className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
                      >
                        <button
                          onClick={() => handleSelect(oc.id)}
                          className={cn(
                            'w-full truncate rounded-lg px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                            'bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20',
                            oc.id === currentChatId && 'bg-primary/15'
                          )}
                          title={oc.title}
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                            <span
                              className="block truncate font-medium"
                              style={titleHasArabic(oc.title) ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.85rem' } : undefined}
                            >
                              {oc.title}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                    {filteredChats.map((c) => (
                      <li
                        key={c.id}
                        data-animate
                        className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
                      >
                        <button
                          onClick={() => handleSelect(c.id)}
                          className={cn(
                            'w-full truncate rounded-lg px-3 py-2 text-left transition hover:bg-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                            variant === 'overlay' && 'hover:bg-white/20 dark:hover:bg-neutral-700/55',
                            c.id === currentChatId && 'bg-muted'
                          )}
                          title={c.title}
                        >
                          <span className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                            <span
                              className="block truncate"
                              style={titleHasArabic(c.title) ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.85rem' } : undefined}
                            >
                              {c.title}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {offset < total && (
                    <div className="px-1 pt-3">
                      <Button
                        variant="outline"
                        className="w-full text-sm"
                        disabled={chatLoadingMore}
                        onClick={handleLoadMore}
                      >
                        <span className="inline-flex items-center gap-2">
                          <ChevronsDown className="h-4 w-4" />
                          {chatLoadingMore ? t('common.loading') : t('common.loadMore')}
                        </span>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <div
        className={cn(
          'border-t p-3 text-xs text-muted-foreground flex flex-col gap-3',
          variant === 'overlay' ? 'border-white/10' : ''
        )}
      >
        <Button
          onClick={async () => {
            await logout();
            router.replace(`/${lang}/login`);
          }}
          className={cn(
            'w-full h-10 md:h-11 justify-center gap-2 rounded-lg font-semibold text-[14px] md:text-[15px] transition-colors',
            variant === 'overlay'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-600/90 hover:to-red-700/90 text-white shadow-sm'
          )}
          aria-label={t('auth.logout')}
        >
          <LogOut className="h-4 w-4" />
          <span>{t('auth.logout')}</span>
        </Button>
        <div className="flex justify-center">
          <LanguageSwitcher variant="sidebar" />
        </div>
        <div className="text-center">{t('chat.sidebar.footer')}</div>
      </div>
    </div>
  );
}
