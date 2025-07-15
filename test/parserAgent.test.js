import { describe, it, expect } from 'vitest';
import { parseGitDiff } from '../agents/parserAgent.js';

describe('parserAgent', () => {
  it('deve extrair corretamente arquivos e conteúdo do git diff', async () => {
    const diff = `