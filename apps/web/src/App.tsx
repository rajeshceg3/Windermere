import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CoreEngine, type SceneState } from '@windermere/engine';

const scenes: Array<{ id: SceneState; label: string }> = [
  { id: 'DawnSurface', label: 'Dawn' },
  { id: 'MiddayExpanse', label: 'Midday' },
  { id: 'TwilightStillness', label: 'Twilight' },
];

const PIN_KEY = 'windermere-chrome-pin';
const TOP_ZONE = 96;
const BOTTOM_ZONE = 150;
const RETIRE_MS = 2600;

/* Hand-drawn ink: short confident strokes, round caps, never emoji. */
const Ink = ({ children }: { children: React.ReactNode }) => (
  <svg
    className="ink-icon"
    viewBox="0 0 32 32"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const ResetIcon = () => (
  <Ink>
    <path d="M7.4 14.6 C8.6 8.4 15.4 5.2 21 8.2 C25.6 10.8 26.4 17.4 22.6 21.4 C19.2 25 13.4 25 10.2 21.8" />
    <path d="M6.6 8.6 L7.2 15 L13.4 14" />
  </Ink>
);

const SoundInk = ({ muted }: { muted: boolean }) => (
  <Ink>
    <path d="M5.4 12.4 L10.6 12.2 L16.6 7.2 L16.8 24.8 L10.4 19.8 L5.6 19.6 Z" />
    {muted ? (
      <path d="M21 12.4 L27.4 19.6 M27.4 12.2 L21 19.8" />
    ) : (
      <>
        <path d="M21 12 C23.2 14.2 23.2 17.8 21 20" />
        <path d="M24.4 8.6 C28 12.4 28 19.6 24.4 23.4" />
      </>
    )}
  </Ink>
);

const CalmInk = () => (
  <Ink>
    <path d="M4.6 10 L27.4 9.6" />
    <circle cx="11" cy="10" r="2.6" />
    <path d="M4.4 22 L27.6 22.4" />
    <circle cx="21" cy="22.2" r="2.6" />
  </Ink>
);

const PegInk = ({ pinned }: { pinned: boolean }) => (
  <svg
    className="ink-icon"
    viewBox="0 0 32 32"
    aria-hidden="true"
    fill={pinned ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9.6 4.4 L22.4 5 L20.6 12.6 L17.6 14.4 L17 22.6 L16 29 L15 22.6 L14.4 14.4 L11.4 12.6 Z" />
  </svg>
);

/* Three stones, the smallest mark of the Lakeland path. */
const CairnInk = () => (
  <svg
    className="ink-icon cairn"
    viewBox="0 0 32 32"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4.6 27.6 C3.6 22.4 7.4 19.6 16 19.8 C24.6 19.6 28.4 22.6 27.4 27.6 Z" />
    <path d="M8.6 19.4 C8.2 15.2 11.4 12.8 16.2 13 C21 12.8 23.8 15.4 23.2 19.4" />
    <path d="M11.8 12.8 C11.6 9.6 13.4 7.4 16 7.6 C18.8 7.4 20.4 9.6 20 12.8" />
  </svg>
);

/* A fingerpost arm: pointed board, hand-cut edges. */
const Arm = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg
    className="arm"
    viewBox="0 0 112 48"
    aria-hidden="true"
    preserveAspectRatio="none"
  >
    <path
      d={
        dir === 'left'
          ? 'M17 4 L107 6.4 L108.6 42 L16.4 44.6 L3.4 24.4 Z'
          : 'M5 6.4 L95.6 4 L108.6 24.2 L96 44.6 L4.4 42 Z'
      }
    />
  </svg>
);

const QuietSwitch = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className={`quiet-row ${checked ? 'is-on' : ''}`}
    onClick={() => onChange(!checked)}
  >
    <span>{label}</span>
    <span className="quiet-track" aria-hidden="true">
      <span className="quiet-thumb" />
    </span>
  </button>
);

