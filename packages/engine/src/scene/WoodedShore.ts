import * as THREE from 'three';
/** A low wooded promontory gives the lake a readable middle distance. */
export class WoodedShore extends THREE.Group {
  constructor() {
    super();
    const earth = new THREE.MeshStandardMaterial({
      color: 0x526b42,
      roughness: 1,
    });
    const trunk = new THREE.MeshStandardMaterial({
      color: 0x6c5a43,
      roughness: 1,
    });
    const leaves = [0x294b36, 0x355b3c, 0x547146].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 1 })
    );
    const land = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 12), earth);
    land.scale.set(16, 2.8, 10);
    land.position.set(-19, -1, -88);
    this.add(land);
    for (let i = 0; i < 28; i++) {
      const a = i * 2.39996,
        r = Math.sqrt((i + 0.5) / 28),
        x = -19 + Math.cos(a) * r * 14,
        z = -88 + Math.sin(a) * r * 8;
      const height = 3.2 + Math.sin(i * 7.3) * 0.9;
      const y = 1.6 * (1 - r * 0.5);
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.28, height, 6),
        trunk
      );
      stem.position.set(x, y + height * 0.5, z);
      this.add(stem);
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1, 1),
        leaves[i % 3]
      );
      crown.scale.set(1.5, height * 0.72, 1.5);
      crown.position.set(x, y + height, z);
      this.add(crown);
    }
  }
}
