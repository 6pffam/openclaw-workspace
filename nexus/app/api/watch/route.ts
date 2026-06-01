import fs from 'fs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('data: {"type":"ping"}\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, 25000)

      const watcher = fs.watch(
        '/Users/6pf/.openclaw/workspace',
        { recursive: true },
        (event, filename) => {
          if (!filename) return
          if (filename.includes('node_modules') || filename.includes('.git')) return
          try {
            const payload = JSON.stringify({ type: 'change', file: filename })
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
          } catch {}
        }
      )

      return () => {
        clearInterval(heartbeat)
        watcher.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
