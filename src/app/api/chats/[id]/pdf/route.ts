import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  const messageId = req.nextUrl.searchParams.get('messageId') || undefined
  // Proxy to backend preserving cookies for auth
  const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4000'
  const url = new URL(`/chats/${encodeURIComponent(id)}/pdf`, backendBase)
  if (messageId) url.searchParams.set('messageId', messageId)

  const cookie = req.headers.get('cookie') || ''
  
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        cookie,
      },
      // We want the raw PDF stream
      cache: 'no-store',
      redirect: 'follow'
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error')
      console.error('Backend PDF generation failed:', res.status, errorText)
      return new Response(`Failed to generate PDF: ${errorText}`, { status: res.status })
    }

    const headers = new Headers(res.headers)
    headers.set('Cache-Control', 'no-store')
    const buf = await res.arrayBuffer()
    return new Response(buf, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('PDF proxy error:', error)
    return new Response('PDF generation failed: ' + String(error), { status: 500 })
  }
}
