import { SceneConfig, TimeOfDay } from './types/SceneConfig';

export class SceneRegistry {
  private scenes: Map<string, SceneConfig> = new Map();
  private currentSceneId: string | null = null;
  private timeOfDay: TimeOfDay = 'dawn';

  constructor() {}

  public register(config: SceneConfig): void {
    if (this.scenes.has(config.id)) {
      console.warn(`Scene with ID ${config.id} already exists. Overwriting.`);
    }
    this.scenes.set(config.id, config);
  }

  public get(id: string): SceneConfig | undefined {
    return this.scenes.get(id);
  }

  public getAll(): SceneConfig[] {
    return Array.from(this.scenes.values());
  }

  public setActiveScene(id: string): boolean {
    if (this.scenes.has(id)) {
      this.currentSceneId = id;
      return true;
    }
    return false;
  }

  public getActiveScene(): SceneConfig | undefined {
    if (this.currentSceneId) {
      return this.scenes.get(this.currentSceneId);
    }
    return undefined;
  }

  public setTimeOfDay(time: TimeOfDay): void {
    this.timeOfDay = time;
  }

  public getTimeOfDay(): TimeOfDay {
    return this.timeOfDay;
  }

  public clear(): void {
    this.scenes.clear();
    this.currentSceneId = null;
  }
}
