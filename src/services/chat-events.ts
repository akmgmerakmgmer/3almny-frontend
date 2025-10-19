// Lightweight event emitter for chat lifecycle events (no external deps)
// Allows components like ChatSidebar to react (optimistically prepend) without refetching.

type ChatCreatedPayload = { id: string; title: string; createdAt?: string; updatedAt?: string };
type ChatUpdatedPayload = { id: string; title?: string; updatedAt?: string; createdAt?: string };

type Events = {
  chatCreated: ChatCreatedPayload;
  chatUpdated: ChatUpdatedPayload;
};

type EventKey = keyof Events;

const listeners: {
  chatCreated: Array<(payload: ChatCreatedPayload) => void>;
  chatUpdated: Array<(payload: ChatUpdatedPayload) => void>;
} = {
  chatCreated: [],
  chatUpdated: [],
};

export function onChatCreated(cb: (p: ChatCreatedPayload) => void) {
  addListener('chatCreated', cb);
  return () => removeListener('chatCreated', cb);
}

export function emitChatCreated(payload: ChatCreatedPayload) {
  emit('chatCreated', payload);
}

export function onChatUpdated(cb: (p: ChatUpdatedPayload) => void) {
  addListener('chatUpdated', cb);
  return () => removeListener('chatUpdated', cb);
}

export function emitChatUpdated(payload: ChatUpdatedPayload) {
  emit('chatUpdated', payload);
}

function addListener<K extends EventKey>(key: K, cb: (payload: Events[K]) => void) {
  listeners[key].push(cb as any);
}

function removeListener<K extends EventKey>(key: K, cb: (payload: Events[K]) => void) {
  listeners[key] = listeners[key].filter(fn => fn !== cb) as any;
}

function emit<K extends EventKey>(key: K, payload: Events[K]) {
  (listeners[key] as Array<(payload: Events[K]) => void>).forEach(fn => {
    try { fn(payload); } catch (e) { console.warn('chat-events listener error', e); }
  });
}
