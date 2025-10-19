import { http } from './http';

export interface Bookmark {
  id: string;
  chatId: string | null;
  messageId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  meta?: Record<string, unknown>;
  savedAt: string;
}

export interface CreateBookmarkRequest {
  chatId?: string | null;
  messageId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  meta?: Record<string, unknown>;
}

export interface BookmarksRequest {
  query?: string;
  offset?: number;
  limit?: number;
}

export interface BookmarksResponse {
  bookmarks: Bookmark[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export async function getBookmarks(params: BookmarksRequest = {}): Promise<BookmarksResponse> {
  const search = new URLSearchParams();
  if (params.query && params.query.trim()) {
    search.set('q', params.query.trim());
  }
  if (typeof params.offset === 'number' && Number.isFinite(params.offset)) {
    search.set('offset', String(Math.max(0, Math.floor(params.offset))));
  }
  if (typeof params.limit === 'number' && Number.isFinite(params.limit)) {
    search.set('limit', String(Math.max(1, Math.floor(params.limit))));
  }
  const queryString = search.toString();
  const res = await http<BookmarksResponse | Bookmark[] | { bookmarks: Bookmark[] }>('/users/bookmarks' + (queryString ? `?${queryString}` : ''));
  if (Array.isArray(res)) {
    const limit = params.limit ?? res.length;
    return {
      bookmarks: res,
      total: res.length,
      offset: params.offset ?? 0,
      limit,
      hasMore: false,
    };
  }
  if (!res || !('bookmarks' in res)) {
    return {
      bookmarks: [],
      total: 0,
      offset: params.offset ?? 0,
      limit: params.limit ?? 0,
      hasMore: false,
    };
  }
  if ('total' in res || 'offset' in res || 'limit' in res || 'hasMore' in res) {
    const typed = res as BookmarksResponse;
    return {
      bookmarks: typed.bookmarks ?? [],
      total: typeof typed.total === 'number' ? typed.total : typed.bookmarks.length,
      offset: typeof typed.offset === 'number' ? typed.offset : params.offset ?? 0,
      limit: typeof typed.limit === 'number' ? typed.limit : params.limit ?? typed.bookmarks.length,
      hasMore: Boolean(typed.hasMore),
    };
  }
  const list = res.bookmarks ?? [];
  return {
    bookmarks: list,
    total: list.length,
    offset: params.offset ?? 0,
    limit: params.limit ?? list.length,
    hasMore: false,
  };
}

export async function createBookmark(payload: CreateBookmarkRequest): Promise<Bookmark> {
  return http<Bookmark>('/users/bookmarks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
  await http(`/users/bookmarks/${bookmarkId}`, {
    method: 'DELETE',
  });
}
