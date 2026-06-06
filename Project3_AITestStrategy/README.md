# BLAST Project: JIRA Test Strategy Generator

## Overview
This project implements the B.L.A.S.T. (Blueprint, Link, Architect, Stylize, Trigger) protocol with an A.N.T. 3-layer architecture to automate the generation of test strategy documents from JIRA issues. The system fetches issue data from JIRA, processes it through an LLM (Groq) to generate a structured test strategy, and outputs a professional Word document (.docx).

## Project Structure
```
├── gemini.md          # Project Map & State Tracking
├── LLM.md             # Project Constitution & Data Schemas
├── task_plan.md       # Phase Checklists
├── findings.md        # Environment discoveries & Template format
├── progress.md        # Completed items and issues
├── .env.template      # Configuration template
├── architecture/      # Layer 1: SOPs (The "How-To")
│   ├── jira_reader_sop.md
│   ├── strategy_generator_sop.md
│   └── docx_builder_sop.md
├── tools/             # Layer 3: Deterministic JS Engines (Node.js)
│   ├── verify_jira.js
│   ├── verify_groq.js
│   ├── fetch_jira.js
│   ├── generate_strategy.js
│   └── build_docx.js
├── .tmp/              # Temporary Workbench (Intermediates)
└── README.md          # This file
```

## Architecture
The system follows the BLAST protocol and A.N.T. 3-layer architecture:

1. **Layer 1: Architecture (architecture/)** - Technical SOPs written in Markdown that define goals, inputs, tool logic, and edge cases.
2. **Layer 2: Navigation (Decision Making)** - Routes data between SOPs and Tools (handled by the orchestration logic in the tools).
3. **Layer 3: Tools (tools/)** - Deterministic Node.js scripts that are atomic and testable. They use environment variables stored in `.env` and use `.tmp/` for intermediate file operations.

## Current Status
As of the latest update (`gemini.md` maintenance log):
- **Phase 1 (Blueprint)**: Discovery questions answered, data schema defined in `LLM.md`.
- **Phase 2 (Link)**: Verification scripts (`verify_jira.js`, `verify_groq.js`) created and tested.
- **Phase 3 (Architect)**: SOPs created and core tools implemented:
  - `fetch_jira.js` - Retrieves issue data from JIRA
  - `generate_strategy.js` - Uses Groq/LLM to generate test strategy content
  - `build_docx.js` - Builds the Word document from generated content
- **Phase 4 (Stylize)**: Next.js dashboard initialized with vanilla CSS, light/dark mode, and document generation download functionality.
- **Phase 5 (Trigger)**: File download functionality implemented, end-to-end integration tests conducted.

## Setup Instructions
1. Clone the repository
2. Copy `.env.template` to `.env` and fill in the required values:
   - JIRA credentials (email and API token)
   - Groq API key
   - JIRA domain
3. Install dependencies: `npm install`
4. Verify connections:
   - `node tools/verify_jira.js`
   - `node tools/verify_groq.js`
5. Run the full pipeline (example):
   - `node tools/fetch_jira.js <ISSUE_KEY>`
   - `node tools/generate_strategy.js <INPUT_FILE> <OUTPUT_FILE>`
   - `node tools/build_docx.js <INPUT_FILE> <OUTPUT_FILE>`

## How It Works
1. **Fetch**: Retrieve a JIRA issue by its key, extracting summary and description (converting from Atlassian Document Format to plain text).
2. **Generate**: Send the issue data to Groq (using Llama 3 70b model) with a prompt to generate a test strategy document in the standard format.
3. **Build**: Take the generated markdown content and convert it to a styled Word document (.docx) with appropriate headings, bullet points, and formatting.

## Data Schema
The input and output data shapes are defined in `LLM.md` and must be complied with by all tools. The system follows a strict data-first rule: no tool is built until the payload shape is confirmed.

## Maintenance
- All meaningful task outcomes are logged in `progress.md`.
- Discoveries and constraints are recorded in `findings.md`.
- Architectural learnings are updated in the relevant SOP files in `architecture/` when errors occur (self-annealing principle).
- The project constitution (`gemini.md`) is only updated when schemas, rules, or architecture change.

## Future Work
Refer to `task_plan.md` for the complete phase checklist. Upcoming items include:
- Finalizing the Maintenance Log in `gemini.md`
- Conducting end-to-end integration tests
- Preparing for production deployment (cloud transfer and automation triggers)

## Notes
- The project uses Node.js v24.14.0 (as found in the environment).
- Layer 3 tools are implemented as deterministic JavaScript scripts (instead of Python) to fulfill the same architectural invariants.
- The target Word document format was analyzed from `Test Strategy for Ecommerce Website.docx` and includes standard sections: Title, Objective, Scope, Focus Areas, Approach, Deliverables, Team & Schedule, Entry & Exit Criteria, and Risks.