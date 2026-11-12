# Calm camera prototype, 12 November 2026

Local draft, not a release. Baseline main 60d2658.

The old controller adds pointer displacement to velocity, integrates velocity
once each rendered frame and damps on release. The replacement maps displacement
to target angle and applies it directly, with no release inertia. Initial gain
0.0007 radians/CSS pixel, capped speed multiplier at1. This is a prototype tuning
choice, not a universally safe or medically validated motion threshold.
Pitch limited to -15/+10 degrees and roll stays zero. Secondary pointers ignored;
blur/cancel/release end input. Preserve custom chrome and all other world content.

Real Chromium390x844 with touch events via CDP: 180px horizontal path over18 moves,
nominal16ms spacing, then1.5s after release. Baseline rotation during gesture29.63deg,
additional release drift23.02deg. New rotation6.14deg, zero release drift at five
reported decimal places in radians. Event dispatch and renderer scheduling are not
physical touch latency measurements. Screenshots cannot prove comfort or feel.

21 unit tests pass including sparse/dense event and render-step paths, no-release
motion, and reduced preference controller parity; typecheck/build pass. Camera
lint passes. Full repo lint has the known main empty-finally issue tracked separately
in PR56. Still open: OS preference change handling at app level, existing motion
switch removal, real desktop/touch matrix and interruption tests, chapter/veil
transitions, pin gate baseline investigation, preview/production verification.

Sources reviewed for the shared policy:
- https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- https://emilkowal.ski/ui/you-dont-need-animations
- https://developer.apple.com/design/human-interface-guidelines/motion.md
- https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria/

No source prescribes this gain. The governing policy is calm defaults, fully
honoured OS reduction, purpose-specific essential animation, no new setting,
and preserved pause/navigation alternatives. Fleet rollout follows per-repo review.
