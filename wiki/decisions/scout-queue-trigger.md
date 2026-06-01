---
title: Queue-File Pattern for SCOUT Trigger in Dossier
type: decision
status: decided
decided: 2026-05-28
tags: [architecture, agent, scout, dossier, async]
---

# Decision: Queue-File Pattern for SCOUT Trigger in Dossier

## Context
Dossier needed a way to invoke SCOUT (an AI agent) to run background research on a case. The original approach was gateway code embedded directly in the API route (`run/route.ts`). This created coupling between the HTTP layer and agent execution, and made retries/visibility awkward.

## Options Considered
- **Option A: Direct gateway call from API route** — simple, synchronous-ish, but tightly coupled; gateway invocation at HTTP request time
- **Option B: Queue-file pattern** — write a JSON file to `dossier/cases/queue/<id>-v<N>.json`; SCOUT picks it up on next heartbeat, runs research, writes results to `dossier/results/`

## Decision
Chose Option B (queue-file pattern). Gateway code removed from `run/route.ts`. SCOUT's heartbeat watches the queue directory and processes pending cases. Results arrive asynchronously.

## Consequences
- Dossier UI polls `status/route.ts` until results appear
- `status/route.ts` has auto-heal: if results file exists while status is still `running`, it flips status to `ready` automatically
- Clean decoupling — the web app doesn't need to know about agent internals
- SCOUT can be swapped for another agent without touching Dossier's API

## Related
- [[wiki/projects/dossier]] — the app using this pattern
- [[wiki/people/scout]] — the agent being triggered
