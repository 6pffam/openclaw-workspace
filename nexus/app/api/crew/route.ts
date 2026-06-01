import { NextResponse } from 'next/server'
import { readCrewData, getAgentLiveStatus, getAgentLastActiveMs, getAgentConfiguredModel } from '@/lib/workspace'
import { getAgentCosts } from '@/lib/costs'
import type { CrewMember } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = readCrewData()
  if (!data) {
    return NextResponse.json({ error: 'No crew data found' }, { status: 404 })
  }

  const members: CrewMember[] = data.members.map((member: CrewMember) => {
    if (member.id === 'ceo') {
      return { ...member, status: 'active' }
    }
    if (member.agentId) {
      const liveStatus = getAgentLiveStatus(member.agentId)
      const lastActiveAt = getAgentLastActiveMs(member.agentId)
      const costs = getAgentCosts(member.agentId)
      const configured = getAgentConfiguredModel(member.agentId)
      return {
        ...member,
        status: liveStatus,
        lastActiveAt,
        model: costs.model,
        configuredModel: configured?.primary ?? null,
        secondaryModel: configured?.secondary ?? null,
        currentMonthChf: costs.currentMonthChf,
        previousMonthChf: costs.previousMonthChf,
        currentMonthUsd: costs.currentMonthUsd,
        previousMonthUsd: costs.previousMonthUsd,
        costDataAsOf: costs.dataAsOf,
        costSource: costs.source,
      }
    }
    return member
  })

  return NextResponse.json({ ...data, members })
}
