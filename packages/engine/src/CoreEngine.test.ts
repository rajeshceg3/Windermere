/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { CoreEngine } from './CoreEngine';
import * as THREE from 'three';

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
  it('should initialize successfully', () => {
    const canvas = document.createElement('canvas');
    const engine = new CoreEngine(canvas);
    expect(engine).toBeDefined();
    // Since we mocked the class, we can check if it was instantiated.
    // However, checking calls on a class constructor mock is tricky in some setups without spyOn.
    // But since `new CoreEngine` didn't throw, and it calls `new THREE.WebGLRenderer`, we are good for a basic check.
  });
});
