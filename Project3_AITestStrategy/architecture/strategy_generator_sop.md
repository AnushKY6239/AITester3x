# Strategy Generator SOP (architecture/strategy_generator_sop.md)

This SOP establishes the guidelines for prompting the Groq LLM to generate test strategy documents matching the exact structure of the target ecommerce template.

## Objectives
- Generate high-quality, professional-grade test strategies.
- Ensure the output strictly follows the JSON payload schema defined in `LLM.md` to avoid parser failures.

## System Prompt Guidelines

The LLM must be instructed to act as a Principal Quality Assurance Architect with 10+ years of experience. The prompt should explicitly require:

### 1. Document Format & Sections
The generated response must contain exactly:
1. **Title**: "Test Strategy for [Feature Summary]"
2. **Objective**: Why and what we are testing.
3. **Scope**: Specifically detailed `inScope` and `outOfScope` arrays of strings.
4. **Focus Areas**: Key QA fields with descriptions:
   - Functional
   - UI/Navigation
   - Performance (incorporate target numbers, e.g. "at least 1000 concurrent users")
   - Security (OWASP Top 10, encryption, etc.)
   - Compatibility (browsers Chrome/Firefox/IE/Safari, iOS/Android)
   - Usability (accessibility, user experience testing with at least 10 users)
5. **Approach**: QA methodology (automation with Selenium/Appium, manual, exploratory, load/stress).
6. **Deliverables**: Generated test cases, scripts, coverage charts, reports.
7. **Team & Schedule**: Team size, duration, and month-by-month timeline.
8. **Entry & Exit Criteria**: "Ready for Testing" and "Definition of Done".
9. **Risks**: Blockers like environment delays, payment gateways access, data sets.

### 2. Output Formatting
- Enforce JSON format using `response_format: { type: "json_object" }` or explicit prompt system rules.
- Do not include markdown code block backticks (e.g. ```json) if using direct JSON parsers, or ensure the server handles stripping the backticks gracefully.
