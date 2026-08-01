# Mobile Avatar Selection Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the avatar selection page scroll correctly on mobile browsers and keep its room-selection actions visible above Safari's browser chrome and device safe area.

**Architecture:** Keep the document-level overflow lock required by the 3D game. Size the React application root with dynamic viewport units, then make `AvatarSelectPage` the bounded scroll owner and use a mobile-only sticky action footer with safe-area padding. A focused Vitest source regression protects the viewport and layout contract without introducing a DOM testing dependency.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3.4, Vitest, Vite

## Global Constraints

- Preserve document-level overflow locking for the 3D concert scene.
- Preserve the existing desktop avatar-selection composition at the `md` breakpoint and above.
- Preserve touch rotation inside the avatar preview.
- Support iPhone Safari dynamic browser chrome, Android Chrome, safe-area insets, and short landscape viewports.
- Add no new runtime or test dependencies.

---

### Task 1: Dynamic Application Viewport

**Files:**
- Create: `client/src/pages/mobileAvatarLayout.test.ts`
- Modify: `client/index.html`
- Modify: `client/src/index.css`

**Interfaces:**
- Consumes: the existing `#root` application mount element.
- Produces: a root viewport contract with `100vh` fallback followed by `100dvh`, while keeping the document locked.

- [ ] **Step 1: Write the failing viewport regression test**

Create `client/src/pages/mobileAvatarLayout.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test --prefix client -- src/pages/mobileAvatarLayout.test.ts
```

Expected: FAIL because `client/index.html` still contains `h-screen` and `client/src/index.css` does not define the dynamic viewport heights.

- [ ] **Step 3: Move viewport sizing into global CSS**

In `client/index.html`, replace:

```html
<div id="root" class="w-screen h-screen"></div>
```

with:

```html
<div id="root"></div>
```

In the existing `@layer base` block in `client/src/index.css`, use:

```css
@layer base {
  html,
  body,
  #root {
    width: 100%;
    height: 100%;
  }

  #root {
    height: 100vh;
    height: 100dvh;
  }

  body {
    @apply bg-slate-950 text-white antialiased overflow-hidden select-none;
  }
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
npm test --prefix client -- src/pages/mobileAvatarLayout.test.ts
```

Expected: 1 test passes.

- [ ] **Step 5: Commit the viewport contract**

```bash
git add client/index.html client/src/index.css client/src/pages/mobileAvatarLayout.test.ts
git commit -m "fix: use dynamic mobile viewport height"
```

---

### Task 2: Scrollable Avatar Page and Sticky Safe-Area Actions

**Files:**
- Modify: `client/src/pages/mobileAvatarLayout.test.ts`
- Modify: `client/src/pages/AvatarSelectPage.tsx`
- Modify: `client/src/index.css`

**Interfaces:**
- Consumes: the bounded `#root` viewport from Task 1 and the existing `setPageStep('landing' | 'lobby')` handlers.
- Produces: a mobile page scroll owner and a sticky action footer; no component API changes.

- [ ] **Step 1: Extend the regression test for scrolling and safe-area actions**

Add this test inside the existing `describe` block:

```ts
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test --prefix client -- src/pages/mobileAvatarLayout.test.ts
```

Expected: the viewport test passes and the new touch-scroll test fails because the page has no sticky safe-area footer contract.

- [ ] **Step 3: Make the avatar page the explicit scroll owner**

Replace the outer page classes in `client/src/pages/AvatarSelectPage.tsx` with:

```tsx
<div className="avatar-page-scroll relative w-full h-full min-h-0 flex flex-col items-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-y-auto overscroll-y-contain touch-pan-y">
```

Update the top bar to remain non-shrinking, centered, and safe below the top inset:

```tsx
<div className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 shrink-0 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-8">
```

Update the main grid so it creates real overflow on mobile while retaining the desktop layout:

```tsx
<div className="z-10 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-4 px-4 sm:px-8 shrink-0 md:flex-1">
```

Add this utility outside `@layer base` in `client/src/index.css`:

```css
.avatar-page-scroll {
  -webkit-overflow-scrolling: touch;
}
```

- [ ] **Step 4: Wrap the existing bottom buttons in a sticky safe-area footer**

Replace the current bottom-actions container with this structure, keeping both existing click handlers:

```tsx
<div className="sticky bottom-0 z-20 w-full shrink-0 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 md:static md:bg-transparent md:backdrop-blur-none md:pt-4 md:pb-8">
  <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
    <button
      onClick={() => setPageStep('landing')}
      aria-label="Back"
      className="shrink-0 flex items-center justify-center gap-2 p-3 sm:px-6 sm:py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-semibold border border-white/10 transition-all"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="hidden sm:inline">Back</span>
    </button>

    <button
      onClick={() => setPageStep('lobby')}
      className="min-w-0 flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-neon-pink to-purple-600 hover:from-neon-pink/90 hover:to-purple-500 text-sm sm:text-base text-white font-bold shadow-lg shadow-neon-pink/25 transform hover:scale-[1.02] active:scale-95 transition-all"
    >
      <span className="truncate">Choose Concert Room</span>
      <ArrowRight className="w-4 h-4 shrink-0" />
    </button>
  </div>
</div>
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```bash
npm test --prefix client -- src/pages/mobileAvatarLayout.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 6: Run full client verification**

Run:

```bash
npm test --prefix client
npm run typecheck --prefix client
npm run build --prefix client
```

Expected: all client tests pass, TypeScript exits 0, and Vite completes the production build. The existing bundle-size warning is acceptable and unrelated.

- [ ] **Step 7: Inspect responsive behavior**

Start the local app and inspect the avatar page at `390x844` and a desktop width of at least `1280px`:

```bash
npm run dev
```

At `390x844`, confirm the avatar list scrolls, the sticky footer remains above the bottom safe area, both buttons can be tapped, and dragging inside the preview still rotates it. At desktop width, confirm the existing two-column layout and static footer remain unchanged.

- [ ] **Step 8: Commit the mobile avatar fix**

```bash
git add client/src/pages/AvatarSelectPage.tsx client/src/index.css client/src/pages/mobileAvatarLayout.test.ts
git commit -m "fix: keep avatar room actions reachable on mobile"
```
