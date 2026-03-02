/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { CoreEngine } from './CoreEngine';

// Mock THREE.WebGLRenderer
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    WebGLRenderer: class {
      setSize = vi.fn();
      setPixelRatio = vi.fn();
      toneMapping = 0;
      outputColorSpace = '';
      render = vi.fn();
      constructor() {}
    },
  };
});

describe('CoreEngine', () => {
  it('should initialize successfully with CameraController integration', () => {
    const canvas = document.createElement('canvas');
    // Ensure window width/height are defined so CameraController logic succeeds
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 });

    const engine = new CoreEngine(canvas);
    expect(engine).toBeDefined();

    // Verify properties implicitly via instantiation success without throws
  });
});
