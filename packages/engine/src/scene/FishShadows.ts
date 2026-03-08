import * as THREE from 'three';

export class FishShadows extends THREE.InstancedMesh {
  private count: number;
  private timeOffsets: Float32Array;
  private speeds: Float32Array;

  constructor(count = 20) {
    // Create a simple fish shape (elongated capsule/ellipse)
    const geometry = new THREE.CapsuleGeometry(0.2, 1, 4, 8);
    geometry.rotateX(Math.PI / 2); // Lay flat

    // Dark, semi-transparent material
    const material = new THREE.MeshBasicMaterial({
      color: 0x112233, // Dark blue/grey
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });

    super(geometry, material, count);
    this.count = count;

    this.timeOffsets = new Float32Array(count);
    this.speeds = new Float32Array(count);

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      // Random position within a certain radius
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 40 + 10;

      dummy.position.x = Math.cos(angle) * radius;
      dummy.position.y = -0.5 - Math.random() * 2; // Under the water surface
      dummy.position.z = Math.sin(angle) * radius;

      // Random orientation
      dummy.rotation.y = Math.random() * Math.PI * 2;

      // Random scale to vary fish sizes
      const scale = 0.5 + Math.random() * 0.5;
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      this.setMatrixAt(i, dummy.matrix);

      // Randomize movement parameters
      this.timeOffsets[i] = Math.random() * Math.PI * 2;
      this.speeds[i] = 0.2 + Math.random() * 0.3;
    }

    this.instanceMatrix.needsUpdate = true;
  }

  update(time: number) {
    const dummy = new THREE.Object3D();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const scale = new THREE.Vector3();

    for (let i = 0; i < this.count; i++) {
      this.getMatrixAt(i, matrix);
      matrix.decompose(position, rotation, scale);

      const t = time * this.speeds[i] + this.timeOffsets[i];

      // Gentle sine wave forward movement + slight side-to-side
      const forwardMovement = Math.sin(t) * 0.05;
      const sideMovement = Math.cos(t * 0.5) * 0.02;

      // Apply movement based on current rotation to move "forward"
      position.x += Math.sin(rotation.y) * forwardMovement + Math.cos(rotation.y) * sideMovement;
      position.z += Math.cos(rotation.y) * forwardMovement - Math.sin(rotation.y) * sideMovement;

      // Very slight vertical bobbing
      position.y += Math.sin(t * 1.5) * 0.005;

      // Keep them within bounds by gently turning them around if they go too far
      const distSq = position.x * position.x + position.z * position.z;
      if (distSq > 2500) { // Radius ~50
         rotation.y += 0.01; // Slowly turn
      }

      dummy.position.copy(position);
      dummy.rotation.copy(rotation);
      dummy.scale.copy(scale);
      dummy.updateMatrix();

      this.setMatrixAt(i, dummy.matrix);
    }

    this.instanceMatrix.needsUpdate = true;
  }
}
