import React, { useEffect, useRef, useState } from 'react';
import { CoreEngine } from '@windermere/engine';
import { Button, Toggle } from '@windermere/ui';

export const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CoreEngine | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);

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
    if (engineRef.current) {
      engineRef.current.toggleAudioMute(isMuted);
    }
  }, [isMuted]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setReducedMotion(isReducedMotion);
    }
  }, [isReducedMotion]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setLowPerformanceMode(isLowPerformance);
    }
  }, [isLowPerformance]);

  return (
    <div className={`relative w-screen h-screen ${isHighContrast ? 'high-contrast' : ''}`}>
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

      <div className="absolute top-4 left-4 z-10 flex flex-col gap-4">
        <Button label="Start Experience" onClick={() => console.log('Start clicked')} />
      </div>

      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-3">
        <Toggle
          label="Mute Audio"
          checked={isMuted}
          onChange={setIsMuted}
        />
        <Toggle
          label="Reduced Motion"
          checked={isReducedMotion}
          onChange={setIsReducedMotion}
        />
        <Toggle
          label="Low Performance Mode"
          checked={isLowPerformance}
          onChange={setIsLowPerformance}
        />
        <Toggle
          label="High Contrast UI"
          checked={isHighContrast}
          onChange={setIsHighContrast}
        />
      </div>
    </div>
  );
};
