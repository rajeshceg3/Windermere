import React, { useEffect, useRef, useState } from 'react';
import { CoreEngine, type SceneState } from '@windermere/engine';
import { Button, Toggle } from '@windermere/ui';

const scenePresets: Array<{
  id: SceneState;
  label: string;
  eyebrow: string;
  copy: string;
}> = [
  {
    id: 'DawnSurface',
    label: 'Dawn Surface',
    eyebrow: 'Cinematic onboarding',
    copy: 'Rose-gold mist, quiet birds, and a low camera glide over mirror-still water.',
  },
  {
    id: 'MiddayExpanse',
    label: 'Midday Expanse',
    eyebrow: 'Exploration mode',
    copy: 'High clarity water, bright volumetric cloud cover, distant boats, and open navigation.',
  },
  {
    id: 'TwilightStillness',
    label: 'Twilight Stillness',
    eyebrow: 'Reflective finale',
    copy: 'A slower pace with stars, fireflies, crickets, and deeper horizon fog.',
  },
];

const telemetry = [
  ['Water mesh', 'Realtime planar reflections'],
  ['Atmosphere', 'Volumetric fog + procedural cloud field'],
  ['Wildlife', 'Flocking birds, fish shadows, firefly particles'],
  ['Accessibility', 'Motion, contrast, audio, and performance controls'],
];

export const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CoreEngine | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [activeScene, setActiveScene] = useState<SceneState>('DawnSurface');

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new CoreEngine(canvasRef.current);
    }
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
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

  const selectScene = (scene: SceneState) => {
    setActiveScene(scene);
    engineRef.current?.transitionToScene(scene, 3.6);
  };

  return (
    <main
      className={`showcase-shell ${isHighContrast ? 'is-high-contrast' : ''}`}
    >
      <canvas
        ref={canvasRef}
        className="showcase-canvas"
        aria-label="Interactive Windermere lake simulation"
      />
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="grain" />

      <section
        className="hero-panel"
        aria-label="Windermere experience overview"
      >
        <p className="kicker">Windermere Frontier Preview · 2026</p>
        <h1>Step into a living lake that feels filmed, not rendered.</h1>
        <p className="hero-copy">
          A realtime WebGL destination layer for immersive travel storytelling:
          cinematic scene states, adaptive ambience, accessible controls, and
          atmospheric detail that keeps moving after the first wow.
        </p>
        <div className="hero-actions">
          <Button
            label="Begin guided drift"
            onClick={() => selectScene('MiddayExpanse')}
            highContrast={isHighContrast}
          />
          <button
            className="ghost-button"
            onClick={() => selectScene('TwilightStillness')}
          >
            Skip to twilight
          </button>
        </div>
      </section>

      <aside className="scene-dock" aria-label="Scene presets">
        {scenePresets.map((scene) => (
          <button
            key={scene.id}
            className={`scene-card ${activeScene === scene.id ? 'is-active' : ''}`}
            onClick={() => selectScene(scene.id)}
          >
            <span>{scene.eyebrow}</span>
            <strong>{scene.label}</strong>
            <small>{scene.copy}</small>
          </button>
        ))}
      </aside>

      <section className="systems-panel" aria-label="Rendering systems">
        <div>
          <p className="panel-label">Live systems</p>
          <h2>Production-grade sensory stack</h2>
        </div>
        <dl>
          {telemetry.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="control-panel" aria-label="Experience controls">
        <Toggle
          label="Mute Audio"
          checked={isMuted}
          onChange={setIsMuted}
          highContrast={isHighContrast}
        />
        <Toggle
          label="Reduced Motion"
          checked={isReducedMotion}
          onChange={setIsReducedMotion}
          highContrast={isHighContrast}
        />
        <Toggle
          label="High Contrast UI"
          checked={isHighContrast}
          onChange={setIsHighContrast}
          highContrast={isHighContrast}
        />
        <Toggle
          label="Low Performance Mode"
          checked={isLowPerformance}
          onChange={setIsLowPerformance}
          highContrast={isHighContrast}
        />
      </div>
    </main>
  );
};
