export async function chatPrompt(prompt: string): Promise<{ reply: string }> {
	const res = await fetch("/api/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ prompt }),
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
	const res = await fetch("/api/chat?stream=1", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ ...body, stream: true }),
		signal,
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
