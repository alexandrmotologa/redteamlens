import { describe, it, expect } from 'vitest';
import { loadAllProbes, getFilteredProbes } from '../../src/core/attacks/corpus-loader.js';

describe('Attack Corpus Loader', () => {
  it('should load over 200 attack probes from the corpus', () => {
    const probes = loadAllProbes();
    expect(probes.length).toBeGreaterThanOrEqual(200);
  });

  it('should have valid schema for every probe', () => {
    const probes = loadAllProbes();
    for (const p of probes) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(['LLM01_PROMPT_INJECTION', 'LLM02_SENSITIVE_DISCLOSURE', 'LLM06_EXCESSIVE_AGENCY', 'LLM07_SYSTEM_PROMPT_LEAK', 'LLM08_INDIRECT_INJECTION']).toContain(p.category);
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(p.severity);
      expect(p.promptPayload).toBeTruthy();
      expect(Array.isArray(p.expectedRefusalMarkers)).toBe(true);
      expect(Array.isArray(p.vulnerabilitySignatures)).toBe(true);
      expect(p.description).toBeTruthy();
      expect(p.remediationAdvice).toBeTruthy();
    }
  });

  it('should support filtering by category', () => {
    const filtered = getFilteredProbes({ categories: ['LLM01_PROMPT_INJECTION'] });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every(p => p.category === 'LLM01_PROMPT_INJECTION')).toBe(true);
  });

  it('should support filtering by severity', () => {
    const filtered = getFilteredProbes({ severities: ['CRITICAL'] });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every(p => p.severity === 'CRITICAL')).toBe(true);
  });
});
