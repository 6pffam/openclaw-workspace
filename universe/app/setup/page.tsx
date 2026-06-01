'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (pin.length < 4) {
      setError('PIN must be at least 4 characters.')
      return
    }
    if (pin !== confirm) {
      setError('PINs do not match.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    setLoading(false)

    if (res.ok) {
      router.refresh()
      router.push('/contacts')
    } else {
      const data = await res.json()
      setError(data.error || 'Setup failed.')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0d1b2a' }}
    >
      <div
        className="w-full max-w-sm px-8 py-10 rounded-2xl"
        style={{
          background: '#0f2236',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="mb-8 text-center">
          <div className="text-3xl mb-2">🌐</div>
          <h1 className="text-xl font-semibold text-white">Welcome to Universe</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Set a PIN to protect your contacts. This runs only on your machine.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Choose a PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••••"
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Confirm PIN
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none text-white"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: '#f59e0b',
              color: '#0d1b2a',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Setting up…' : 'Create PIN & Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
