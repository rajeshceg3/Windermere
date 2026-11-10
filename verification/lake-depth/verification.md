# Lake depth round - 2026-11-10

Three scenes, 390x844 and 1440x844, reduced and normal motion: real browser gate passes, actual drag + Reset held at canonical angle, visible labels >=44px targets, audio off on load, settings and keyboard focus, no page/console errors. Normal/reduced screenshots captured after chapter settles. No screenshot-only assertion is called an interaction test.

54 glyph-backdrop samples at 390x844 and 1440x900, all chapters, wordmark, hint, three scene labels and four open-settings labels: minimum 11.814:1. Mask found via black/white diagnostic renders; actual ink compared with transparent-text background at each solid glyph pixel. Does not cover every transition/dragged angle. Hint was captured at full opacity; its fade-out is not contrast-certified. Settings use an opaque-dark surface.

TypeScript noEmit, source/test ESLint, all 20 unit tests and 11 release-effects tests pass. 320px reduced-motion drag/Reset/label/overflow gate also passes. Settings text has a 16px floor; closed settings are inert, so keyboard focus cannot enter invisible controls. Full eslint after building includes generated dist assets; CI lints before building.

Audio now has real brown-noise/filter sources and sparse synthetic birds, muted by default, context resumed on tap. Actual ten-second output captured, not a recreated graph. Listening quality is unverified; no claim of audio completion.

The boat remains a stylized wooden rowboat, not a scanned model. A narrower FOV and higher eye position expose the open hull. At distance18, fov55, portrait390/844, visible half-width is 18*tan(27.5deg)*(390/844)=4.33 world units; hull half-length1.8 and resting oars fit. Desktop is wider. The promontory is illustrative and is not asserted to represent a particular named island.

Reproduce: build, then run `python3 tests/visual/serve-csp.py` on port8791, run `WIDTHS='[390]' node tests/visual/lake-gate.mjs`; use WIDTHS=[1440] and MOTIONS=["reduce"] / ["no-preference"] separately on slow renderers. `SIZES='[[390,844]]' node tests/visual/glyph-capture.mjs`, then `python3 tests/visual/glyph-contrast.py` (Pillow/NumPy). BASE_URL and OUT can override defaults.
