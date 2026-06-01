import AppShell from '@/components/layout/AppShell'

export default function MemoryPage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <span className="text-5xl">📓</span>
        <h1 className="text-xl font-semibold text-white">Memory</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Phase 1D — coming after Interlocks is approved.
        </p>
      </div>
    </AppShell>
  )
}
