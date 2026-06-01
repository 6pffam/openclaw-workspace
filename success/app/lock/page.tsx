'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LockPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    setLoading(false)

    if (res.ok) {
      router.push('/input')
      router.refresh()
    } else {
      setPin('')
      setError('Wrong PIN. Try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1b2a' }}>
      <div
        className="w-full max-w-sm px-8 py-10 rounded-2xl"
        style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="mb-8 text-center">
          <div className="text-3xl mb-2">📊</div>
          <h1 className="text-xl font-semibold text-white">Success is locked</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Enter your PIN to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="PIN"
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-center text-xl tracking-widest text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          {error && (
            <p className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || pin.length === 0}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: pin.length > 0 ? '#3b82f6' : 'rgba(255,255,255,0.06)',
              color: pin.length > 0 ? 'white' : 'rgba(255,255,255,0.3)',
            }}
          >
            {loading ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  )
}
