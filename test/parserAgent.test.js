import { describe, it, expect } from 'vitest';
import { parseGitDiff } from '../agents/parserAgent.js';

describe('parserAgent', () => {
  it('deve extrair corretamente arquivos e conte�do do git diff', async () => {
    const diff = `