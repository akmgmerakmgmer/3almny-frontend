"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBookmarks, deleteBookmark, type Bookmark } from "@/services/bookmarks";
import { Search, Loader2, ExternalLink, Trash2 } from "lucide-react";
import PageWithSidebar from "@/components/layout/PageWithSidebar";

const PAGE_SIZE = 20;

export default function BookmarksPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") ?? "";
  const initialPageParam = searchParams?.get("page");
  const initialPage = initialPageParam ? Math.max(parseInt(initialPageParam, 10) || 0, 0) : 0;

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const initialQueryAppliedRef = useRef(true);

  const { user } = useAuthContext();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchTerm.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (initialQueryAppliedRef.current) {
      initialQueryAppliedRef.current = false;
      return;
    }
    setPage(0);
  }, [debouncedQuery]);

  useEffect(() => {
    if (unauthorized) {
      router.replace(`/${lang}/login`);
    }
  }, [unauthorized, router, lang]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBookmarks({ query: debouncedQuery, offset: page * PAGE_SIZE, limit: PAGE_SIZE })
      .then((response) => {
        if (cancelled) return;
        const { bookmarks: items, total: nextTotal, hasMore: nextHasMore } = response;
        // If the current page exceeds total results (after deletion), step back once.
        if (page > 0 && nextTotal <= page * PAGE_SIZE && nextTotal > 0) {
          setPage((prev) => Math.max(0, prev - 1));
          return;
        }
        setBookmarks(items);
        setTotal(nextTotal);
        setHasMore(nextHasMore);
        setError(null);
        setUnauthorized(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if ((err as { message?: string })?.message === "UNAUTHORIZED") {
          setUnauthorized(true);
          return;
        }
        setError((err as { message?: string })?.message || "Failed to load bookmarks");
        setBookmarks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (debouncedQuery) {
        url.searchParams.set("q", debouncedQuery);
      } else {
        url.searchParams.delete("q");
      }
      if (page > 0) {
        url.searchParams.set("page", String(page));
      } else {
        url.searchParams.delete("page");
      }
      router.replace(url.pathname + url.search, { scroll: false });
    }

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, page, router, reloadToken]);

  const handleOpenBookmark = useCallback((entry: Bookmark) => {
    if (!entry.chatId) return;
    router.push(`/${lang}/chat?chat=${entry.chatId}`);
  }, [router, lang]);

  const handleRemoveBookmark = useCallback(async (bookmarkId: string) => {
    try {
      await deleteBookmark(bookmarkId);
      setReloadToken((token) => token + 1);
    } catch (err: unknown) {
      if ((err as { message?: string })?.message === "UNAUTHORIZED") {
        setUnauthorized(true);
      } else {
        setError((err as { message?: string })?.message || "Failed to delete bookmark");
      }
    }
  }, []);

  const totalPages = useMemo(() => (total === 0 ? 1 : Math.ceil(total / PAGE_SIZE)), [total]);
  const startIndex = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIndex = total === 0 ? 0 : Math.min(total, page * PAGE_SIZE + bookmarks.length);
  const canPrev = page > 0;
  const canNext = hasMore;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((value) => !value), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeSidebar]);

  const showSidebar = Boolean(user);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }), []);

  const containsArabic = useCallback((text: string) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text), []);

  return (
    <PageWithSidebar lang={lang}>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="mx-auto w-full max-w-4xl px-4 py-6">
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading bookmarks...
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-4xl px-4 py-6 space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold">Bookmarks</h1>
                  <p className="text-sm text-muted-foreground">Search and manage your saved responses.</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search bookmarks"
                    className="h-10 w-full rounded-full bg-background/80 pl-9 text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-700 shadow-sm">
                  {error}
                </div>
              )}

              {bookmarks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
                  {debouncedQuery ? "No bookmarks match your search." : "You haven't saved any bookmarks yet."}
                </div>
              ) : (
                <ul className="space-y-4">
                  {bookmarks.map((entry) => {
                    const savedLabel = entry.savedAt ? dateFormatter.format(new Date(entry.savedAt)) : "";
                    return (
                      <li key={entry.id} className="rounded-xl border border-border/50 bg-card/60 p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                              {entry.role === "assistant" ? "Assistant" : entry.role === "user" ? "You" : "System"}
                            </p>
                            {typeof entry.meta?.title === 'string' && (
                              <h2
                                className="text-base font-semibold text-foreground"
                                style={containsArabic(entry.meta.title as string) ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.95rem' } : undefined}
                              >
                                {entry.meta.title}
                              </h2>
                            )}
                            <p className="text-xs text-muted-foreground">Saved {savedLabel}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenBookmark(entry)}
                              className="inline-flex items-center gap-1 text-indigo-600 hover:bg-indigo-500 hover:text-white"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open chat
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveBookmark(entry.id)}
                              className="inline-flex items-center gap-1 text-red-600 hover:bg-red-600 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                        <p
                          className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90"
                          style={containsArabic(entry.content) ? { fontFamily: 'var(--font-arabic-sans)', fontSize: '0.95rem' } : undefined}
                        >
                          {entry.content}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                <span>
                  Showing {total === 0 ? 0 : startIndex}-{total === 0 ? 0 : endIndex} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(0, prev - 1))} disabled={!canPrev}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((prev) => prev + 1)} disabled={!canNext}>
                    Next
                  </Button>
                  <span className="text-muted-foreground/70">Page {Math.min(page + 1, totalPages)} of {totalPages}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </PageWithSidebar>
  );
}
