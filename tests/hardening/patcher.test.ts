import { describe, it, expect } from 'vitest';
import { PromptPatcher } from '../../src/core/hardening/patcher.js';

describe('Prompt Hardening Auto-Patcher', () => {
  it('should inject security boundaries and canary token', () => {
    const raw = 'You are a helpful customer support bot for our store.';
    const result = PromptPatcher.patch(raw);

    expect(result.originalPrompt).toBe(raw);
    expect(result.canaryToken).toMatch(/^CANARY_[A-F0-9]{12}$/);
    expect(result.hardenedPrompt).toContain('<security_boundary');
    expect(result.hardenedPrompt).toContain(result.canaryToken);
    expect(result.hardenedPrompt).toContain('You are a helpful customer support bot for our store.');
    expect(result.patchesApplied.length).toBeGreaterThanOrEqual(4);
  });

  it('should accept custom canary token', () => {
    const raw = 'Assistant instructions.';
    const result = PromptPatcher.patch(raw, { canaryToken: 'CUSTOM_CANARY_TEST_123' });

    expect(result.canaryToken).toBe('CUSTOM_CANARY_TEST_123');
    expect(result.hardenedPrompt).toContain('CUSTOM_CANARY_TEST_123');
  });

  it('should respect feature toggle options', () => {
    const raw = 'Assistant instructions.';
    const result = PromptPatcher.patch(raw, {
      enforceXmlBoundaries: false,
      enableAntiLeak: false
    });

    expect(result.hardenedPrompt).not.toContain('<security_boundary');
    expect(result.hardenedPrompt).not.toContain('<nondisclosure_policy>');
    expect(result.hardenedPrompt).toContain('<adversarial_defense>');
  });
});
