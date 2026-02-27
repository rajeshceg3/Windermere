import { describe, it, expect, vi } from 'vitest';
import { CoreEngine } from './CoreEngine';
import * as THREE from 'three';

// Mock THREE.WebGLRenderer
const setPixelRatioMock = vi.fn();
const setSizeMock = vi.fn();
const renderMock = vi.fn();
const disposeMock = vi.fn();

vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    WebGLRenderer: class {
      public domElement: HTMLCanvasElement;
      public toneMapping: any;
      public outputColorSpace: any;

      constructor(params: { canvas: HTMLCanvasElement }) {
        this.domElement = params.canvas;
      }
      setSize = setSizeMock;
      setPixelRatio = setPixelRatioMock;
      render = renderMock;
      dispose = disposeMock;
    },
    ACESFilmicToneMapping: 'ACESFilmicToneMapping',
    SRGBColorSpace: 'SRGBColorSpace',
  };
});

describe('CoreEngine', () => {
  it('should initialize successfully with correct renderer settings', () => {
    const canvas = document.createElement('canvas');
    // Mock window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 3,
      writable: true
    });

    const engine = new CoreEngine(canvas);
    expect(engine).toBeDefined();

    // Verify renderer settings
    expect(setSizeMock).toHaveBeenCalledWith(window.innerWidth, window.innerHeight);
    expect(setPixelRatioMock).toHaveBeenCalledWith(2); // Cap at 2
  });

  it('should initialize with debug mode if configured', () => {
    const canvas = document.createElement('canvas');
    const engine = new CoreEngine(canvas, { debug: true });
    expect(engine).toBeDefined();

    // FPSMeter creates a DOM element, check document.body
    expect(document.body.textContent).toContain('FPS: --');

    engine.dispose();
  });

  it('should dispose resources correctly', () => {
    const canvas = document.createElement('canvas');
    const engine = new CoreEngine(canvas);
    engine.dispose();
    expect(disposeMock).toHaveBeenCalled();
  });
});
