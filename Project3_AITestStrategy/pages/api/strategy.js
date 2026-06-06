const { fetchJiraIssue } = require('../../tools/fetch_jira');
const { generateTestStrategy } = require('../../tools/generate_strategy');
const { exportDocxBuffer } = require('../../tools/build_docx');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, config, issueData, strategyData } = req.body;

    if (!action) {
        return res.status(400).json({ error: 'Missing action parameter' });
    }

    try {
        switch (action) {
            case 'fetch-issue': {
                const fetched = await fetchJiraIssue(config);
                return res.status(200).json(fetched);
            }
            case 'generate-strategy': {
                if (!issueData) {
                    return res.status(400).json({ error: 'Missing issueData parameter' });
                }
                const strategy = await generateTestStrategy(issueData, config);
                return res.status(200).json(strategy);
            }
            case 'download-docx': {
                if (!strategyData) {
                    return res.status(400).json({ error: 'Missing strategyData parameter' });
                }
                const buffer = await exportDocxBuffer(strategyData);
                
                // Set headers for download
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', 'attachment; filename=test_strategy.docx');
                return res.status(200).send(buffer);
            }
            default:
                return res.status(400).json({ error: `Invalid action: ${action}` });
        }
    } catch (error) {
        console.error("API error:", error);
        return res.status(500).json({ error: error.message || 'An internal error occurred.' });
    }
}
