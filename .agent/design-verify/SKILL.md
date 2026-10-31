---
name: design-verify
description: Verification skill for every build, upgrade, and polish round on this repo. Run BEFORE shipping any visual change. Encodes the house design laws; a change that fails any check does not ship.
---

# Design Verify

The verification gate for every visual change to this project. A change ships
only when every applicable check below passes with evidence.

## When to use

- Before committing any UI, scene, layout, copy, or interaction change.
- During every design-upgrade or polish round, per chapter/screen.
- When auditing an existing page: run every check, log each failure, fix or
  justify in the round report.

## The laws and their checks

### 1. Navigation variation
- The nav pattern fits THIS world's metaphor. A default bottom sheet or dock
  reused from another world FAILS unless justified in the round report.
- Check: name the nav pattern and why it belongs to this world specifically.

### 2. Phone-first, laptop-true
- Designed at 390px first; fully composed at laptop width (>=1440px).
- Check: screenshots at BOTH 390x844 and 1440x900, every chapter/screen,
  after animations settle (wait 8-12s for spring transitions).
- Check: for 3D scenes, compute the visible half-width
  (distance x tan(hfov/2) x aspect) BEFORE placing any element that must be
  seen; verify the math against the screenshot.

### 3. One signature interaction per chapter
- Exactly one. Anything not serving it is deleted.
- Check: name the signature interaction; list every other interactive
  element and why it is structural (nav), not decorative.

### 4. Clutter audit
- Quiet by default, rich on demand: the first screen holds only the one
  thing that matters; depth appears on intent (tap/hover/scroll).
- Addition by subtraction: enrich by making existing elements carry more
  meaning, never by adding UI elements.
- Choreography over chrome: depth comes from motion, light, time.
- Check: for every proposed addition ask "does this add an element or add
  meaning?" Element-adders need explicit written justification or they do
  not ship.

### 5. Slop law
- Slop = anything that could belong to any page, and therefore belongs to no
  page of ours. Everything should be intentional.
- BANNED: panels/cards floating over the scene (if the world can say it, no
  panel may); eyebrow text and filler subtitles; secondary/instruction text
  (layout must convey it - do not TELL, TEACH: discoverability through
  choreography - pulse/glow on the one tappable element, inviting idle
  animation, first-tap reward); template furniture (generic nav bars,
  hamburger menus on one-page worlds, hero banners, feature grids,
  cookie-cutter buttons); decorative nothing (gratuitous gradients, neon
  glows, stock shadows, meaningless particles); filler copy.
- Check (the deletion test): for each element ask "what would break if I
  deleted this?" If the answer is nothing, delete it. Every element earns
  its pixel.

### 6. Two-register text
- JOY/DISCOVERY worlds: text on a strict diet; words only where nothing
  visual can carry the meaning.
- LEARNING worlds: text permitted as a teaching tool - intentional, minimal,
  and each word must beat the visual alternative ("does this word make the
  concept land better than the layout alone?").
- Check: declare the register; test every visible string against it.

### 7. Privacy law (hard gate)
- No personal information in any public artifact: no names, family details,
  personal interests, or identifying context - in page content, code
  comments, commit messages, PR text, READMEs, or deploy URLs.
- Public repos get general topics only. Anything personal requires explicit
  owner permission AND a private repo/deploy.
- Check: grep the diff for names and personal references before commit.

### 8. Accessibility guard
- Visual declutter must not strip usable semantics.
- Keep accessible names on all controls, visible focus indicators, and
  necessary action labels.
- Ambient cues (glow/pulse) replacing captions must still be discoverable
  with REDUCED MOTION; test with prefers-reduced-motion emulated as well as
  normal animation.
- Check: keyboard-operate every interactive element; verify accessible names
  in the a11y tree; one reduced-motion screenshot per changed chapter.

## Output format

For each of the 8 laws: PASS, FAIL (with evidence), or N/A (with reason).
A single FAIL blocks shipping. Attach the required screenshots. Log every
keep-with-justification explicitly - silent exemptions are failures.
