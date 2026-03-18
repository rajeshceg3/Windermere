import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { VolumetricFogMaterial } from './VolumetricFogMaterial';

describe('VolumetricFogMaterial', () => {
  it('should initialize with default uniforms', () => {
    const material = new VolumetricFogMaterial();

    expect(material.uniforms.fogDensity.value).toBe(0.05);
    expect(material.uniforms.fogColor.value.getHex()).toBe(new THREE.Color(0xffffff).getHex());
    expect(material.uniforms.time.value).toBe(0.0);
  });

  it('should initialize with custom options', () => {
    const color = new THREE.Color(0xff0000);
    const density = 0.1;
    const material = new VolumetricFogMaterial({ color, density });

    expect(material.uniforms.fogColor.value).toEqual(color);
    expect(material.uniforms.fogDensity.value).toBe(density);
  });

  it('should update time correctly', () => {
    const material = new VolumetricFogMaterial();

    material.updateTime(0.5);
    expect(material.uniforms.time.value).toBe(0.5);

    material.updateTime(0.5);
    expect(material.uniforms.time.value).toBe(1.0);
  });
});
