import { NextRequest } from "next/server"
import OpenAI from "openai"

// Helper function to get user's complete education context (system + grade)
async function getEducationSystemContext(req: NextRequest): Promise<{ context: string | null; requiresArabic: boolean }> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
    const response = await fetch(`${backendUrl}/users/education-context`, {
      headers: {
        'Cookie': req.headers.get('cookie') || '',
      },
    })
    
    if (!response.ok) return { context: null, requiresArabic: false }
    
    const data = await response.json()
    return {
      context: data.context || null,
      requiresArabic: data.requiresArabic || false
    }
  } catch (error) {
    console.error('Failed to get education system context:', error)
    return { context: null, requiresArabic: false }
  }
}

export async function POST(req: NextRequest) {
  try {
  const cookieHeader = req.headers.get('cookie') || ''
  const authed = /(?:^|;\s*)authp=1(?:;|$)/.test(cookieHeader)
  if (!authed) {
    return new Response('Unauthorized', { status: 401 })
  }
  const body: unknown = await req.json().catch(() => ({} as object))
  const prompt = (body as { prompt?: unknown })?.prompt as string | undefined
  const history = (body as { history?: { role: string; content: string }[] })?.history || []
  const wantsStream: boolean = Boolean((body as { stream?: unknown })?.stream) || req.nextUrl.searchParams.get("stream") === "1"
  
  // Get education system context
  const { context: educationContext, requiresArabic } = await getEducationSystemContext(req)
    if (!prompt || typeof prompt !== "string") {
      return new Response("Invalid prompt", { status: 400 })
    }

    const baseURL = process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1"
    const apiKey = process.env.OPENAI_API_KEY
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

    if (!apiKey) {
      return new Response("OpenAI API key not configured", { status: 500 })
    }

    const client = new OpenAI({ baseURL, apiKey })

    if (wantsStream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            // Build history without education system context first
            const filteredHistory = history
              .filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0)
              .slice(-20) // safety cap
              .map(m => ({ role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user', content: m.content.slice(0, 4000) }))
            
            // Create system message with Arabic instruction if required
            const systemContent = requiresArabic 
              ? "You are a helpful assistant. You must respond in Arabic language only. All your responses should be written completely in Arabic."
              : "You are a helpful assistant.";

            const messagesPayload = [
              { role: "system", content: systemContent },
              // Add education system context as the first user message if available
              ...(educationContext ? [{ role: "user", content: educationContext }] : []),
              ...filteredHistory,
              { role: "user", content: prompt }
            ] as { role: 'system' | 'user' | 'assistant'; content: string }[];
            const completion = await client.chat.completions.create({
              model,
              messages: messagesPayload,
              temperature: 0.7,
              stream: true,
            })
            for await (const part of completion) {
              const delta = (part.choices?.[0]?.delta as { content?: string } | undefined)?.content ?? ""
              if (delta) controller.enqueue(encoder.encode(delta))
            }
          } catch (e) {
            controller.error(e)
          } finally {
            controller.close()
          }
        },
      })
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      })
    } else {
      // Build history without education system context first
      const filteredHistory = history
        .filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0)
        .slice(-20)
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user', content: m.content.slice(0, 4000) }))
      
      // Create system message with Arabic instruction if required
      const systemContent = requiresArabic 
        ? "You are a helpful assistant. You must respond in Arabic language only. All your responses should be written completely in Arabic."
        : "You are a helpful assistant.";

      const messagesPayload = [
        { role: "system", content: systemContent },
        // Add education system context as the first user message if available
        ...(educationContext ? [{ role: "user", content: educationContext }] : []),
        ...filteredHistory,
        { role: "user", content: prompt }
      ] as { role: 'system' | 'user' | 'assistant'; content: string }[];
      const completion = await client.chat.completions.create({
        model,
        messages: messagesPayload,
        temperature: 0.7,
      })
      const reply = completion.choices?.[0]?.message?.content ?? ""
      return Response.json({ reply })
    }
  } catch (err: unknown) {
    console.error("/api/chat error", err)
    return new Response("Failed to fetch completion", { status: 500 })
  }
}
