/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { CoreEngine } from './CoreEngine';

// Mock AudioContext because jsdom doesn't have it
class MockNode {
  gain = { value: 1, linearRampToValueAtTime: vi.fn() };
  frequency = {
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  Q = { value: 0 };
  buffer = null;
  loop = false;
  type = '';
  connect = vi.fn().mockImplementation((node) => node);
  start = vi.fn();
  stop = vi.fn();
}
class MockAudioContext {
  sampleRate = 48000;
  createGain() {
    return new MockNode();
  }
  createPanner() {
    return new MockNode();
  }
  createBiquadFilter() {
    return new MockNode();
  }
  createBufferSource() {
    return new MockNode();
  }
  createOscillator() {
    return new MockNode();
  }
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  destination = {};
  currentTime = 0;
  state = 'suspended';
  resume = vi.fn();
  close = vi.fn();
}
vi.useFakeTimers();

vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext);

// Mock FPSOverlay
vi.mock('./FPSOverlay', () => ({
  FPSOverlay: class {
    show() {}
    hide() {}
    update() {}
    destroy() {}
  },
}));

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
      setClearColor = vi.fn();
      getRenderTarget = vi.fn();
      setRenderTarget = vi.fn();
      clear = vi.fn();
      render = vi.fn();
      constructor() {}
    },
  };
});

describe('CoreEngine', () => {
  it('should initialize successfully with CameraController integration', () => {
    const canvas = document.createElement('canvas');
    // Ensure window width/height are defined so CameraController logic succeeds
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600,
    });

    const engine = new CoreEngine(canvas);
    expect(engine).toBeDefined();

    // Verify properties implicitly via instantiation success without throws
  });
});
