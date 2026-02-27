import * as THREE from 'three';

export type TimeOfDay = 'dawn' | 'midday' | 'twilight';

export interface SceneConfig {
  id: string;
  name: string;
  fog: {
    color: number;
    density: number;
  };
  camera: {
    position: THREE.Vector3;
    target: THREE.Vector3;
    fov: number;
  };
  lighting: {
    ambientColor: number;
    ambientIntensity: number;
    directionalColor: number;
    directionalIntensity: number;
    directionalPosition: THREE.Vector3;
  };
  background: number | THREE.Color | THREE.Texture;
}

export interface TimeOfDayState {
  current: TimeOfDay;
  transitionProgress: number; // 0 to 1
  target?: TimeOfDay;
}
