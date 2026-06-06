# Project Map & State (gemini.md)

## Active State
- **Project Name**: JIRA Test Strategy Generator
- **Framework**: B.L.A.S.T Protocol + A.N.T 3-Layer Architecture
- **Current Phase**: Blueprint Phase (1) -> Link Phase (2)

## Architectural Layout
```
├── gemini.md          # Project Map & State Tracking
├── LLM.md             # Project Constitution & Data Schemas
├── task_plan.md       # Phase Checklists
├── findings.md        # Environment discoveries & Template format
├── progress.md        # Completed items and issues
├── .env.template      # Configuration template
├── architecture/      # Layer 1: SOPs
│   ├── jira_reader_sop.md
│   ├── strategy_generator_sop.md
│   └── docx_builder_sop.md
├── tools/             # Layer 3: Deterministic JS Engines
│   ├── verify_jira.js
│   ├── verify_groq.js
│   ├── fetch_jira.js
│   ├── generate_strategy.js
│   └── build_docx.js
└── .tmp/              # Temporary Workbench
```

## Data Schema Rules
Confirmed the schemas outlined in `LLM.md`. All logic input/output shapes must comply with the specified JSON layouts.

## Maintenance Log
- **2026-06-06**: Initialized BLAST directory layout and project Constitution files. Set up configuration shapes.
- **2026-06-06**: Implemented Phase 2 Link (verify scripts), Phase 3 Architect (SOPs, tools/fetch_jira.js, tools/generate_strategy.js, tools/build_docx.js), and Phase 4 Stylize (Next.js dashboard React app with Vanilla CSS styling, light/dark modes, and document generation download). Successfully compiled the application build.
