import { describe, it, expect, beforeEach } from 'vitest';
import { SceneRegistry } from './SceneRegistry';
import { SceneConfig } from './SceneConfig';

describe('SceneRegistry', () => {
  let registry: SceneRegistry;

  beforeEach(() => {
    registry = new SceneRegistry();
  });

  it('should register and retrieve a scene configuration', () => {
    const config: SceneConfig = { id: 'DawnSurface' };
    registry.register(config);

    const retrieved = registry.get('DawnSurface');
    expect(retrieved).toEqual(config);
  });

  it('should return undefined for non-existent scenes', () => {
    const retrieved = registry.get('NonExistent');
    expect(retrieved).toBeUndefined();
  });

  it('should return all registered scenes', () => {
    const config1: SceneConfig = { id: 'DawnSurface' };
    const config2: SceneConfig = { id: 'MiddayExpanse' };

    registry.register(config1);
    registry.register(config2);

    const allScenes = registry.getAll();
    expect(allScenes.length).toBe(2);
    expect(allScenes).toContainEqual(config1);
    expect(allScenes).toContainEqual(config2);
  });
});
