# 0014 - Hi-fi design applied to review-session

**Date**: 2026-10-01
**Module**: review-session
**Status**: Accepted

## Context
The module was a neutral lo-fi. `docs/DESIGN.md` defined the visual direction (product register, plum seed, paper / warm / quiet).

## Decision
Applied the OKLCH token layer (Tailwind v4, shadcn `:root` / `.dark` custom properties in `src/index.css`), the type system (Atkinson Hyperlegible Next with an Arial fallback scaled to its measured metrics, a fixed rem scale at ≈1.2 plus a `card` size), light and dark themes (dark follows the system setting; Storybook has a toolbar switch), the component vocabulary (brand-colored 2px focus ring, form-field borders at ≥3:1, single `--radius: 0.5rem`, primary hover to `--brand-600`, larger decision buttons), `dvh` and a scrim token, and functional motion (the entry card fades in per entry, dialogs fade in; 150–250 ms; a global `prefers-reduced-motion` fallback). Register: product.
Designer decisions: both themes in this pass; standard density with breathing room.
Not done: the web font is not preloaded (the build hashes the file name; revisit in `proto-polish`); the dev-only `DevToolbar` keeps its hard-coded colors because it is hidden in production; there is no manual theme switch (not in the spec).

## Impact
The token layer, typography and shared components (`Button`, `ModalDialog`, `ConfirmDialog`, `Kbd`, `AppShell`, notices) are project-wide, so `note-filing`, `days` and `connection` already inherit the palette, type and focus treatment and only need their own screens reviewed. `proto-polish` is the final pass. The design was verified by lint, typecheck, build, inspection of the generated CSS and numeric contrast checks — not by viewing it in a browser, which this environment could not run.
