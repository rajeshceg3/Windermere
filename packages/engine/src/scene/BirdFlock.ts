import * as THREE from 'three';

export class BirdFlock extends THREE.Group {
  private instancedMesh: THREE.InstancedMesh;
  private curve: THREE.CatmullRomCurve3;
  private flockSize: number;
  private timeOffsets: number[] = [];
  private offsets: THREE.Vector3[] = [];
  private speed = 0.05; // Animation speed

  constructor() {
    super();

    // Define the spline path for the birds
    const pathPoints = [
      new THREE.Vector3(-50, 20, -100),
      new THREE.Vector3(-20, 15, -50),
      new THREE.Vector3(0, 10, -20),
      new THREE.Vector3(20, 18, -30),
      new THREE.Vector3(50, 25, -80),
      new THREE.Vector3(80, 20, -120),
    ];
    this.curve = new THREE.CatmullRomCurve3(pathPoints);

    // Create a very simple V-shaped bird geometry (or cone)
    const birdGeometry = new THREE.ConeGeometry(0.5, 1.5, 3);
    birdGeometry.rotateX(Math.PI / 2); // Point forward along Z
    const birdMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // Number of birds in the flock
    this.flockSize = 5;

    this.instancedMesh = new THREE.InstancedMesh(birdGeometry, birdMaterial, this.flockSize);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < this.flockSize; i++) {
      // Give each bird a slight random offset from the main path
      const offsetX = (Math.random() - 0.5) * 5;
      const offsetY = (Math.random() - 0.5) * 2;
      const offsetZ = (Math.random() - 0.5) * 5;
      this.offsets.push(new THREE.Vector3(offsetX, offsetY, offsetZ));

      // Stagger the birds along the path
      this.timeOffsets.push(i * 0.05 + Math.random() * 0.02);
    }

    this.add(this.instancedMesh);
  }

  update(time: number) {
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.flockSize; i++) {
      const offsetTime = this.timeOffsets[i];
      // Calculate normalized time along curve (0 to 1)
      const t = ((time * this.speed) + offsetTime) % 1.0;

      // Get position and tangent from the curve
      const position = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t);

      // Apply offset
      const localOffset = this.offsets[i];
      position.add(localOffset);

      dummy.position.copy(position);

      // Make the bird look forward along the curve tangent
      const lookAtTarget = position.clone().add(tangent);
      dummy.lookAt(lookAtTarget);

      // Wing flapping effect (simulate by rotating slightly or scaling)
      const flapSpeed = 15;
      dummy.scale.y = 1.0 + Math.sin(time * flapSpeed + i) * 0.3;
      dummy.scale.x = 1.0 + Math.sin(time * flapSpeed + i) * 0.1;

      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }
}
