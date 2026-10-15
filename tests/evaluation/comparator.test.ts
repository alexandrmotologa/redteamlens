import { describe, it, expect } from 'vitest';
import { AuditComparator } from '../../src/core/evaluation/comparator.js';
import { SecurityAuditReport, ScanFinding } from '../../src/core/evaluation/scoring.js';

describe('Audit Comparator & Regression Tracker', () => {
  const dummyFinding = (probeId: string, isVulnerable: boolean, severity: any = 'HIGH'): ScanFinding => ({
    probeId,
    probeName: `Probe ${probeId}`,
    category: 'LLM01_PROMPT_INJECTION',
    severity,
    promptSent: 'test payload',
    responseReceived: isVulnerable ? 'override success' : 'refusal',
    latencyMs: 120,
    isVulnerable,
    confidenceScore: 1.0,
    matchedSignatures: isVulnerable ? ['override'] : [],
    remediation: 'Remediation details'
  });

  const baselineReport: SecurityAuditReport = {
    targetUrl: 'http://localhost:4000/v1/chat',
    targetType: 'MockAgentTarget',
    scannedAt: Date.now(),
    durationMs: 1500,
    totalProbesRun: 3,
    passedProbes: 1,
    vulnerabilitiesFound: 2,
    complianceScore: 60,
    letterGrade: 'D',
    findings: [
      dummyFinding('probe-1', true),  // vulnerable in baseline
      dummyFinding('probe-2', true),  // vulnerable in baseline
      dummyFinding('probe-3', false)  // defended in baseline
    ],
    categoryBreakdown: {} as any,
    severityBreakdown: { critical: 0, high: 2, medium: 0, low: 0 },
    recommendedHardening: []
  };

  it('should identify resolved vulnerabilities and score improvement', () => {
    const comparisonReport: SecurityAuditReport = {
      targetUrl: 'http://localhost:4000/v1/chat',
      targetType: 'MockAgentTarget',
      scannedAt: Date.now(),
      durationMs: 1200,
      totalProbesRun: 3,
      passedProbes: 3,
      vulnerabilitiesFound: 0,
      complianceScore: 100,
      letterGrade: 'A',
      findings: [
        dummyFinding('probe-1', false), // resolved!
        dummyFinding('probe-2', false), // resolved!
        dummyFinding('probe-3', false)  // stayed defended
      ],
      categoryBreakdown: {} as any,
      severityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
      recommendedHardening: []
    };

    const diff = AuditComparator.compare(baselineReport, comparisonReport);

    expect(diff.scoreDelta).toBe(40);
    expect(diff.gradeImproved).toBe(true);
    expect(diff.isRegressed).toBe(false);
    expect(diff.resolvedVulnerabilities.length).toBe(2);
    expect(diff.newRegressions.length).toBe(0);
    expect(diff.persistingVulnerabilities.length).toBe(0);

    const md = AuditComparator.toMarkdown(diff);
    expect(md).toContain('Score');
    expect(md).toContain('60%');
    expect(md).toContain('100%');
    expect(md).toContain('Successfully Remediated Vulnerabilities');
  });

  it('should detect new security regressions', () => {
    const regressionReport: SecurityAuditReport = {
      targetUrl: 'http://localhost:4000/v1/chat',
      targetType: 'MockAgentTarget',
      scannedAt: Date.now(),
      durationMs: 1600,
      totalProbesRun: 3,
      passedProbes: 0,
      vulnerabilitiesFound: 3,
      complianceScore: 40,
      letterGrade: 'F',
      findings: [
        dummyFinding('probe-1', true), // still vulnerable
        dummyFinding('probe-2', true), // still vulnerable
        dummyFinding('probe-3', true)  // was defended, now broken!
      ],
      categoryBreakdown: {} as any,
      severityBreakdown: { critical: 0, high: 3, medium: 0, low: 0 },
      recommendedHardening: []
    };

    const diff = AuditComparator.compare(baselineReport, regressionReport);

    expect(diff.scoreDelta).toBe(-20);
    expect(diff.gradeRegressed).toBe(true);
    expect(diff.isRegressed).toBe(true);
    expect(diff.resolvedVulnerabilities.length).toBe(0);
    expect(diff.newRegressions.length).toBe(1);
    expect(diff.newRegressions[0].probeId).toBe('probe-3');
    expect(diff.persistingVulnerabilities.length).toBe(2);

    const md = AuditComparator.toMarkdown(diff);
    expect(md).toContain('Security Regressions');
    expect(md).toContain('probe-3');
  });
});
