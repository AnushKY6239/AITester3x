# Project Findings & Constraints

## Workspace Environment
- **Node.js**: Installed (version `v24.14.0`).
- **npm**: Installed (with standard package support).
- **Python**: Not found in PATH.
- **Decision**: Layer 3 tools will be built as atomic, testable JavaScript scripts executed under Node.js rather than Python scripts, fulfilling the same BLAST architectural invariants.

## JIRA REST API Integration
- URL endpoint: `https://<your-domain>.atlassian.net/rest/api/3/issue/<issue-id>`
- Authentication: Basic Auth using `Base64(Email:ApiToken)`.
- Expected fields: `summary`, `description` (Atlassian Document Format - ADF), and custom fields if any. We will extract text content from the ADF description.

## Groq API (OpenAI Compatible)
- URL endpoint: `https://api.groq.com/openai/v1`
- Model selection: We will default to `llama-3.1-70b-versatile` or `llama3-70b-8192` since they have high token limits and excellent reasoning capabilities.
- Library: Standard `openai` npm package.

## Target Word Document Layout Analysis
We parsed `Test Strategy for Ecommerce Website.docx` and extracted the following standard sections:
1. **Title**: Test Strategy for [Feature/Project Name]
2. **Objective**: Scope of testing and core goals.
3. **Scope**:
   - In scope: Bullets of customer workflows, admin modules, etc.
   - Out of scope: Exclusions like physical fulfillment, third-party systems.
4. **Focus Areas**:
   - Areas of testing (Functional, UI, Performance, Security, Compatibility, Usability).
5. **Approach**:
   - Methodologies, test types, tools (e.g. JMeter, Selenium, OWASP).
6. **Deliverables**:
   - Items to deliver (test cases, performance reports, coverage reports).
7. **Team & Schedule**:
   - Team sizing, timeline by month.
8. **Entry & Exit Criteria**:
   - Definition of Ready for testing (Entry) and Definition of Done (Exit).
9. **Risks**:
   - Risks such as environments, credentials, complex workflows.
