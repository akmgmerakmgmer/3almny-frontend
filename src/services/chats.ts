export interface ChatListItem {
  id: string;
  title: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface PersistedChatMessage {
  id: string;
  type: 'text' | 'image' | 'pdf' | 'file' | 'system';
  content: string;
  createdAt: string;
  meta?: Record<string, unknown>;
  role: 'user' | 'assistant' | 'system';
}

export interface ChatDetail extends ChatListItem {
  userId: string;
  messages: PersistedChatMessage[];
}

import { http } from './http';
import { emitChatCreated, emitChatUpdated } from './chat-events';

export interface ChatPage {
  success: boolean;
  data: ChatListItem[];
  total: number;
  limit: number;
  offset: number;
  nextOffset: number | null;
}

export interface ChatMessageSearchResult {
  chatId: string;
  chatTitle: string;
  messageId: string;
  messageContent: string;
  messageRole: 'user' | 'assistant' | 'system';
  messageCreatedAt?: string;
  messageIndex?: number;
}

export interface ChatMessageSearchResponse {
  success?: boolean;
  results: ChatMessageSearchResult[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export async function listChats(params?: { limit?: number; offset?: number }): Promise<ChatPage> {
  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;
  const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) }).toString();
  return http<ChatPage>(`/chats?${qs}`);
}

export async function searchChatMessages(params: { query: string; limit?: number; offset?: number; signal?: AbortSignal }): Promise<ChatMessageSearchResponse> {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const search = new URLSearchParams();
  search.set('q', params.query.trim());
  search.set('limit', String(limit));
  search.set('offset', String(offset));
  const qs = search.toString();
  return http<ChatMessageSearchResponse>(`/chats/search/messages?${qs}`, { signal: params.signal });
}

export async function getChat(id: string): Promise<ChatDetail> { return http<ChatDetail>(`/chats/${id}`); }

export async function createChat(title: string): Promise<ChatDetail> { 
  const created = await http<ChatDetail>('/chats', { method: 'POST', body: JSON.stringify({ title }) });
  emitChatCreated({ id: created.id, title: created.title, createdAt: created.createdAt, updatedAt: created.updatedAt });
  return created;
}

export async function addMessage(chatId: string, payload: { type: PersistedChatMessage['type']; content: string; role?: 'user' | 'assistant' | 'system'; meta?: Record<string, unknown> }): Promise<PersistedChatMessage> {
  const saved = await http<PersistedChatMessage>(`/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify(payload) });
  emitChatUpdated({ id: chatId, updatedAt: saved.createdAt ?? new Date().toISOString() });
  return saved;
}

export async function updateChat(id: string, title: string): Promise<ChatDetail> {
  const updated = await http<ChatDetail>(`/chats/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) });
  emitChatUpdated({ id, title: updated.title, updatedAt: updated.updatedAt });
  return updated;
}

export async function deleteChat(id: string): Promise<{ deleted: true }> { return http<{ deleted: true }>(`/chats/${id}`, { method: 'DELETE' }); }

export async function downloadChatPdf(chatId: string, messageId?: string): Promise<Blob> {
  const qs = new URLSearchParams();
  if (messageId) qs.set('messageId', messageId);
  const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}/pdf${qs.toString() ? `?${qs.toString()}` : ''}`, {
    method: 'GET',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to download PDF');
  return await res.blob();
}
