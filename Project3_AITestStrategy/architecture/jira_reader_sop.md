# JIRA Reader SOP (architecture/jira_reader_sop.md)

This SOP details how to read and extract JIRA issues from the JIRA Cloud REST API.

## Objectives
- Retrieve the issue summary, description, and key details.
- Handle different variations of JIRA text formats (Atlassian Document Format - ADF vs Plaintext).

## Step-by-Step Procedure

### 1. Connection and Auth
- Endpoint: `https://<jiraBaseUrl>/rest/api/3/issue/<jiraIssueId>`
- Method: `GET`
- Header: `Authorization: Basic Base64(jiraEmail:jiraToken)`
- Header: `Accept: application/json`

### 2. ADF Parsing Logic (Atlassian Document Format)
Atlassian returns description in a complex JSON-based tree structure. We must recursively traverse this tree to extract text content:
- If node is of type `text`, append its `text` property.
- If node has `content` array, recursively traverse child nodes.
- If node is of type `paragraph`, add a newline after parsing its children.
- If node is of type `bulletList`, format children with list dashes.

### 3. Fallbacks
- If `fields.description` is a string (older JIRA APIs/configurations), use it directly.
- If no description is available, fall back to using the `fields.summary` or a default notice.
- If fetching fails due to missing credentials, return a mocked placeholder issue for local development.
