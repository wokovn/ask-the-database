import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../../src/prompts/systemPrompt.js';
import { buildRetryPrompt } from '../../src/prompts/retryPrompt.js';

describe('Prompt Construction Modules', () => {
  it('buildSystemPrompt should include critical business rules and schema', () => {
    const dummySchema = 'TABLE test_table (id INT);';
    const prompt = buildSystemPrompt({ schemaDescription: dummySchema });

    expect(prompt).toContain(dummySchema);
    expect(prompt).toContain("status = 'paid'");
    expect(prompt).toContain('VND');
    expect(prompt).toContain('READ-ONLY');
    expect(prompt).toContain('"reasoning"');
    expect(prompt).toContain('"answer"');
    expect(prompt).toContain('"sql"');
  });

  it('buildRetryPrompt should format error message and query accurately', () => {
    const prompt = buildRetryPrompt({
      originalQuestion: 'Top customers',
      failedSql: 'SELECT invalid_col FROM customers',
      errorMessage: 'column "invalid_col" does not exist',
      attemptNumber: 1,
      maxAttempts: 3,
    });

    expect(prompt).toContain('Top customers');
    expect(prompt).toContain('SELECT invalid_col FROM customers');
    expect(prompt).toContain('column "invalid_col" does not exist');
    expect(prompt).toContain('1 of 3');
  });
});
