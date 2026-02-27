export type FeatureFlag = 'fpsOverlay' | 'experimentalWater' | 'reducedMotion';

class FeatureFlagManager {
  private flags: Record<FeatureFlag, boolean> = {
    fpsOverlay: import.meta.env?.VITE_FF_FPS_OVERLAY === 'true' || false,
    experimentalWater: import.meta.env?.VITE_FF_EXPERIMENTAL_WATER === 'true' || false,
    reducedMotion: import.meta.env?.VITE_FF_REDUCED_MOTION === 'true' || false,
  };

  public isEnabled(flag: FeatureFlag): boolean {
    return this.flags[flag] || false;
  }

  public setFlag(flag: FeatureFlag, value: boolean): void {
    this.flags[flag] = value;
  }

  public getAllFlags(): Record<FeatureFlag, boolean> {
    return { ...this.flags };
  }
}

export const featureFlags = new FeatureFlagManager();
