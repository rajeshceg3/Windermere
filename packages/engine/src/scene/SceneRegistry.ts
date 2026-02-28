import { SceneConfig } from './SceneConfig';

export class SceneRegistry {
  private scenes: Map<string, SceneConfig> = new Map();

  register(config: SceneConfig): void {
    this.scenes.set(config.id, config);
  }

  get(id: string): SceneConfig | undefined {
    return this.scenes.get(id);
  }

  getAll(): SceneConfig[] {
    return Array.from(this.scenes.values());
  }
}
