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

// Function to recursively extract text from Atlassian Document Format (ADF) description
function parseADF(node) {
    if (!node) return "";
    if (node.type === 'text') {
        return node.text || "";
    }
    let text = "";
    if (node.content && Array.isArray(node.content)) {
        node.content.forEach(child => {
            text += parseADF(child);
        });
    }
    // Add spacing for structural elements
    if (node.type === 'paragraph') {
        text += "\n";
    } else if (node.type === 'listItem') {
        text = "- " + text + "\n";
    } else if (node.type === 'heading') {
        text = "\n" + text + "\n";
    }
    return text;
}

async function fetchJiraIssue(config = {}) {
    const jiraUrl = config.jiraUrl || process.env.JIRA_BASE_URL;
    const jiraEmail = config.jiraEmail || process.env.JIRA_EMAIL;
    const jiraToken = config.jiraToken || process.env.JIRA_TOKEN;
    const jiraIssueId = config.jiraIssueId || process.env.JIRA_ISSUE_ID;

    // Check if configuration is missing/placeholder
    if (!jiraUrl || !jiraEmail || !jiraToken || !jiraIssueId || 
        jiraUrl.includes('your-domain') || jiraEmail.includes('your-email')) {
        console.warn("WARNING: JIRA config incomplete. Returning mock issue details.");
        return {
            key: jiraIssueId || "MOCK-101",
            summary: "Implement Ecommerce Checkout with Stripe and UPI",
            description: "Objective: Users should be able to check out their shopping cart securely using either credit/debit card (Stripe) or UPI (Google Pay, PhonePe).\n\nAcceptance Criteria:\n1. User clicks 'Pay Now' and sees checkout modal.\n2. User can enter credit card details. Validate input formatting and errors.\n3. User can choose UPI option, scanning a QR code or entering a VPA.\n4. Ensure integration with webhooks works, creating order state 'paid' in backend.\n5. Handle failure scenarios (e.g. card declined, transaction timeout).\n6. Desktop and mobile responsiveness for checkout layout.",
            project: "E-Commerce Suite"
        };
    }

    const cleanUrl = jiraUrl.replace(/\/+$/, "");
    const targetUrl = `${cleanUrl}/rest/api/3/issue/${jiraIssueId}`;
    const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
    
    const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`JIRA API Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    let descriptionText = "";
    const rawDesc = data.fields.description;
    if (typeof rawDesc === 'string') {
        descriptionText = rawDesc;
    } else if (rawDesc && typeof rawDesc === 'object') {
        descriptionText = parseADF(rawDesc);
    }
    
    return {
        key: data.key,
        summary: data.fields.summary || "No Summary",
        description: descriptionText.trim() || "No Description",
        project: data.fields.project ? data.fields.project.name : "N/A"
    };
}

// Support running directly from command line
if (require.main === module) {
    fetchJiraIssue().then(issue => {
        console.log("Fetched Issue Details:");
        console.log(JSON.stringify(issue, null, 2));
    }).catch(err => {
        console.error("Fetch JIRA Error:", err.message);
        process.exit(1);
    });
}

module.exports = { fetchJiraIssue };
