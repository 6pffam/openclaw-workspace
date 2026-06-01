# Success

Executive project timeline & Gantt visualization tool — part of the OpenClaw suite.

## Setup

```bash
cd success
npm install
npm run dev
```

App runs on **http://localhost:3004**

## Data Storage

All data is stored locally at:
```
~/.openclaw/workspace/success/.data/success.db
```

## Authentication

Default PIN: `1234`

Override with environment variable:
```bash
SUCCESS_PIN=9999 npm run dev
```

## Workflow

1. **Input** — Import an Excel (.xlsx) file and name your project
2. **Priorities** — Select a project, filter rows, assign priority levels and due dates, define dependencies, preview Gantt, save as a named iteration
3. **Tasks** — Define task steps and assign them to project rows
4. **Report** — Select any project + iteration to view the full executive Gantt chart
5. **Projects** — Browse all projects and their iterations; archive or delete
6. **Archive** — View, restore, or delete archived iterations

## Priority Colors

- 🔴 Critical
- 🟠 High  
- 🟡 Medium
- 🟢 Low
- ⬜ Exclude (hidden from Report)

## Port Convention

Following the OpenClaw suite: `:3004`
