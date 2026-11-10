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
  private readonly materials: THREE.MeshStandardMaterial[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'FellsRidgeline';

    // Far ring: taller, softer (more fog between camera and ridge)
    this.group.add(
      this.buildRing({
        radius: 390,
        baseHeight: 14,
        peakHeight: 85,
        seed: 7.3,
        tint: 0x526c73,
      })
    );

    // Near ring: lower, closer, reads darker through less fog
    this.group.add(
      this.buildRing({
        radius: 230,
        baseHeight: 6,
        peakHeight: 34,
        seed: 2.9,
        tint: 0x355a48,
      })
    );
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
    const colors: number[] = [];
    const indices: number[] = [];

    const rings = 10;
    for (let j = 0; j <= rings; j++)
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const edge = options.radius * 0.62;
        const radius = edge + ((options.radius - edge) * j) / rings;
        const h =
          options.baseHeight +
          options.peakHeight *
            (0.45 +
              0.28 * Math.sin(theta * 3 + options.seed) +
              0.18 * Math.sin(theta * 7 + options.seed * 2.1) +
              0.09 * Math.sin(theta * 13 + options.seed * 4.7));
        const y =
          -1 +
          Math.pow(j / rings, 1.35) *
            h *
            (1 +
              0.13 *
                Math.sin(theta * 11 + j * 0.8) *
                Math.sin((j / rings) * Math.PI));
        const tint = new THREE.Color(options.tint).lerp(
          new THREE.Color(0x86917a),
          (j / rings) * 0.4
        );
        tint.multiplyScalar(0.84 + 0.16 * Math.sin(theta * 17 + j * 0.4));
        colors.push(tint.r, tint.g, tint.b);
        positions.push(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
        if (j < rings && i < segments) {
          const a = j * (segments + 1) + i,
            b = a + segments + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      roughness: 1,
      vertexColors: true,
      color: new THREE.Color(0xffffff),
      fog: true,
      side: THREE.DoubleSide,
    });
    this.materials.push(material);

    return new THREE.Mesh(geometry, material);
  }

  /** Tint every ring; CoreEngine tweens the color during scene transitions. */
  public tintFells(
    color: THREE.Color,
    duration: number,
    gsap: typeof import('gsap').gsap
  ): void {
    for (const material of this.materials) {
      const night = color.getHex() === 0x232344;
      gsap.to(material.color, {
        r: night ? 0.28 : 1,
        g: night ? 0.32 : 1,
        b: night ? 0.55 : 1,
        duration,
      });
    }
  }

  public setTintImmediate(color: THREE.Color): void {
    for (const material of this.materials) {
      material.color.set(color.getHex() === 0x232344 ? 0x596084 : 0xffffff);
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
