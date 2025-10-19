import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const authed = /(?:^|;\s*)authp=1(?:;|$)/.test(cookieHeader)
    if (!authed) {
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
