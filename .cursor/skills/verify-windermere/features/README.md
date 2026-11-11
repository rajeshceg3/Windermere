# Windermere feature map

- Entry veil: full-screen held-breath intro (`.veil`), lifts when the scene boots.
- Lake scene: three.js water with Dawn / Midday / Twilight moments, selected via `.time-dock` buttons (aria labels per moment).
- Look-around: pointer drag on the canvas orbits yaw/pitch; `Reset lake view` returns to each moment's entry yaw/pitch.
- Retiring chrome: header, time-dock and corner controls greet on load (visible ~5.6s), retire on idle, wake from pointer in the top 96px or bottom 150px zones, and can be pinned with `#pin-controls` (persists to localStorage `windermere-chrome-pin`). A `.chrome-hint` affordance appears when retired and wakes chrome on click.
- Calm settings: `Calm settings` opens `.calm-sheet`; keyboard navigable (Tab reaches a button), Escape closes and hides chrome.
- Audio: opt-in lake soundscape, starts muted (`Unmute the lake` aria-pressed=false).
- Reduced motion: respects prefers-reduced-motion emulation in gates.
- Engine: packages/engine CoreEngine manages scene state transitions (unit-tested).
