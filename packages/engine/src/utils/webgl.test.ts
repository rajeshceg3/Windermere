import { describe, it, expect, vi } from 'vitest';
import { isWebGLAvailable } from './webgl';

describe('isWebGLAvailable', () => {
  it('should return true if WebGL is supported', () => {
    // Mock WebGL context
    const mockContext = {};
    const mockCanvas = {
      getContext: vi.fn((type) => {
        if (type === 'webgl' || type === 'experimental-webgl') {
          return mockContext;
        }
        return null;
      }),
    };

    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

    // Mock window.WebGLRenderingContext
    Object.defineProperty(window, 'WebGLRenderingContext', {
      value: function() {},
      writable: true
    });

    expect(isWebGLAvailable()).toBe(true);
  });

  it('should return false if WebGL is not supported', () => {
    // Mock no WebGL context
    const mockCanvas = {
      getContext: vi.fn(() => null),
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

    // Remove WebGLRenderingContext
    Object.defineProperty(window, 'WebGLRenderingContext', {
      value: undefined,
      writable: true
    });

    expect(isWebGLAvailable()).toBe(false);
  });
});
