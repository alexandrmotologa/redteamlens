export class SarifReportGenerator {
    static generate(report) {
        const rulesMap = new Map();
        const results = [];
        for (const finding of report.findings) {
            if (!finding.isVulnerable)
                continue;
            if (!rulesMap.has(finding.probeId)) {
                rulesMap.set(finding.probeId, {
                    id: finding.probeId,
                    name: finding.probeName,
                    shortDescription: {
                        text: `Vulnerability: ${finding.probeName} (${finding.category})`
                    },
                    fullDescription: {
                        text: `Adversarial probe elicited a security violation against OWASP category ${finding.category}. Matched signatures: ${finding.matchedSignatures.join(', ') || 'compliance breach'}.`
                    },
                    helpUri: `https://owasp.org/www-project-top-10-for-large-language-model-applications/`,
                    properties: {
                        category: finding.category,
                        precision: 'high',
                        problem: {
                            severity: finding.severity === 'CRITICAL' ? 'error' : finding.severity === 'HIGH' ? 'error' : 'warning'
                        }
                    }
                });
            }
            results.push({
                ruleId: finding.probeId,
                level: finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'error' : 'warning',
                message: {
                    text: `[${finding.severity}] Target yielded to ${finding.probeName}. Remediation: ${finding.remediation}`
                },
                locations: [
                    {
                        physicalLocation: {
                            artifactLocation: { uri: report.targetUrl },
                            region: { startLine: 1 }
                        }
                    }
                ],
                properties: {
                    matchedSignatures: finding.matchedSignatures,
                    remediationAdvice: finding.remediation,
                    promptSent: finding.promptSent.slice(0, 500),
                    responseReceived: finding.responseReceived.slice(0, 500)
                }
            });
        }
        const sarifLog = {
            $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
            version: '2.1.0',
            runs: [
                {
                    tool: {
                        driver: {
                            name: 'RedTeamLens',
                            version: '1.0.0',
                            informationUri: 'https://github.com/alexandrmotologa/redteamlens',
                            rules: Array.from(rulesMap.values())
                        }
                    },
                    results
                }
            ]
        };
        return JSON.stringify(sarifLog, null, 2);
    }
}
//# sourceMappingURL=sarif-generator.js.map