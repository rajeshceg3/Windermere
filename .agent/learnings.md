# Agent round learnings

The nightly round reads the tail of this file before proposing a change and
appends one dated entry after every round (shipped, no-change, or failed).
New entries at the bottom. Keep entries to one or two lines: what was tried,
what happened, what to never repeat.

- 2026-10-31: Runner promoted to main. Fixed pre-existing TS break:
  `private count` shadowed `InstancedMesh.count` (TS2415) and
  `Matrix4.decompose` needs a Quaternion, not an Euler. Rule: subclass fields
  must not shadow three.js public members.
- 2026-10-31: GitHub /new/<branch> keeps the last directory context; typing a
  full path creates a nested duplicate. Always create files from the explicit
  directory URL (/new/<branch>/<dir>) with just the basename.
