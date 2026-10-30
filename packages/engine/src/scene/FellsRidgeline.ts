import * as THREE from 'three';

/**
 * FellsRidgeline - the distant Cumbrian fells that ring the lake.
 *
 * Two concentric rings of jagged ridge geometry. A MeshBasicMaterial with
 * scene fog enabled gives us atmospheric perspective for free: the existing
 * FogExp2 turns the rings into soft silhouettes that thicken and thin with
 * the mist, exactly like the real horizon at dawn.
 *
 * The rings are static geometry; only their tint changes with the time of
 * day (tintFells is called from CoreEngine.transitionToScene).
 */
export class FellsRidgeline {
  public readonly group: THREE.Group;
  private readonly materials: THREE.MeshBasicMaterial[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'FellsRidgeline';

    // Far ring: taller, softer (more fog between camera and ridge)
    this.group.add(this.buildRing({
      radius: 390,
      baseHeight: 6,
      peakHeight: 34,
      seed: 7.3,
      tint: 0x8a7f8e,
    }));

    // Near ring: lower, closer, reads darker through less fog
    this.group.add(this.buildRing({
      radius: 230,
      baseHeight: 3,
      peakHeight: 16,
      seed: 2.9,
      tint: 0x6e6376,
    }));
  }

  private buildRing(options: {
    radius: number;
    baseHeight: number;
    peakHeight: number;
    seed: number;
    tint: number;
  }): THREE.Mesh {
    const segments = 160;
    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.cos(theta) * options.radius;
      const z = Math.sin(theta) * options.radius;

      // Layered sines make a natural, unhurried ridgeline - no two peaks alike,
      // but nothing jagged enough to feel alpine.
      const h =
        options.baseHeight +
        options.peakHeight *
          (0.45 +
            0.28 * Math.sin(theta * 3 + options.seed) +
            0.18 * Math.sin(theta * 7 + options.seed * 2.1) +
            0.09 * Math.sin(theta * 13 + options.seed * 4.7));

      positions.push(x, -4, z); // skirt dips below the waterline
      positions.push(x, h, z);

      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);

    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(options.tint),
      fog: true,
      side: THREE.DoubleSide,
    });
    this.materials.push(material);

    return new THREE.Mesh(geometry, material);
  }

  /** Tint every ring; CoreEngine tweens the color during scene transitions. */
  public tintFells(color: THREE.Color, duration: number, gsap: typeof import('gsap').gsap): void {
    for (const material of this.materials) {
      gsap.to(material.color, { r: color.r, g: color.g, b: color.b, duration });
    }
  }

  public setTintImmediate(color: THREE.Color): void {
    for (const material of this.materials) {
      material.color.copy(color);
    }
  }

  public dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
  }
}
