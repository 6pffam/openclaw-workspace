export type AgentStatus = 'active' | 'idle' | 'pending-approval' | 'not-deployed' | 'planned'

export interface CrewMember {
  id: string
  name: string
  role: string
  mission: string
  status: AgentStatus
  reportsTo: string | null
  emoji: string
  agentId?: string | null
  lastActiveAt?: number | null  // epoch ms of most recent session file
  model?: string | null           // last-used model (from session history)
  configuredModel?: string | null  // primary model from openclaw.json
  secondaryModel?: string | null   // secondary model (e.g. qwen-coder for FORGE)
  currentMonthChf?: number | null
  previousMonthChf?: number | null
  currentMonthUsd?: number | null
  previousMonthUsd?: number | null
  costDataAsOf?: number | null   // epoch ms of most recent cost data point
  costSource?: 'cache' | 'trajectory' | 'none' | null
}

export interface CrewData {
  version: string
  updatedAt: string
  members: CrewMember[]
}
