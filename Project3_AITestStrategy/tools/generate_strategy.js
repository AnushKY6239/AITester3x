const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        lines.forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                process.env[key] = value.trim();
            }
        });
    }
}

loadEnv();

async function generateTestStrategy(issueData, config = {}) {
    // Get API key from config or environment, and trim whitespace
    const apiKey = (config.groqApiKey || process.env.GROQ_API_KEY || '').trim();
    const model = config.groqModel || process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

    // Check if configuration is missing/placeholder
    if (!apiKey || apiKey.includes('your_groq_api_key_here')) {
        throw new Error("Groq API key is missing or invalid. Please provide a valid Groq API key in the configuration or set the GROQ_API_KEY environment variable.");
    }

    const systemPrompt = `You are a Principal Quality Assurance Architect with 10+ years of experience.
Your goal is to output a comprehensive, production-grade Test Strategy document in JSON format.
The test strategy MUST strictly mirror the structure of this reference document text:
---
Test Strategy for Ecommerce Website
Objective: The objective is to test the end-to-end functionality...
Scope:
In scope: All customer workflows...
Out of scope: Physical fulfillment...
Focus Areas: Functional correctness, UI, Performance, Security, Compatibility, Usability...
Approach: Black box, Selenium, JMeter for 1000 users, OWASP...
Deliverables: Test cases, Performance scripts, Security reports...
Team & Schedule: Team of 5 members, April-July schedule...
Entry & Exit Criteria: Ready for testing, zero critical defects...
Risks: Delay in test environment...
---

Based on the provided JIRA Issue summary and description, generate a detailed and highly contextualized Test Strategy JSON payload.
You MUST follow the JSON schema below precisely. Provide rich, highly specific details matching the JIRA issue content.

JSON Schema:
{
  "title": "Test Strategy for [JIRA Summary]",
  "objective": "Detailed objective statement based on the JIRA issue.",
  "scope": {
    "inScope": ["detailed item 1", "detailed item 2", ...],
    "outOfScope": ["detailed item 1", "detailed item 2", ...]
  },
  "focusAreas": [
    { "area": "Functional correctness of flows", "details": "contextual details..." },
    { "area": "UI/navigation", "details": "contextual details..." },
    { "area": "Performance", "details": "contextual details (e.g. concurrent user load levels matching issue scale)..." },
    { "area": "Security", "details": "contextual details (encryption, PCI-DSS, OWASP if applicable)..." },
    { "area": "Compatibility", "details": "contextual details (browsers and mobile check details)..." },
    { "area": "Usability", "details": "contextual details (ease of use, accessibility)..." }
  ],
  "approach": ["methodology 1", "methodology 2", ...],
  "deliverables": ["deliverable 1", "deliverable 2", ...],
  "teamAndSchedule": {
    "teamSize": "suggested team size",
    "duration": "suggested duration",
    "schedule": ["phase/timeline 1", "phase/timeline 2", ...]
  },
  "entryAndExitCriteria": {
    "entry": "conditions required to start testing this JIRA issue",
    "exit": "conditions required to sign off testing this JIRA issue"
  },
  "risks": ["risk 1", "risk 2", ...]
}

Do not include any extra introductory or concluding text. Respond ONLY with the JSON object.`;

    const userPrompt = `JIRA Issue ID: ${issueData.key}
JIRA Summary: ${issueData.summary}
JIRA Description:
${issueData.description}`;

    console.log("Calling Groq API...");
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            response_format: { type: "json_object" },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.1
        })
    });

    if (!response.ok) {
        throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const strategyJsonText = result.choices[0].message.content;

    try {
        return JSON.parse(strategyJsonText);
    } catch (e) {
        console.error("Failed to parse JSON response from Groq:", strategyJsonText);
        throw new Error("Invalid JSON returned by Groq LLM.");
    }
}

// Support running directly from command line
if (require.main === module) {
    const dummyIssue = {
        key: "TEST-123",
        summary: "Shopping Cart Checkout Functionality",
        description: "Allow users to add items, go to cart, enter details, pay, and see receipt."
    };
    generateTestStrategy(dummyIssue).then(strategy => {
        console.log("Generated Strategy Payload:");
        console.log(JSON.stringify(strategy, null, 2));
    }).catch(err => {
        console.error("LLM Generation Error:", err.message);
        process.exit(1);
    });
}

module.exports = { generateTestStrategy };
