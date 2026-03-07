import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class SailboatInstancing extends THREE.Group {
  private instancedMesh: THREE.InstancedMesh;
  private instancesCount: number;
  private dummy: THREE.Object3D;
  private instanceData: { speed: number; angle: number; radius: number; phase: number }[] = [];

  constructor(instancesCount = 10) {
    super();
    this.instancesCount = instancesCount;
    this.dummy = new THREE.Object3D();

    // Create Sailboat Geometry
    // We'll create a simple hull and a sail and merge them to use with InstancedMesh
    const hullGeometry = new THREE.CylinderGeometry(0.3, 0.2, 1.5, 8, 1, false, 0, Math.PI);
    hullGeometry.rotateZ(Math.PI / 2);
    hullGeometry.rotateX(Math.PI / 2);

    // Move hull up slightly so the bottom sits closer to 0
    hullGeometry.translate(0, 0.1, 0);

    const sailGeometry = new THREE.BufferGeometry();
    const sailVertices = new Float32Array([
      0, 0.2, -0.2, // Bottom back
      0, 0.2, 0.6,  // Bottom front
      0, 1.5, 0     // Top
    ]);
    sailGeometry.setAttribute('position', new THREE.BufferAttribute(sailVertices, 3));
    sailGeometry.computeVertexNormals();

    // Convert to non-indexed so attributes match
    const nonIndexedHull = hullGeometry.toNonIndexed();

    // Ensure both geometries have a 'uv' attribute (CylinderGeometry adds uv, sailGeometry doesn't have it by default)
    if (!sailGeometry.hasAttribute('uv')) {
        const count = sailGeometry.attributes.position.count;
        sailGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }

    // Create merged geometry
    const mergedGeometry = BufferGeometryUtils.mergeGeometries([nonIndexedHull, sailGeometry], false);

    const material = new THREE.MeshStandardMaterial({
      color: 0xf4f1de, // off-white
      roughness: 0.8,
      side: THREE.DoubleSide
    });

    this.instancedMesh = new THREE.InstancedMesh(mergedGeometry, material, this.instancesCount);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Initialize instances with random positions and attributes
    for (let i = 0; i < this.instancesCount; i++) {
      const radius = 20 + Math.random() * 80;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.05 + Math.random() * 0.05;
      const phase = Math.random() * Math.PI * 2;

      this.instanceData.push({ speed, angle, radius, phase });

      this.dummy.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );

      // Orient tangent to the circle
      this.dummy.rotation.y = -angle + Math.PI / 2;

      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.add(this.instancedMesh);
  }

  update(time: number) {
    for (let i = 0; i < this.instancesCount; i++) {
      const data = this.instanceData[i];

      // Slow circling movement
      const currentAngle = data.angle + time * data.speed;

      const x = Math.cos(currentAngle) * data.radius;
      const z = Math.sin(currentAngle) * data.radius;

      // Gentle bobbing
      const y = Math.sin(time * 2 + data.phase) * 0.1;

      this.dummy.position.set(x, y, z);

      // Orient tangent to the circle path, with some gentle rocking
      this.dummy.rotation.y = -currentAngle + Math.PI / 2;
      this.dummy.rotation.z = Math.sin(time * 1.5 + data.phase) * 0.05;
      this.dummy.rotation.x = Math.cos(time * 1.2 + data.phase) * 0.05;

      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }
}
