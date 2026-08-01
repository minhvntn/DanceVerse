import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readRelativeFile = (relativeUrl: string) =>
  readFileSync(fileURLToPath(new URL(relativeUrl, import.meta.url)), 'utf8');

describe('mobile avatar layout contract', () => {
  it('sizes the application root with the dynamic mobile viewport', () => {
    const indexHtml = readRelativeFile('../../index.html');
    const globalCss = readRelativeFile('../index.css');

    expect(indexHtml).not.toContain('h-screen');
    expect(globalCss).toContain('height: 100vh');
    expect(globalCss).toContain('height: 100dvh');
    expect(globalCss).toContain('overflow-hidden');
  });
});
