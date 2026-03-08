import * as THREE from 'three';
import { CameraController } from './camera/CameraController';
import { WaterManager } from './scene/WaterManager';
import { MistMaterial, VolumetricCloudMaterial, SkyDomeMaterial } from '@windermere/shaders';
import { Rowboat } from './scene/Rowboat';
import { BirdFlock } from './scene/BirdFlock';
import { SailboatInstancing } from './scene/SailboatInstancing';
import { FishShadows } from './scene/FishShadows';
import { AudioEngine } from '@windermere/audio';

export class CoreEngine {
  private scene: THREE.Scene;
  private cameraController: CameraController;
  private renderer: THREE.WebGLRenderer;
  private waterManager: WaterManager;
  private mistMaterial!: MistMaterial;
  private rowboat: Rowboat;
  private birdFlock: BirdFlock;
  private sailboats: SailboatInstancing;
  private clock: THREE.Clock;
  private cloudMaterial!: VolumetricCloudMaterial;
  private fishShadows: FishShadows;
  private skyDome!: THREE.Mesh;
  private audioEngine: AudioEngine;

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

    this.sailboats = new SailboatInstancing(12);
    this.scene.add(this.sailboats);

    this.setupVolumetricClouds();

    this.fishShadows = new FishShadows(30);
    this.scene.add(this.fishShadows);

    this.audioEngine = new AudioEngine();
    this.setupAudio();

    this.animate();
  }

  private async setupAudio() {
    await this.audioEngine.initialize();

    // Simulate setting up some audio sources for the profile
    const context = this.audioEngine.getContext();
    if (context) {
      const ambientWind = context.createGain();
      const waterRipples = context.createGain();

      ambientWind.connect(this.audioEngine.getMasterGain()!);
      waterRipples.connect(this.audioEngine.getMasterGain()!);

      this.audioEngine.mapSceneAudioProfile('MiddayExpanse', {
        'ambient_wind': ambientWind,
        'water_ripples': waterRipples
      });
    }
  }

  private setupVolumetricClouds() {
    this.cloudMaterial = new VolumetricCloudMaterial({
      color: new THREE.Color(0xffffff),
      density: 0.15
    });

    // Create cloud planes
    const cloudGeometry = new THREE.PlaneGeometry(300, 300, 64, 64);
    const cloudMesh = new THREE.Mesh(cloudGeometry, this.cloudMaterial);

    cloudMesh.rotation.x = -Math.PI / 2;
    cloudMesh.position.y = 40; // High above the scene

    this.scene.add(cloudMesh);
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

    // Add SkyDome for horizon gradient blending
    this.setupSkyDome();
  }

  private setupSkyDome() {
    const skyGeo = new THREE.SphereGeometry(400, 32, 15);
    const skyMat = new SkyDomeMaterial({
      topColor: new THREE.Color(0x87ceeb), // Sky blue
      bottomColor: new THREE.Color(0xc9ada7), // Match horizon
      offset: 10,
      exponent: 0.6
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
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

    // Update Volumetric Clouds
    if (this.cloudMaterial) {
      this.cloudMaterial.updateTime(delta);
      this.cloudMaterial.uniforms.cameraPosition.value.copy(this.cameraController.camera.position);
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

    // Update Sailboats
    if (this.sailboats) {
      const time = this.clock.getElapsedTime();
      this.sailboats.update(time);
    }

    // Update Fish Shadows
    if (this.fishShadows) {
      const time = this.clock.getElapsedTime();
      this.fishShadows.update(time);
    }

    this.renderer.render(this.scene, this.cameraController.camera);
  };
}
