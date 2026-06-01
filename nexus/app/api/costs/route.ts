import { NextResponse } from 'next/server'
import { getAgentCosts } from '@/lib/costs'
import { readCrewData } from '@/lib/workspace'

export const dynamic = 'force-dynamic'

export async function GET() {
  const crewData = readCrewData()
  const members = crewData?.members ?? []

  const costs: Record<string, ReturnType<typeof getAgentCosts>> = {}

  for (const member of members) {
    if (member.agentId) {
      costs[member.agentId] = getAgentCosts(member.agentId)
    }
  }

  return NextResponse.json({ costs, usdToChf: 0.90 })
}
