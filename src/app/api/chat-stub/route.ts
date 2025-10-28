import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Check for JWT token in Authorization header instead of cookies
    const authHeader = req.headers.get('authorization') || ''
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 })
    }
    const { prompt } = await req.json()
    const reply = typeof prompt === "string" && prompt.trim()
      ? `Echo: ${prompt}`
      : "Hello! Ask me anything."

    return Response.json({ reply })
  } catch {
    return new Response("Bad Request", { status: 400 })
  }
}
