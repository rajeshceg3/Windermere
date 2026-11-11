---
name: verify-windermere
description: Verify the Windermere lake web app with real browser gates, unit tests, and a production check. Use after any UI, engine, scene, or chrome-behavior change.
---

# Verify Windermere

Windermere is a pnpm monorepo: apps/web (React + Vite + three.js lake, three moments - Dawn, Midday, Twilight), packages/engine, packages/ui, packages/audio, packages/shaders. Production: https://windermere.vercel.app (Vercel; unique deployment URLs are behind Vercel Authentication, the alias is public).

## Launch

`pnpm install --frozen-lockfile && pnpm build` (vite build of apps/web). Serve the build with the deployment's own CSP: `python3 tests/visual/serve-csp.py` (127.0.0.1:8791, reads the CSP from vercel.json). Chrome at /usr/bin/google-chrome (or CHROME_PATH).

## Doctor

`curl -sI http://127.0.0.1:8791/` returns 200 with the Content-Security-Policy header. The app is ready when `.veil` becomes hidden (scene boot, 4-6s under software WebGL). Production doctor: `curl -s https://windermere.vercel.app` returns 200 and the page references /assets/index-\*.js.

## Drive

Two browser gates, both puppeteer-core, real Chrome, no mocks:

- `node tests/visual/lake-gate.mjs` - per width/motion: clicks each `.time-dock` moment, pointer-drags the lake, asserts reset holds yaw/pitch targets, 44px targets, visible labels, no horizontal overflow, audio starts muted, calm sheet opens, Tab focuses a button, zero page errors. WIDTHS and MOTIONS env vars (JSON arrays); run one width-motion pair per invocation on bounded runners (~45-65s each).
- `node tests/visual/chrome-gate.mjs` - pinned pass drives every control; unpinned pass asserts the entry greeting, retire after ~5.6s, chrome-hint discovery, bottom-edge wake (widths > 500), re-retire, hint wake, and that #pin-controls holds and persists to localStorage windermere-chrome-pin.
  Unit tests: `pnpm vitest run` (packages/engine CoreEngine + transitions).

## Evidence

Gate JSON + screenshots under verification/lake-depth/local and verification/chrome-pixels. Keep them; never delete evidence as cleanup. Record gate combos run in evidence.json.

## Cleanup

Kill only the serve-csp.py you started. `rm -rf node_modules` after shipping on size-bounded runners.

## Known boundaries

- chrome-gate at 1365px + no-preference under headless software WebGL: the unpinned-pass assertion 'greeting shows chrome' races scene boot. The greeting window is mount+~5.6s (App.tsx: greet 3000ms + RETIRE_MS 2600); measured boot to veil-hidden is ~5.3s in a fresh browser but exceeds the window after the pinned pass warms the shared browser, so the combo fails in the gate while passing with a fresh browser probe. On hardware GPUs boot is ~1s and the greeting shows; slow-boot discovery is handled by the chrome-hint (asserted). This is an environment timing race, not an app defect. Both 1365 combos hit this race; both 390 combos pass.
- Vercel unique deployment URLs are protected (302 to Vercel Authentication); use the windermere.vercel.app alias for production checks.
