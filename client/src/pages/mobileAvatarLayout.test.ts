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

  it('keeps avatar actions reachable in a touch-scroll page', () => {
    const avatarPage = readRelativeFile('./AvatarSelectPage.tsx');
    const globalCss = readRelativeFile('../index.css');

    expect(avatarPage).toContain('avatar-page-scroll');
    expect(avatarPage).toContain('min-h-0');
    expect(avatarPage).toContain('touch-pan-y');
    expect(avatarPage).toContain('sticky bottom-0');
    expect(avatarPage).toContain('md:static');
    expect(avatarPage).toContain('env(safe-area-inset-bottom)');
    expect(globalCss).toContain('-webkit-overflow-scrolling: touch');
  });
});