export const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CoreEngine | null>(null);
  const idleTimer = useRef<number | null>(null);
  const focusWithin = useRef(false);

  const [isMuted, setIsMuted] = useState(true);
  // Calm is the baseline, not a preference the visitor has to discover.
  const isReducedMotion = true;
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [activeScene, setActiveScene] = useState<SceneState>('DawnSurface');
  const [veilLifted, setVeilLifted] = useState(false);
  const [veilGone, setVeilGone] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pinned, setPinned] = useState(() => {
    try {
      return localStorage.getItem(PIN_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new CoreEngine(canvasRef.current);
      engineRef.current.toggleAudioMute(true);
    }
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const lift = window.setTimeout(() => setVeilLifted(true), 900);
    const remove = window.setTimeout(() => setVeilGone(true), 4400);
    return () => {
      window.clearTimeout(lift);
      window.clearTimeout(remove);
    };
  }, []);

  useEffect(() => {
    engineRef.current?.toggleAudioMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      // OS changes interrupt input/transitions even when calm is already on.
      engineRef.current?.setReducedMotion(isReducedMotion || media.matches);
      document.documentElement.dataset.motion = 'calm';
      document.documentElement.dataset.osReduce = String(media.matches);
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [isReducedMotion]);

  useEffect(() => {
    engineRef.current?.setLowPerformance(isLowPerformance);
  }, [isLowPerformance]);

  const retireSoon = useCallback(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      if (!focusWithin.current) setChromeVisible(false);
    }, RETIRE_MS);
  }, []);

  const wake = useCallback(() => {
    setChromeVisible(true);
    retireSoon();
  }, [retireSoon]);

  useEffect(() => {
    // The entry greeting lasts a little after the veil clears, then retires.
    const greet = window.setTimeout(retireSoon, 3000);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (e.clientY < TOP_ZONE || e.clientY > window.innerHeight - BOTTOM_ZONE)
        wake();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        focusWithin.current = false;
        if (idleTimer.current) window.clearTimeout(idleTimer.current);
        setSheetOpen(false);
        setChromeVisible(false);
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(greet);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('keydown', onKey);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [wake, retireSoon]);

  const togglePin = () => {
    setPinned((p) => {
      const next = !p;
      try {
        if (next) localStorage.setItem(PIN_KEY, '1');
        else localStorage.removeItem(PIN_KEY);
      } catch {
        /* storage unavailable */
      }
      if (next) setChromeVisible(true);
      else retireSoon();
      return next;
    });
  };

  const holdFocus = {
    onFocus: () => {
      focusWithin.current = true;
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      setChromeVisible(true);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        focusWithin.current = false;
        retireSoon();
      }
    },
  };

  const selectScene = (scene: SceneState) => {
    setActiveScene(scene);
    engineRef.current?.transitionToScene(scene, 6);
  };

  const sceneOrder = scenes.map((s) => s.id);
  const stepScene = (dir: 1 | -1) => {
    const i = sceneOrder.indexOf(activeScene);
    selectScene(sceneOrder[(i + dir + sceneOrder.length) % sceneOrder.length]);
  };
  const dockSwipeX = useRef<number | null>(null);

  const chromeOn = chromeVisible || sheetOpen || pinned;
  const chromeClass = chromeOn ? 'chrome is-visible' : 'chrome';

  return (
    <main className={`lake-shell ${isHighContrast ? 'is-high-contrast' : ''}`}>
      <canvas
        ref={canvasRef}
        className="lake-canvas"
        aria-label="A quiet, living lake. Drag slowly to drift across the water."
      />

      {!veilGone && (
        <div
          className={`veil ${veilLifted ? 'is-lifted' : ''}`}
          aria-hidden="true"
        >
          <span className="veil-word">Windermere</span>
        </div>
      )}

      {!chromeOn && (
        <button
          type="button"
          className="chrome-hint"
          aria-label="Show controls"
          onClick={wake}
        >
          <CairnInk />
        </button>
      )}

      <header className={chromeClass} {...holdFocus}>
        <span className="wordmark">Windermere</span>
      </header>

      <div className={`${chromeClass} corner`} {...holdFocus}>
        <button
          type="button"
          className="orb"
          aria-label="Reset lake view"
          onClick={() => engineRef.current?.resetView()}
        >
          <ResetIcon />
        </button>
        <button
          type="button"
          className="orb"
          aria-label={isMuted ? 'Unmute the lake' : 'Mute the lake'}
          aria-pressed={!isMuted}
          onClick={() => setIsMuted((m) => !m)}
        >
          <SoundInk muted={isMuted} />
        </button>
        <button
          type="button"
          className="orb"
          aria-label="Calm settings"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen((open) => !open)}
        >
          <CalmInk />
        </button>
        <button
          type="button"
          id="pin-controls"
          className="orb"
          aria-pressed={pinned}
          aria-label={pinned ? 'Let controls retire' : 'Keep controls visible'}
          title={pinned ? 'Let controls retire' : 'Keep controls visible'}
          onClick={togglePin}
        >
          <PegInk pinned={pinned} />
        </button>
      </div>

      <nav
        className={`${chromeClass} time-dock`}
        aria-label="Time of day"
        {...holdFocus}
        onPointerDown={(e) => {
          dockSwipeX.current = e.clientX;
        }}
        onPointerMove={(e) => {
          // Capture only once the press proves to be a swipe, so plain taps on
          // the dots still deliver their click to the button.
          if (dockSwipeX.current === null) return;
          if (Math.abs(e.clientX - dockSwipeX.current) > 8) {
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }
        }}
        onPointerUp={(e) => {
          if (dockSwipeX.current === null) return;
          const dx = e.clientX - dockSwipeX.current;
          dockSwipeX.current = null;
          if (Math.abs(dx) > 48) stepScene(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          dockSwipeX.current = null;
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            stepScene(1);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            stepScene(-1);
          }
        }}
      >
        {scenes.map((scene, i) => (
          <button
            key={scene.id}
            type="button"
            className={`time-dot ${activeScene === scene.id ? 'is-active' : ''}`}
            aria-label={`${scene.label} on the lake`}
            aria-pressed={activeScene === scene.id}
            onClick={() => selectScene(scene.id)}
          >
            <Arm dir={i % 2 === 0 ? 'left' : 'right'} />
            <span className="time-label">{scene.label}</span>
          </button>
        ))}
      </nav>

      <div
        className={`calm-sheet ${sheetOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-label="Calm settings"
        aria-hidden={!sheetOpen}
        inert={!sheetOpen}
      >
        <QuietSwitch
          label="Sound"
          checked={!isMuted}
          onChange={(on) => setIsMuted(!on)}
        />
        <QuietSwitch
          label="High contrast"
          checked={isHighContrast}
          onChange={setIsHighContrast}
        />
        <QuietSwitch
          label="Gentle performance"
          checked={isLowPerformance}
          onChange={setIsLowPerformance}
        />
      </div>
    </main>
  );
};
