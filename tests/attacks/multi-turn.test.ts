import { describe, it, expect } from 'vitest';
import { MultiTurnRunner } from '../../src/core/multi-turn-runner.js';
import { MockAgentTarget } from '../../src/core/targets/mock-agent.js';
import { MULTI_TURN_CHAINS } from '../../src/core/attacks/multi-turn-corpus.js';

describe('Multi-Turn Conversational Attack Chains', () => {
  it('should load predefined multi-turn crescendo chains', () => {
    expect(MULTI_TURN_CHAINS.length).toBeGreaterThanOrEqual(4);
    for (const chain of MULTI_TURN_CHAINS) {
      expect(chain.id).toBeTruthy();
      expect(chain.turns.length).toBeGreaterThanOrEqual(2);
      expect(chain.vulnerabilitySignatures.length).toBeGreaterThan(0);
    }
  });

  it('should execute multi-turn chain against vulnerable simulator', async () => {
    const target = new MockAgentTarget({ hardened: false });
    const runner = new MultiTurnRunner(target, [MULTI_TURN_CHAINS[0]]);

    const findings = await runner.runChains();
    expect(findings).toHaveLength(1);
    expect(findings[0].probeId).toBe(MULTI_TURN_CHAINS[0].id);
    expect(findings[0].isVulnerable).toBe(true);
    expect(findings[0].responseReceived).toContain('[CRESCENDO_BYPASS_VERIFIED]');
  });

  it('should be blocked by hardened simulator', async () => {
    const target = new MockAgentTarget({ hardened: true });
    const runner = new MultiTurnRunner(target, [MULTI_TURN_CHAINS[0]]);

    const findings = await runner.runChains();
    expect(findings).toHaveLength(1);
    expect(findings[0].isVulnerable).toBe(false);
    expect(findings[0].responseReceived).toContain('cannot fulfill');
  });
});
