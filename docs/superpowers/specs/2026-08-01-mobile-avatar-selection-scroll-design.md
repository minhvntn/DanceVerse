# Mobile Avatar Selection Scroll Design

## Problem

On iPhone Safari, the avatar selection page uses a fixed `100vh` application root while Safari's browser chrome reduces the visible viewport. The page believes the bottom actions are visible even though the browser toolbar covers them. The user reaches the end of the internal scroll area and cannot access **Choose Concert Room**.

The current global `body` overflow lock is intentional for the 3D game, so the avatar selection page must own its scrolling behavior without enabling document-level scrolling across the application.

## Desired Behavior

- The avatar selection page fits the currently visible mobile viewport, including when Safari's address bar expands or collapses.
- The avatar list scrolls vertically with normal touch gestures on iPhone Safari and Android Chrome.
- **Back** and **Choose Concert Room** remain reachable at all times in a sticky bottom action bar.
- The action bar stays above the iPhone home indicator and browser safe area.
- Desktop layout and the 3D game viewport remain unchanged.
- Dragging the avatar preview continues to rotate the preview.

## Design

### Application viewport

Change the application root from a fixed `100vh` height to dynamic viewport height (`100dvh`) with `100vh` as a CSS fallback. This corrects the root size when mobile browser chrome changes the visible area while retaining compatibility with older browsers.

### Avatar page scrolling

Keep document scrolling disabled globally. Make `AvatarSelectPage` the explicit scroll owner with:

- a bounded full-height flex container;
- `min-height: 0` so the flex child is allowed to scroll;
- vertical touch panning and momentum scrolling;
- non-shrinking content sections so overflow is real and scrollable.

The 3D preview remains interactive. The page scroll is expected to begin outside the preview; touch gestures that begin on the preview continue to rotate it.

### Sticky actions and safe area

Place the existing bottom actions in a sticky footer inside the avatar page scroll container. Give the footer an opaque/blurred concert-themed background, a top border, and bottom padding equal to the larger of the regular spacing or `env(safe-area-inset-bottom)`. Add matching content spacing so the last avatar row cannot be hidden behind the footer.

On desktop, the footer returns to the existing static presentation so the current composition is preserved.

## Error and Edge Handling

- Browsers without dynamic viewport support use the `100vh` fallback.
- Devices without a safe-area inset resolve the inset to zero and keep the normal padding.
- Very short landscape screens remain scrollable instead of compressing or clipping controls.
- Global overflow remains locked, preventing accidental scrolling in the 3D concert scene.

## Verification

- Add a small static regression check for the required mobile viewport and scroll classes/styles.
- Run the client test suite, TypeScript check, and production build.
- Inspect the avatar page at an iPhone-sized viewport and confirm:
  - vertical scrolling reaches the final avatar row;
  - the bottom action bar remains visible;
  - **Choose Concert Room** can be tapped;
  - desktop layout is unchanged at the `md` breakpoint and above.
