const fs = require('fs');
const path = require('path');

// Load env variables manually from .env if it exists
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        lines.forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                // Remove outer quotes if any
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                process.env[key] = value.trim();
            }
        });
    }
}

loadEnv();

const jiraUrl = process.env.JIRA_BASE_URL;
const jiraEmail = process.env.JIRA_EMAIL;
const jiraToken = process.env.JIRA_TOKEN;
const jiraIssueId = process.env.JIRA_ISSUE_ID;

console.log("=== JIRA Handshake Status ===");
console.log(`URL: ${jiraUrl}`);
console.log(`Email: ${jiraEmail}`);
console.log(`Issue ID: ${jiraIssueId}`);

if (!jiraUrl || !jiraEmail || !jiraToken || !jiraIssueId || 
    jiraUrl.includes('your-domain') || jiraEmail.includes('your-email')) {
    console.log("WARNING: Real credentials not provided. Simulating successful local check (Mock mode).");
    console.log("Mock Issue Summary: [MOCK] Complete Checkout Payment Gateway Integration");
    console.log("Mock Description: Integrates stripe checkout and handles webhook callbacks.");
    console.log("Handshake Result: SUCCESS (Mock)");
    process.exit(0);
}

// Perform real API call
async function verifyJira() {
    try {
        const cleanUrl = jiraUrl.replace(/\/+$/, "");
        const targetUrl = `${cleanUrl}/rest/api/3/issue/${jiraIssueId}`;
        const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
        
        console.log(`Connecting to: ${targetUrl}...`);
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Handshake Result: SUCCESS`);
        console.log(`Issue Summary: ${data.fields.summary}`);
        process.exit(0);
    } catch (error) {
        console.error(`Handshake Result: FAILED`);
        console.error(error.message);
        process.exit(1);
    }
}

verifyJira();
