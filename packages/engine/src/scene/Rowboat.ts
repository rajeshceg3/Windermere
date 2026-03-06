import * as THREE from 'three';

export class Rowboat extends THREE.Group {
  public lod: THREE.LOD;

  constructor() {
    super();
    this.lod = new THREE.LOD();

    // High Detail (Level 0)
    const highDetailGroup = new THREE.Group();

    // Hull
    const hullGeometry = new THREE.CylinderGeometry(0.5, 0.4, 2.5, 8, 1, false, 0, Math.PI);
    hullGeometry.rotateZ(Math.PI / 2);
    hullGeometry.rotateX(Math.PI / 2);
    const hullMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    highDetailGroup.add(hull);

    // Seats
    const seatGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.3);
    const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });

    const seat1 = new THREE.Mesh(seatGeometry, seatMaterial);
    seat1.position.set(0.5, 0.2, 0);
    highDetailGroup.add(seat1);

    const seat2 = new THREE.Mesh(seatGeometry, seatMaterial);
    seat2.position.set(-0.5, 0.2, 0);
    highDetailGroup.add(seat2);

    this.lod.addLevel(highDetailGroup, 0);

    // Medium Detail (Level 1)
    const midDetailGroup = new THREE.Group();
    const midHullGeometry = new THREE.CylinderGeometry(0.5, 0.4, 2.5, 5, 1, false, 0, Math.PI);
    midHullGeometry.rotateZ(Math.PI / 2);
    midHullGeometry.rotateX(Math.PI / 2);
    const midHull = new THREE.Mesh(midHullGeometry, hullMaterial);
    midDetailGroup.add(midHull);

    this.lod.addLevel(midDetailGroup, 50);

    // Low Detail (Level 2)
    const lowDetailGroup = new THREE.Group();
    const lowGeometry = new THREE.BoxGeometry(2.5, 0.5, 1.0);
    const lowMesh = new THREE.Mesh(lowGeometry, hullMaterial);
    lowDetailGroup.add(lowMesh);

    this.lod.addLevel(lowDetailGroup, 100);

    this.add(this.lod);
  }

  update(camera: THREE.Camera) {
    this.lod.update(camera);
  }
}
