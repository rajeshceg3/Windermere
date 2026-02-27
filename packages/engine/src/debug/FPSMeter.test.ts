import { describe, it, expect, vi, afterEach } from 'vitest';
import { FPSMeter } from './FPSMeter';

describe('FPSMeter', () => {
  let meter: FPSMeter;

  afterEach(() => {
    if (meter) {
      meter.dispose();
    }
    document.body.innerHTML = ''; // Clean up DOM
  });

  it('should create a DOM element on initialization', () => {
    meter = new FPSMeter();
    const fpsElement = document.body.querySelector('div');
    expect(fpsElement).not.toBeNull();
    expect(fpsElement?.textContent).toBe('FPS: --');
  });

  it('should update FPS count', () => {
    vi.useFakeTimers();
    meter = new FPSMeter();

    // Simulate frame updates
    const initialTime = performance.now();
    vi.setSystemTime(initialTime);

    // Simulate 60 frames over 1 second
    for (let i = 0; i < 60; i++) {
        meter.update();
    }

    // Advance time by 1000ms
    vi.advanceTimersByTime(1000);
    // Trigger update to calculate FPS
    meter.update();

    const fpsElement = document.body.querySelector('div');
    expect(fpsElement?.textContent).toContain('FPS:');

    vi.useRealTimers();
  });

  it('should remove DOM element on dispose', () => {
    meter = new FPSMeter();
    expect(document.body.querySelector('div')).not.toBeNull();
    meter.dispose();
    expect(document.body.querySelector('div')).toBeNull();
  });
});
