import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const NEXUS_DIR = '/Users/6pf/.openclaw/workspace/nexus'

export async function POST() {
  try {
    const timestamp = new Date().toLocaleString('en-GB', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })

    await execAsync('git add .', { cwd: NEXUS_DIR })

    let committed = true
    try {
      await execAsync(`git commit -m "save: ${timestamp}"`, { cwd: NEXUS_DIR })
    } catch {
      // Nothing to commit
      committed = false
    }

    await execAsync('git push origin main', { cwd: NEXUS_DIR })

    return NextResponse.json({
      ok: true,
      message: committed ? `Saved & pushed at ${timestamp}` : 'Nothing new — already up to date',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
