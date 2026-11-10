import * as THREE from 'three';

/** Open clinker-style hull, gunwales, thwarts and resting oars. */
export class Rowboat extends THREE.Group {
  public lod: THREE.LOD;
  constructor() {
    super();
    this.lod = new THREE.LOD();
    const detail = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({
      color: 0xa86636,
      roughness: 0.86,
      side: THREE.DoubleSide,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x5b3426,
      roughness: 0.9,
      side: THREE.DoubleSide,
    });
    const trim = new THREE.MeshStandardMaterial({
      color: 0xd3ad75,
      roughness: 0.8,
    });
    // Cross sections describe the pointed bow and broad middle. Axis X is length.
    const sections = [
      [-1.8, 0.025],
      [-1.4, 0.46],
      [-0.8, 0.65],
      [0, 0.7],
      [0.8, 0.62],
      [1.4, 0.38],
      [1.8, 0.02],
    ];
    const pos: number[] = [],
      idx: number[] = [];
    for (const [x, w] of sections) {
      pos.push(
        x,
        0.38,
        -w,
        x,
        -0.12,
        -w * 0.68,
        x,
        -0.24,
        0,
        x,
        -0.12,
        w * 0.68,
        x,
        0.38,
        w
      );
    }
    for (let s = 0; s < sections.length - 1; s++)
      for (let j = 0; j < 4; j++) {
        const a = s * 5 + j,
          b = a + 5;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geom.setIndex(idx);
    geom.computeVertexNormals();
    detail.add(new THREE.Mesh(geom, wood));
    const rail = (
      points: THREE.Vector3[],
      radius: number,
      material: THREE.Material
    ) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const m = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 36, radius, 6, false),
        material
      );
      detail.add(m);
    };
    for (const side of [-1, 1]) {
      rail(
        sections.map(([x, w]) => new THREE.Vector3(x, 0.39, w * side)),
        0.045,
        trim
      );
      for (const level of [0, 1])
        rail(
          sections.map(
            ([x, w]) =>
              new THREE.Vector3(
                x,
                0.08 - level * 0.13,
                w * (0.82 - level * 0.16) * side
              )
          ),
          0.014,
          dark
        );
    }
    for (const x of [-0.8, 0.55]) {
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.08, 1.08),
        trim
      );
      seat.position.set(x, 0.24, 0);
      detail.add(seat);
    }
    for (const side of [-1, 1]) {
      const oar = new THREE.Group();
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 2.8, 8),
        trim
      );
      shaft.rotation.x = Math.PI / 2;
      oar.add(shaft);
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.045, 0.55),
        wood
      );
      blade.position.z = 1.3;
      oar.add(blade);
      oar.position.set(-0.3, 0.43, side * 0.85);
      oar.rotation.y = side * 0.5;
      detail.add(oar);
    }
    this.lod.addLevel(detail, 0);
    // Preserve the recognisable hull at distance rather than swapping to a box.
    this.add(this.lod);
    this.rotation.y = 0.35;
  }
}
