import * as THREE from 'three';
import { gsap } from 'gsap';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private canvas: HTMLCanvasElement;

  // Interaction State
  private isInteracting = false;
  private pointerX = 0;
  private pointerY = 0;

  private entryYaw = 0;
  private entryPitch = -0.08;
  private targetRotationX = -0.08;
  private targetRotationY = 0;

  // Displacement, not a per-frame force. Same path has the same rotation at
  // 30/60/120Hz and motion stops on release. Prototype gain, not a safety limit.
  private readonly SENSITIVITY = 0.0007;
  private speedMultiplier = 1.0;
  private isReducedMotion = false;
  private activePointer: number | null = null;

  // Default starting position
  private basePosition = new THREE.Vector3(0, 3.4, 5);

  constructor(canvas: HTMLCanvasElement, fov = 55, near = 0.1, far = 1000) {
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
    window.addEventListener('pointerdown', this.onPointerDown, {
      passive: true,
    });
    window.addEventListener('pointermove', this.onPointerMove, {
      passive: true,
    });
    window.addEventListener('pointerup', this.onPointerUp, { passive: true });
    window.addEventListener('pointercancel', this.onPointerUp, {
      passive: true,
    });
    window.addEventListener('resize', this.onWindowResize, { passive: true });
    window.addEventListener('blur', this.onPointerUp);
    this.canvas.addEventListener('lostpointercapture', this.onPointerUp);
  }

  public dispose() {
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('blur', this.onPointerUp);
    this.canvas.removeEventListener('lostpointercapture', this.onPointerUp);
  }

  private onPointerDown = (event: PointerEvent) => {
    // Gestures never fight: drags that start on UI chrome belong to the chrome.
    const target = event.target as HTMLElement | null;
    if (
      target &&
      typeof target.closest === 'function' &&
      target.closest('header, nav, button, a, p, h1, label, input, select, dialog, .calm-sheet, .corner, .veil')
    ) {
      return;
    }
    if (this.activePointer !== null) return;
    if (target !== this.canvas) return;
    if (event.isPrimary === false || (event.button !== undefined && event.button !== 0)) return;
    this.activePointer = event.pointerId;
    this.isInteracting = true;
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    if (this.canvas.setPointerCapture) this.canvas.setPointerCapture(event.pointerId);
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.isInteracting || event.pointerId !== this.activePointer) return;
    const deltaX = event.clientX - this.pointerX;
    const deltaY = event.clientY - this.pointerY;
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    const gain = this.SENSITIVITY * Math.min(1, Math.max(0, this.speedMultiplier));
    this.targetRotationY -= deltaX * gain;
    this.targetRotationX = THREE.MathUtils.clamp(
      this.targetRotationX - deltaY * gain, -Math.PI / 12, Math.PI / 18
    );
    this.update();
  };

  private onPointerUp = (event?: Event) => {
    if (event instanceof PointerEvent && event.pointerId !== this.activePointer) return;
    const id = this.activePointer;
    this.isInteracting = false;
    this.activePointer = null;
    if (id !== null && this.canvas.hasPointerCapture?.(id)) this.canvas.releasePointerCapture(id);
  };

  public setSpeedMultiplier(multiplier: number) {
    this.speedMultiplier = multiplier;
  }

  public transitionSpeedMultiplier(target: number, duration: number = 2) {
    gsap.to(this, { speedMultiplier: target, duration });
  }

  public setReducedMotion(reduced: boolean) {
    this.isReducedMotion = reduced;
    this.onPointerUp();
    if (reduced) {
      gsap.killTweensOf(this.basePosition);
      // Settle at the current position, without completing a camera sweep.
    }
  }

  public turnView(direction: number) {
    this.onPointerUp();
    this.targetRotationY += Math.sign(direction) * Math.PI / 18;
    this.update();
  }

  public resetView() {
    this.onPointerUp();
    this.targetRotationY = this.entryYaw;
    this.targetRotationX = this.entryPitch;
    this.camera.rotation.set(this.entryPitch, this.entryYaw, 0);
  }

  public setChapterView(scene: string) {
    const views: Record<
      string,
      { pos: [number, number, number]; yaw: number; pitch: number }
    > = {
      DawnSurface: { pos: [0, 3.4, 5], yaw: 0, pitch: -0.08 },
      MiddayExpanse: { pos: [2, 4.2, 7], yaw: 0.08, pitch: -0.11 },
      TwilightStillness: { pos: [-1, 3.1, 5], yaw: -0.03, pitch: -0.07 },
    };
    const v = views[scene];
    if (!v) return;
    this.onPointerUp();
    this.entryYaw = v.yaw;
    this.entryPitch = v.pitch;
    this.targetRotationX = v.pitch;
    this.targetRotationY = v.yaw;
    gsap.to(this.basePosition, {
      x: v.pos[0],
      y: v.pos[1],
      z: v.pos[2],
      duration: this.isReducedMotion ? 0 : 3,
    });
  }

  private onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };

  public update() {
    this.camera.position.copy(this.basePosition);
    this.camera.rotation.set(this.targetRotationX, this.targetRotationY, 0, 'YXZ');

    this.canvas.dataset.yaw = this.camera.rotation.y.toFixed(5);
    this.canvas.dataset.pitch = this.camera.rotation.x.toFixed(5);
    // Depth-sensitive fog modulation based on camera positioning
    // (A conceptual placeholder for when the volumetric fog shader is implemented;
    // the scene or shader manager would read this value)
    const heightFactor = Math.max(0, this.camera.position.y);
    const fogModulation = THREE.MathUtils.clamp(
      1.0 - heightFactor * 0.1,
      0.0,
      1.0
    );
    // Setting custom userData property to be consumed by the Atmospheric System later
    this.camera.userData.fogModulation = fogModulation;
  }
}
