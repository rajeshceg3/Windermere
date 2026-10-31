import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CoreEngine, type SceneState } from '@windermere/engine';

const scenes: Array<{ id: SceneState; label: string }> = [
  { id: 'DawnSurface', label: 'Dawn' },
  { id: 'MiddayExpanse', label: 'Midday' },
  { id: 'TwilightStillness', label: 'Twilight' },
];

const CHROME_IDLE_MS = 4200;

const SoundIcon = ({ muted }: { muted: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 5 6.5 9H3v6h3.5L11 19V5z" fill="currentColor" stroke="none" />
    {muted ? (
      <path d="M15 9.5l5 5m0-5l-5 5" />
    ) : (
      <>
        <path d="M15 9.2a4 4 0 0 1 0 5.6" />
        <path d="M17.4 6.8a7.4 7.4 0 0 1 0 10.4" />
      </>
    )}
  </svg>
);

const CalmIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <line x1="4" y1="8" x2="20" y2="8" />
    <circle cx="9" cy="8" r="2.2" fill="currentColor" stroke="none" />
    <line x1="4" y1="16" x2="20" y2="16" />
    <circle cx="15" cy="16" r="2.2" fill="currentColor" stroke="none" />
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

  const [isMuted, setIsMuted] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [activeScene, setActiveScene] = useState<SceneState>('DawnSurface');
  const [veilLifted, setVeilLifted] = useState(false);
  const [veilGone, setVeilGone] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

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
    engineRef.current?.setReducedMotion(isReducedMotion);
  }, [isReducedMotion]);

  useEffect(() => {
    engineRef.current?.setLowPerformance(isLowPerformance);
  }, [isLowPerformance]);

  const wake = useCallback(() => {
    setChromeVisible(true);
    if (idleTimer.current) {
      window.clearTimeout(idleTimer.current);
    }
    idleTimer.current = window.setTimeout(() => {
      setChromeVisible(false);
    }, CHROME_IDLE_MS);
  }, []);

  useEffect(() => {
    wake();
    const events: Array<keyof WindowEventMap> = [
      'pointermove',
      'pointerdown',
      'touchstart',
      'keydown',
    ];
    events.forEach((event) =>
      window.addEventListener(event, wake, { passive: true })
    );
    return () => {
      events.forEach((event) => window.removeEventListener(event, wake));
      if (idleTimer.current) {
        window.clearTimeout(idleTimer.current);
      }
    };
  }, [wake]);

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

  const chromeClass =
    chromeVisible || sheetOpen ? 'chrome is-visible' : 'chrome';

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

      <header className={chromeClass}>
        <span className="wordmark">Windermere</span>
      </header>

      <div className={`${chromeClass} corner`}>
        <button
          type="button"
          className="orb"
          aria-label={isMuted ? 'Unmute the lake' : 'Mute the lake'}
          aria-pressed={!isMuted}
          onClick={() => setIsMuted((m) => !m)}
        >
          <SoundIcon muted={isMuted} />
        </button>
        <button
          type="button"
          className="orb"
          aria-label="Calm settings"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen((open) => !open)}
        >
          <CalmIcon />
        </button>
      </div>

      <p
        className={`hint ${chromeVisible ? 'is-visible' : ''}`}
        aria-hidden="true"
      >
        drag to drift
      </p>

      <nav
        className={`${chromeClass} time-dock`}
        aria-label="Time of day"
        onPointerDown={(e) => {
          dockSwipeX.current = e.clientX;
          // Capture the pointer so the swipe finishes on the dock even when it
          // ends outside it; otherwise pointerup lands on the world canvas.
          e.currentTarget.setPointerCapture?.(e.pointerId);
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
        {scenes.map((scene) => (
          <button
            key={scene.id}
            type="button"
            className={`time-dot ${activeScene === scene.id ? 'is-active' : ''}`}
            aria-label={`${scene.label} on the lake`}
            aria-pressed={activeScene === scene.id}
            onClick={() => selectScene(scene.id)}
          >
            <span className="dot" aria-hidden="true" />
            <span className="time-label">{scene.label}</span>
          </button>
        ))}
      </nav>

      <div
        className={`calm-sheet ${sheetOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-label="Calm settings"
        aria-hidden={!sheetOpen}
      >
        <QuietSwitch
          label="Sound"
          checked={!isMuted}
          onChange={(on) => setIsMuted(!on)}
        />
        <QuietSwitch
          label="Reduced motion"
          checked={isReducedMotion}
          onChange={setIsReducedMotion}
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
