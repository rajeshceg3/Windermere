import * as THREE from 'three';

export class BirdFlock extends THREE.Group {
  private birdMeshes: THREE.Mesh[] = [];
  private curve: THREE.CatmullRomCurve3;
  private timeOffsets: number[] = [];
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
    const flockSize = 5;

    for (let i = 0; i < flockSize; i++) {
      const bird = new THREE.Mesh(birdGeometry, birdMaterial);
      // Give each bird a slight random offset from the main path
      const offsetX = (Math.random() - 0.5) * 5;
      const offsetY = (Math.random() - 0.5) * 2;
      const offsetZ = (Math.random() - 0.5) * 5;
      bird.userData = { offset: new THREE.Vector3(offsetX, offsetY, offsetZ) };

      this.birdMeshes.push(bird);
      this.add(bird);

      // Stagger the birds along the path
      this.timeOffsets.push(i * 0.05 + Math.random() * 0.02);
    }
  }

  update(time: number) {
    this.birdMeshes.forEach((bird, index) => {
      const offset = this.timeOffsets[index];
      // Calculate normalized time along curve (0 to 1)
      const t = ((time * this.speed) + offset) % 1.0;

      // Get position and tangent from the curve
      const position = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t);

      // Apply offset
      const localOffset = bird.userData.offset as THREE.Vector3;
      position.add(localOffset);

      bird.position.copy(position);

      // Make the bird look forward along the curve tangent
      const lookAtTarget = position.clone().add(tangent);
      bird.lookAt(lookAtTarget);

      // Wing flapping effect (simulate by rotating slightly or scaling)
      const flapSpeed = 15;
      bird.scale.y = 1.0 + Math.sin(time * flapSpeed + index) * 0.3;
      bird.scale.x = 1.0 + Math.sin(time * flapSpeed + index) * 0.1;
    });
  }
}
