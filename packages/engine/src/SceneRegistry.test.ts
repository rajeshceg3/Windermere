import { describe, it, expect, beforeEach } from 'vitest';
import { SceneRegistry } from './SceneRegistry';
import { SceneConfig } from './types/SceneConfig';
import * as THREE from 'three';

describe('SceneRegistry', () => {
  let registry: SceneRegistry;
  let mockSceneConfig: SceneConfig;

  beforeEach(() => {
    registry = new SceneRegistry();
    mockSceneConfig = {
      id: 'test-scene',
      name: 'Test Scene',
      fog: { color: 0x000000, density: 0.1 },
      camera: {
        position: new THREE.Vector3(0, 0, 5),
        target: new THREE.Vector3(0, 0, 0),
        fov: 75
      },
      lighting: {
        ambientColor: 0x404040,
        ambientIntensity: 0.5,
        directionalColor: 0xffffff,
        directionalIntensity: 1,
        directionalPosition: new THREE.Vector3(1, 1, 1)
      },
      background: 0x000000
    };
  });

  it('should register a scene', () => {
    registry.register(mockSceneConfig);
    expect(registry.get('test-scene')).toEqual(mockSceneConfig);
  });

  it('should set active scene', () => {
    registry.register(mockSceneConfig);
    const success = registry.setActiveScene('test-scene');
    expect(success).toBe(true);
    expect(registry.getActiveScene()).toEqual(mockSceneConfig);
  });

  it('should return false when setting non-existent scene', () => {
    const success = registry.setActiveScene('non-existent');
    expect(success).toBe(false);
  });

  it('should manage time of day', () => {
    expect(registry.getTimeOfDay()).toBe('dawn');
    registry.setTimeOfDay('midday');
    expect(registry.getTimeOfDay()).toBe('midday');
  });

  it('should clear all scenes', () => {
    registry.register(mockSceneConfig);
    registry.setActiveScene('test-scene');
    registry.clear();
    expect(registry.get('test-scene')).toBeUndefined();
    expect(registry.getActiveScene()).toBeUndefined();
  });
});
