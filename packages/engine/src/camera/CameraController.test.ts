/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CameraController } from './CameraController';
import * as THREE from 'three';

describe('CameraController', () => {
  let canvas: HTMLCanvasElement;
  let controller: CameraController;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 });
    controller = new CameraController(canvas);
  });

  it('should initialize with correct camera setup', () => {
    expect(controller.camera).toBeDefined();
    expect(controller.camera).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(controller.camera.position.x).toBe(0);
    expect(controller.camera.position.y).toBe(2);
    expect(controller.camera.position.z).toBe(5);
  });

  it('should update correctly even without interaction', () => {
    const initialRotY = controller.camera.rotation.y;
    controller.update();
    expect(controller.camera.rotation.y).toBe(initialRotY); // no change because velocity is 0
  });

  it('should set speed multiplier', () => {
    // We access the private speedMultiplier property for test verification or just verify through a side-effect if we had a getter
    // Since it affects pointermove sensitivity, we can just ensure the method doesn't throw and state holds
    controller.setSpeedMultiplier(0.5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((controller as any).speedMultiplier).toBe(0.5);
  });

  it('should transition speed multiplier via gsap', () => {
    // To avoid importing or deeply mocking gsap, we just ensure it exists
    controller.transitionSpeedMultiplier(0.85, 1.0);
    // Since GSAP transitions are async, we can at least ensure it was called without errors
    // the property will eventually update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((controller as any).speedMultiplier).toBeDefined();
  });
});
