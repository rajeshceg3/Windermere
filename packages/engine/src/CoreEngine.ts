import * as THREE from 'three';
import { CameraController } from './camera/CameraController';
import { WaterManager } from './scene/WaterManager';
import { MistMaterial } from '@windermere/shaders';
import { Rowboat } from './scene/Rowboat';
import { BirdFlock } from './scene/BirdFlock';

export class CoreEngine {
  private scene: THREE.Scene;
  private cameraController: CameraController;
  private renderer: THREE.WebGLRenderer;
  private waterManager: WaterManager;
  private mistMaterial!: MistMaterial;
  private rowboat: Rowboat;
  private birdFlock: BirdFlock;
  private clock: THREE.Clock;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.cameraController = new CameraController(canvas);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Set clear color for Dawn
    this.renderer.setClearColor(0x9a8c98);

    // Initialize Water Reflection Manager
    this.waterManager = new WaterManager(this.renderer, this.scene, this.cameraController.camera, {
      waterHeight: 0,
      renderTargetSize: 512
    });

    this.clock = new THREE.Clock();

    this.setupDawnLighting();
    this.setupMistParticles();

    this.rowboat = new Rowboat();
    this.rowboat.position.set(0, 0.1, -10);
    this.scene.add(this.rowboat);

    this.birdFlock = new BirdFlock();
    this.scene.add(this.birdFlock);

    this.animate();
  }

  private setupMistParticles() {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Spread particles across the lake surface
      positions[i * 3] = (Math.random() - 0.5) * 200; // x
      positions[i * 3 + 1] = Math.random() * 2 + 0.1; // y (just above water)
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200; // z

      sizes[i] = Math.random() * 2.0 + 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    this.mistMaterial = new MistMaterial({
      color: new THREE.Color(0xdad7cd) // soft misty color
    });

    const particles = new THREE.Points(geometry, this.mistMaterial);
    this.scene.add(particles);
  }

  private setupDawnLighting() {
    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Soft gray
    this.scene.add(ambientLight);

    // Warm directional light representing the rising sun
    const directionalLight = new THREE.DirectionalLight(0xffa07a, 1.5); // Light salmon/orange
    directionalLight.position.set(10, 5, -10);
    this.scene.add(directionalLight);

    // Hemisphere light for sky/ground color gradients
    const hemiLight = new THREE.HemisphereLight(0xc9ada7, 0x4a4e69, 0.8);
    this.scene.add(hemiLight);

    // Subtle fog to blend horizon
    this.scene.fog = new THREE.Fog(0x9a8c98, 20, 150);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // Update camera inertia and inputs
    this.cameraController.update();

    // Update water reflections and uniforms
    this.waterManager.update();

    // Update mist particles
    if (this.mistMaterial) {
      this.mistMaterial.updateTime(delta);
    }

    // Update Rowboat LOD
    if (this.rowboat) {
      this.rowboat.update(this.cameraController.camera);
      // Gentle bobbing effect
      const time = this.clock.getElapsedTime();
      this.rowboat.position.y = 0.1 + Math.sin(time * 2) * 0.05;
      this.rowboat.rotation.z = Math.sin(time * 1.5) * 0.02;
      this.rowboat.rotation.x = Math.cos(time * 1.2) * 0.02;
    }

    // Update Bird Flock
    if (this.birdFlock) {
      const time = this.clock.getElapsedTime();
      this.birdFlock.update(time);
    }

    this.renderer.render(this.scene, this.cameraController.camera);
  };
}
