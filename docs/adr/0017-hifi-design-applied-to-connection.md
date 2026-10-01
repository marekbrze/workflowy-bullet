# 0017 - Hi-fi design applied to connection

**Date**: 2026-10-01
**Module**: connection
**Status**: Accepted

## Context
The module was a neutral lo-fi. `docs/DESIGN.md` defined the visual direction, and the token layer, type system, themes and shared components were already laid down by the `review-session` pass (ADR 0014).

## Decision
Reviewed the connect screen and settings against DESIGN.md and kept the inherited tokens, type scale, focus ring and form-field borders. Module-specific changes: the settings panel sits on the card surface with the app's card padding; the connection status carries its meaning in words and reinforces it with the success or error color (7.17:1 and 7.23:1 on the card in light, 8.27:1 and 6.44:1 in dark); the form row uses one control height (field, Show / Hide, Connect, Cancel); the masked key is set in the interface font with tabular figures; and the disconnect option uses the brand accent. The snapshot status line stays calm and muted, with no alarm styling for a stale tree. Register: product.

## Impact
All four modules are now high-fidelity and on-brand. `proto-polish` is the final pass. Verified by lint, typecheck, build and numeric contrast checks, not in a browser.
