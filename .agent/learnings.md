# Agent round learnings

The nightly round reads the tail of this file before proposing a change.
The live log (one dated entry per round: shipped, no-change, or failed) is
the pinned "Agent round log" issue's comments - read the newest comments
there, treat this file as the seed. Entries stay one or two lines: what was
tried, what happened, what to never repeat. Log entries are not committed
to main on purpose: a nightly log commit would trigger a production Vercel
deploy and CI for no user-facing change.

- 2026-10-31: Runner promoted to main. Fixed pre-existing TS break:
  `private count` shadowed `InstancedMesh.count` (TS2415) and
  `Matrix4.decompose` needs a Quaternion, not an Euler. Rule: subclass fields
  must not shadow three.js public members.
- 2026-10-31: GitHub /new/<branch> keeps the last directory context; typing a
  full path creates a nested duplicate. Always create files from the explicit
  directory URL (/new/<branch>/<dir>) with just the basename.
- 2026-10-31: Round ran: build green, dependencies current.
- 2026-11-01: Round ran: build green, dependencies current.
