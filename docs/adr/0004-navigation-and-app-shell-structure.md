# 0004 - Navigation and app shell structure

**Date**: 2026-10-01
**Module**: app-shell
**Status**: Accepted

## Context
Need to define how users navigate between modules and what the overall app frame looks like. Only two modules (`days`, `connection`) are real navigation destinations: `review-session` is a flow started from the home screen and `note-filing` is an overlay inside it.

## Decision
Responsive layout with a thin top bar (app name + links to Today and Connection). Home page is the `days` home screen. During a review session the top bar is hidden (focus mode). Content is a narrow centered column (`max-w-2xl`). No breadcrumbs, footer or notifications area.

## Impact
All proto-lofi modules render inside this shell. `review-session` lives at `/review-session/:mode` and owns its own exit control; `note-filing` has no route. React Router added, with `basename` taken from Vite's `BASE_URL` for GitHub Pages.
