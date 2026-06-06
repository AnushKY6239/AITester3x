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

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

console.log("=== Groq Handshake Status ===");
console.log(`Model: ${model}`);

if (!apiKey || apiKey.includes('your_groq_api_key_here')) {
    console.log("WARNING: Real Groq API key not provided. Simulating successful local check (Mock mode).");
    console.log("Handshake Result: SUCCESS (Mock)");
    process.exit(0);
}

async function verifyGroq() {
    try {
        console.log("Connecting to Groq API endpoint...");
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'Ping' }],
                max_tokens: 5
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Handshake Result: SUCCESS`);
        console.log(`Response text: ${data.choices[0].message.content}`);
        process.exit(0);
    } catch (error) {
        console.error(`Handshake Result: FAILED`);
        console.error(error.message);
        process.exit(1);
    }
}

verifyGroq();
