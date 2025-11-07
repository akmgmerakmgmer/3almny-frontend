import { tokenStorage } from '@/lib/token-storage';

export async function chatPrompt(prompt: string): Promise<{ reply: string }> {
	const headers = new Headers({ "Content-Type": "application/json" })
	const token = tokenStorage.get()
	if (token) headers.set("Authorization", `Bearer ${token}`)

	const res = await fetch("/api/chat", {
		method: "POST",
		headers,
		body: JSON.stringify({ prompt }),
		credentials: "include",
	})
	if (!res.ok) {
		throw new Error("Chat request failed")
	}
	return res.json()
}

export interface ChatHistoryItem { role: 'user' | 'assistant' | 'system'; content: string }
interface ChatStreamPayload { prompt: string; history?: ChatHistoryItem[] }

export async function* chatPromptStream(payload: string | ChatStreamPayload, signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
	const body: ChatStreamPayload = typeof payload === 'string' ? { prompt: payload } : payload;
	const headers = new Headers({ "Content-Type": "application/json" })
	const token = tokenStorage.get()
	if (token) headers.set("Authorization", `Bearer ${token}`)

	const res = await fetch("/api/chat?stream=1", {
		method: "POST",
		headers,
		body: JSON.stringify({ ...body, stream: true }),
		signal,
		credentials: "include",
	})
	if (res.status === 401) {
		throw new Error('UNAUTHORIZED')
	}
	if (!res.ok || !res.body) {
		throw new Error("Chat stream request failed")
	}
	const reader = res.body.getReader()
	const decoder = new TextDecoder()
	try {
		while (true) {
			const { value, done } = await reader.read()
			if (done) break
			const chunk = decoder.decode(value, { stream: true })
			if (chunk) yield chunk
		}
	} finally {
		reader.releaseLock()
	}
}
