/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoreEngine } from './CoreEngine';
import { gsap } from 'gsap';
import * as THREE from 'three';

// Mock GSAP
vi.mock('gsap', () => {
  return {
    gsap: {
      to: vi.fn(),
    },
  };
});

// Mock FPSOverlay
vi.mock('./FPSOverlay', () => ({
  FPSOverlay: class {
    show() {}
    hide() {}
    update() {}
    destroy() {}
  }
}));

// Mock AudioContext because jsdom doesn't have it
class MockAudioContext {
  createGain() { return { connect: vi.fn(), gain: { value: 1, linearRampToValueAtTime: vi.fn() } }; }
  createPanner() { return { connect: vi.fn() }; }
  createBufferSource() { return { connect: vi.fn() }; }
  destination = {};
  currentTime = 0;
  state = 'running';
  resume = vi.fn();
}

vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext);

// Mock THREE to track property changes if needed, but we rely on GSAP calls mostly.
// Actually, we don't mock entire THREE here as it might break the CoreEngine internals.
// Let's just mock what is strictly necessary. We can let CoreEngine instantiate real THREE objects.
// Since we run in JSDOM, WebGLRenderer needs a mock.

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  return {
    ...actual,
    WebGLRenderer: class {
      setSize = vi.fn();
      setPixelRatio = vi.fn();
      toneMapping = 0;
      outputColorSpace = '';
      setClearColor = vi.fn();
      getClearColor = vi.fn().mockReturnValue(new actual.Color(0x000000));
      getRenderTarget = vi.fn();
      setRenderTarget = vi.fn();
      clear = vi.fn();
      render = vi.fn();
      constructor() {}
    },
  };
});

describe('CoreEngine Scene Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transitions to MiddayExpanse correctly', () => {
    const canvas = document.createElement('canvas');
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 });

    const engine = new CoreEngine(canvas);

    // Clear initial GSAP calls if any occurred during setup
    vi.mocked(gsap.to).mockClear();

    engine.transitionToScene('MiddayExpanse', 3.0);

    // Assert gsap.to was called
    expect(gsap.to).toHaveBeenCalled();

    // Check fog color transition
    const fogColorCall = vi.mocked(gsap.to).mock.calls.find(call =>
      call[1].r !== undefined && call[1].g !== undefined && call[1].b !== undefined && call[1].duration === 3.0
    );
    expect(fogColorCall).toBeDefined();

    // Check fog density transition
    const fogDensityCall = vi.mocked(gsap.to).mock.calls.find(call =>
      call[1].density !== undefined && call[1].duration === 3.0
    );
    expect(fogDensityCall).toBeDefined();
    expect(fogDensityCall![1].density).toBe(0.005); // Target density for MiddayExpanse
  });

  it('transitions to TwilightStillness correctly', () => {
    const canvas = document.createElement('canvas');
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 });

    const engine = new CoreEngine(canvas);
    vi.mocked(gsap.to).mockClear();

    engine.transitionToScene('TwilightStillness', 4.0);

    expect(gsap.to).toHaveBeenCalled();

    // Check fog density transition
    const fogDensityCall = vi.mocked(gsap.to).mock.calls.find(call =>
      call[1].density !== undefined && call[1].duration === 4.0
    );
    expect(fogDensityCall).toBeDefined();
    expect(fogDensityCall![1].density).toBe(0.03); // Target density for TwilightStillness
  });
});
