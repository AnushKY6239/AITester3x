# BLAST Project Plan: JIRA Test Strategy Generator

This document outlines the project phases and checklist according to BLAST Protocol 0.

## Phase Checklist

### Phase 1: Blueprint (Vision & Logic)
- [x] Ask Discovery Questions and verify answers.
- [ ] Define the JSON Data Schema in `gemini.md` (Input & Output payloads).
- [ ] Research target format requirements from `Test Strategy for Ecommerce Website.docx`.

### Phase 2: Link (Connectivity)
- [ ] Configure environment variables template.
- [ ] Create `tools/verify_jira.js` to handshake with JIRA API.
- [ ] Create `tools/verify_groq.js` to handshake with Groq/OpenAI API.
- [ ] Execute link handshakes and log results in `progress.md`.

### Phase 3: Architect (The 3-Layer Build)
- [ ] Create Standard Operating Procedures (SOPs) in `architecture/`:
  - `architecture/jira_reader_sop.md`
  - `architecture/strategy_generator_sop.md`
  - `architecture/docx_builder_sop.md`
- [ ] Write Node.js Layer 3 executable tools in `tools/`:
  - `tools/fetch_jira.js`
  - `tools/generate_strategy.js`
  - `tools/build_docx.js`
- [ ] Test command-line pipeline: Fetch -> Generate -> Build Document.

### Phase 4: Stylize (Refinement & UI)
- [ ] Initialize lightweight Next.js app in the project root.
- [ ] Implement proxy API route (`pages/api/strategy.js`) for secure execution.
- [ ] Write vanilla CSS layout and typography stylesheet (`styles/globals.css`).
- [ ] Implement theme context for light/dark mode.
- [ ] Design high-fidelity dashboard in `pages/index.js` with micro-animations.

### Phase 5: Trigger (Deployment)
- [ ] Implement file download functionality for `.docx` outputs in UI.
- [ ] Conduct end-to-end integration tests.
- [ ] Finalize the Maintenance Log in `gemini.md`.
