const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ListLevel } = require('docx');

function createDocxDocument(strategyData) {
    const children = [];

    // Helper for Headings
    const addHeading1 = (text) => {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: text,
                        bold: true,
                        size: 28, // 14pt
                        color: "1e293b",
                        font: "Arial"
                    })
                ],
                spacing: { before: 300, after: 120 }
            })
        );
    };

    const addHeading2 = (text) => {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: text,
                        bold: true,
                        size: 24, // 12pt
                        color: "334155",
                        font: "Arial"
                    })
                ],
                spacing: { before: 180, after: 80 }
            })
        );
    };

    // Helper for Body Paragraphs
    const addBodyText = (text) => {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: text,
                        size: 22, // 11pt
                        color: "475569",
                        font: "Calibri"
                    })
                ],
                spacing: { after: 120 },
                lineSpacing: { value: 276, rule: "auto" } // 1.15 line height
            })
        );
    };

    // Helper for Bullets
    const addBullet = (text) => {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: text,
                        size: 22,
                        color: "475569",
                        font: "Calibri"
                    })
                ],
                bullet: {
                    level: 0
                },
                spacing: { after: 60 }
            })
        );
    };

    // 1. Document Title
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: strategyData.title || "Test Strategy Document",
                    bold: true,
                    size: 44, // 22pt
                    color: "0f172a",
                    font: "Arial"
                })
            ],
            spacing: { before: 200, after: 400 }
        })
    );

    // 2. Objective
    addHeading1("Objective");
    addBodyText(strategyData.objective || "No objective defined.");

    // 3. Scope
    addHeading1("Scope");
    if (strategyData.scope) {
        if (strategyData.scope.inScope && strategyData.scope.inScope.length > 0) {
            addHeading2("In scope:");
            strategyData.scope.inScope.forEach(item => addBullet(item));
        }
        if (strategyData.scope.outOfScope && strategyData.scope.outOfScope.length > 0) {
            addHeading2("Out of scope:");
            strategyData.scope.outOfScope.forEach(item => addBullet(item));
        }
    }

    // 4. Focus Areas
    addHeading1("Focus Areas");
    if (strategyData.focusAreas && strategyData.focusAreas.length > 0) {
        strategyData.focusAreas.forEach(areaObj => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `- ${areaObj.area}: `,
                            bold: true,
                            size: 22,
                            color: "334155",
                            font: "Calibri"
                        }),
                        new TextRun({
                            text: areaObj.details,
                            size: 22,
                            color: "475569",
                            font: "Calibri"
                        })
                    ],
                    spacing: { after: 80 }
                })
            );
        });
    }

    // 5. Approach
    addHeading1("Approach");
    if (strategyData.approach && strategyData.approach.length > 0) {
        strategyData.approach.forEach(item => addBullet(item));
    }

    // 6. Deliverables
    addHeading1("Deliverables");
    if (strategyData.deliverables && strategyData.deliverables.length > 0) {
        strategyData.deliverables.forEach(item => addBullet(item));
    }

    // 7. Team & Schedule
    addHeading1("Team & Schedule");
    if (strategyData.teamAndSchedule) {
        const sizeText = strategyData.teamAndSchedule.teamSize ? `Testing team of ${strategyData.teamAndSchedule.teamSize} needed.` : "";
        const durationText = strategyData.teamAndSchedule.duration ? ` Sizing / effort: ${strategyData.teamAndSchedule.duration}.` : "";
        if (sizeText || durationText) {
            addBodyText(`${sizeText}${durationText}`);
        }
        if (strategyData.teamAndSchedule.schedule && strategyData.teamAndSchedule.schedule.length > 0) {
            addHeading2("Proposed schedule:");
            strategyData.teamAndSchedule.schedule.forEach(item => addBullet(item));
        }
    }

    // 8. Entry & Exit Criteria
    addHeading1("Entry & Exit Criteria");
    if (strategyData.entryAndExitCriteria) {
        if (strategyData.entryAndExitCriteria.entry) {
            addBodyText(strategyData.entryAndExitCriteria.entry);
        }
        if (strategyData.entryAndExitCriteria.exit) {
            addBodyText(strategyData.entryAndExitCriteria.exit);
        }
    }

    // 9. Risks
    addHeading1("Risks");
    if (strategyData.risks && strategyData.risks.length > 0) {
        strategyData.risks.forEach(item => addBullet(item));
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });

    return doc;
}

async function exportDocxBuffer(strategyData) {
    const doc = createDocxDocument(strategyData);
    const buffer = await Packer.toBuffer(doc);
    return buffer;
}

// Direct execution test
if (require.main === module) {
    const dummyData = {
        title: "Test Strategy for Local Dev Integration",
        objective: "Test the local Word generation tools functionality.",
        scope: {
            inScope: ["Verify formatting", "Validate text alignment"],
            outOfScope: ["External deployment testing"]
        },
        focusAreas: [
            { area: "Functional", details: "Generate file buffer and write to disk." }
        ],
        approach: ["Local testing script runner"],
        deliverables: ["Test strategy file output on disk"],
        teamAndSchedule: {
            teamSize: "1 Dev",
            duration: "1 hour",
            schedule: ["Phase 1: Run build_docx script"]
        },
        entryAndExitCriteria: {
            entry: "Node environment is active.",
            exit: "A .docx file is successfully created in the local folder."
        },
        risks: ["Disk permission blocker"]
    };

    const outPath = path.join(__dirname, '..', '.tmp', 'test_strategy.docx');
    
    // Ensure .tmp/ exists
    const tmpDir = path.dirname(outPath);
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }

    exportDocxBuffer(dummyData).then(buffer => {
        fs.writeFileSync(outPath, buffer);
        console.log(`Successfully generated test strategy document at: ${outPath}`);
    }).catch(err => {
        console.error("Docx creation failed:", err);
        process.exit(1);
    });
}

module.exports = { exportDocxBuffer };
