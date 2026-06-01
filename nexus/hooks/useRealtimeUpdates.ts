'use client'

import { useEffect } from 'react'

export function useRealtimeUpdates(onUpdate: () => void) {
  useEffect(() => {
    const es = new EventSource('/api/watch')

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'change') onUpdate()
      } catch {}
    }

    return () => es.close()
  }, [onUpdate])
}
