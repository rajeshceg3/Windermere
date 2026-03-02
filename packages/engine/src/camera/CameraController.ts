import * as THREE from 'three';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private canvas: HTMLCanvasElement;

  // Interaction State
  private isInteracting = false;
  private pointerX = 0;
  private pointerY = 0;

  private targetRotationX = 0;
  private targetRotationY = 0;

  private velocityX = 0;
  private velocityY = 0;

  // Physics constants for the floating inertia model
  private readonly DAMPING = 0.92;
  private readonly SENSITIVITY = 0.002;
  private readonly MAX_VELOCITY = 0.05;

  // Default starting position
  private basePosition = new THREE.Vector3(0, 2, 5);

  constructor(canvas: HTMLCanvasElement, fov = 75, near = 0.1, far = 1000) {
    this.canvas = canvas;
    this.camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      near,
      far
    );

    // Set initial position
    this.camera.position.copy(this.basePosition);

    // Initialize event listeners
    this.addEventListeners();
  }

  private addEventListeners() {
    // Passive event listeners for mobile touch adaptation
    window.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerup', this.onPointerUp, { passive: true });
    window.addEventListener('pointercancel', this.onPointerUp, { passive: true });
    window.addEventListener('resize', this.onWindowResize, { passive: true });
  }

  public dispose() {
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('resize', this.onWindowResize);
  }

  private onPointerDown = (event: PointerEvent) => {
    this.isInteracting = true;
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.isInteracting) return;

    const deltaX = event.clientX - this.pointerX;
    const deltaY = event.clientY - this.pointerY;

    this.pointerX = event.clientX;
    this.pointerY = event.clientY;

    // Apply gentle forces, clamped to avoid hard acceleration curves
    this.velocityX -= deltaX * this.SENSITIVITY;
    this.velocityY -= deltaY * this.SENSITIVITY;

    this.velocityX = THREE.MathUtils.clamp(this.velocityX, -this.MAX_VELOCITY, this.MAX_VELOCITY);
    this.velocityY = THREE.MathUtils.clamp(this.velocityY, -this.MAX_VELOCITY, this.MAX_VELOCITY);
  };

  private onPointerUp = () => {
    this.isInteracting = false;
  };

  private onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };

  public update() {
    // Apply floating inertia model
    this.targetRotationY += this.velocityX;
    this.targetRotationX += this.velocityY;

    // Clamp vertical rotation to avoid flipping upside down
    this.targetRotationX = THREE.MathUtils.clamp(
      this.targetRotationX,
      -Math.PI / 6, // Look up slightly
      Math.PI / 12  // Look down slightly
    );

    // Smoothly interpolate current rotation towards target rotation
    this.camera.rotation.y = THREE.MathUtils.lerp(this.camera.rotation.y, this.targetRotationY, 0.1);
    this.camera.rotation.x = THREE.MathUtils.lerp(this.camera.rotation.x, this.targetRotationX, 0.1);

    // Apply damping to gradually reduce velocity when not interacting
    if (!this.isInteracting) {
      this.velocityX *= this.DAMPING;
      this.velocityY *= this.DAMPING;
    }

    // Depth-sensitive fog modulation based on camera positioning
    // (A conceptual placeholder for when the volumetric fog shader is implemented;
    // the scene or shader manager would read this value)
    const heightFactor = Math.max(0, this.camera.position.y);
    const fogModulation = THREE.MathUtils.clamp(1.0 - heightFactor * 0.1, 0.0, 1.0);
    // Setting custom userData property to be consumed by the Atmospheric System later
    this.camera.userData.fogModulation = fogModulation;
  }
}
