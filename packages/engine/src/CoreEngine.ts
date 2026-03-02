import * as THREE from 'three';
import { CameraController } from './camera/CameraController';

export class CoreEngine {
  private scene: THREE.Scene;
  private cameraController: CameraController;
  private renderer: THREE.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.cameraController = new CameraController(canvas);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);

    this.animate();
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    // Update camera inertia and inputs
    this.cameraController.update();

    this.renderer.render(this.scene, this.cameraController.camera);
  };
}
