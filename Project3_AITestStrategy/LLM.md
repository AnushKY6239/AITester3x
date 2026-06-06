# Project Constitution (LLM.md)

This document is the governing constitution of the JIRA Test Strategy Generator. All components must adhere strictly to these schemas, rules, and invariants.

## Data Schemas

### 1. Configuration Settings (Input)
```json
{
  "jiraUrl": "https://company.atlassian.net",
  "jiraEmail": "user@company.com",
  "jiraToken": "ATATT3xFfG0...",
  "jiraIssueId": "PROJ-123",
  "groqApiKey": "gsk_...",
  "groqModel": "llama-3.1-70b-versatile"
}
```

### 2. Extracted JIRA Issue Data (Intermediate Payload)
```json
{
  "key": "PROJ-123",
  "summary": "Implement Checkout Payment Gateway",
  "description": "User story details, description, and acceptance criteria text.",
  "project": "E-Commerce Suite"
}
```

### 3. Generated Test Strategy Schema (Final Output Payload)
```json
{
  "title": "Test Strategy for Implement Checkout Payment Gateway",
  "objective": "Detailed objective based on the issue description.",
  "scope": {
    "inScope": [
      "Feature 1 to test",
      "Feature 2 to test"
    ],
    "outOfScope": [
      "Exclusion 1",
      "Exclusion 2"
    ]
  },
  "focusAreas": [
    { "area": "Functional", "details": "Verification of basic flows..." },
    { "area": "UI/Navigation", "details": "Layout and navigation testing..." },
    { "area": "Performance", "details": "Response time and load limits..." },
    { "area": "Security", "details": "Encryption and data validation..." },
    { "area": "Compatibility", "details": "Browsers and OS checks..." },
    { "area": "Usability", "details": "Accessibility and ease of use..." }
  ],
  "approach": [
    "Test methodology 1",
    "Test methodology 2"
  ],
  "deliverables": [
    "Deliverable item 1",
    "Deliverable item 2"
  ],
  "teamAndSchedule": {
    "teamSize": "e.g., 3 members",
    "duration": "e.g., 2 weeks",
    "schedule": [
      "Phase 1 details",
      "Phase 2 details"
    ]
  },
  "entryAndExitCriteria": {
    "entry": "Ready for testing requirements",
    "exit": "Completion and release requirements"
  },
  "risks": [
    "Potential risk item 1",
    "Potential risk item 2"
  ]
}
```

## Behavioral Rules
1. **Never guess at credentials**: Throw clear errors if JIRA credentials or Groq keys are malformed or missing.
2. **CORS Prevention**: Always proxy external API requests through Next.js API routes; do not attempt client-to-JIRA or client-to-Groq requests directly.
3. **Template Loyalty**: Generated `.docx` files must contain exactly the 9 major sections defined in the data schema and target template. No sections may be skipped.

## Architectural Invariants
1. **Layer Separation**: The React page controls UI states, the Next.js API endpoint coordinates execution, and Layer 3 modules in `tools/` execute JIRA/Groq actions deterministically.
2. **Local Workspace Only**: All code files must reside in `c:/Users/Admin/AICourse/6th may/BLAST/`.
3. **No External Libraries for Layout**: Styling must use custom Vanilla CSS stylesheets (`.css` / CSS Modules). TailwindCSS is banned unless explicitly allowed.
