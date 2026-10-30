# Nightly round prompt

You are doing one small, safe improvement round on this repo (a visual web
app; the site lives in apps/web).

Pick exactly ONE of these, or change nothing:
- Fix a small bug or typo you can see in the code.
- A small performance win that cannot change behavior (e.g. avoid
  re-creating objects in a hot path, memoize something pure).
- A small accessibility or mobile polish fix (touch target, label, contrast).

Hard rules:
- Never delete a file. Never change package.json or lockfiles.
- Only touch files under apps/web/.
- The change must be small enough to review in under two minutes.
- If nothing is clearly safe and worthwhile, return no change.
