import React, { useEffect, useRef } from 'react';
import { CoreEngine } from '@windermere/engine';
import { Button } from '@windermere/ui';

export const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      new CoreEngine(canvasRef.current);
    }
  }, []);

  return (
    <div className="relative w-screen h-screen">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      <div className="absolute top-4 left-4 z-10">
        <Button label="Start Experience" onClick={() => console.log('Start clicked')} />
      </div>
    </div>
  );
};
