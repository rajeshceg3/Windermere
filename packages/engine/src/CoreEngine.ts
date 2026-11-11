import * as THREE from 'three';
// @ts-expect-error plain-JS module, no type declarations
import { renderLakeBuffers } from './lakeSoundscape.js';
import { CameraController } from './camera/CameraController';
import { WaterManager } from './scene/WaterManager';
import { gsap } from 'gsap';
import {
  MistMaterial,
  VolumetricCloudMaterial,
  SkyDomeMaterial,
  StarfieldMaterial,
} from '@windermere/shaders';
import { Rowboat } from './scene/Rowboat';
import { BirdFlock } from './scene/BirdFlock';
import { SailboatInstancing } from './scene/SailboatInstancing';
import { FishShadows } from './scene/FishShadows';
import { FireflyParticleSystem } from './scene/FireflyParticleSystem';
import { AudioEngine } from '@windermere/audio';
import { FPSOverlay } from './FPSOverlay';
import { featureFlags } from './FeatureFlags';
import { LODManager } from './managers/LODManager';
import { FrustumCullingManager } from './managers/FrustumCullingManager';
import { FellsRidgeline } from './scene/FellsRidgeline';
import { WoodedShore } from './scene/WoodedShore';

export type SceneState = 'DawnSurface' | 'MiddayExpanse' | 'TwilightStillness';

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
  private starfieldMaterial!: StarfieldMaterial;
  private starfield!: THREE.Mesh;
  private fireflies: FireflyParticleSystem;
  private fpsOverlay: FPSOverlay;
  private lodManager: LODManager;
  private frustumCullingManager: FrustumCullingManager;

  // Audio sources map
  private audioSources: Record<string, GainNode> = {};

  private reducedMotion = false;
  private birdTimer: number | null = null;
  private isContextLost = false;
  private fells!: FellsRidgeline;
  private animationFrameId: number | null = null;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.cameraController = new CameraController(canvas);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Log shader compilation failures
    if (this.renderer.debug) {
      this.renderer.debug.checkShaderErrors = true;
      this.renderer.debug.onShaderError = (
        gl,
        program,
        glVertexShader,
        glFragmentShader
      ) => {
        console.error('WebGL Shader Compilation Error!');
        const vertexLog = gl.getShaderInfoLog(glVertexShader);
        if (vertexLog) {
          console.error('Vertex Shader Error:\n', vertexLog);
        }
        const fragmentLog = gl.getShaderInfoLog(glFragmentShader);
        if (fragmentLog) {
          console.error('Fragment Shader Error:\n', fragmentLog);
        }
      };
    }

    // Set clear color for Dawn
    this.renderer.setClearColor(0x9a8c98);

    // Initialize Water Reflection Manager
    this.waterManager = new WaterManager(
      this.renderer,
      this.scene,
      this.cameraController.camera,
      {
        waterHeight: 0,
        renderTargetSize: window.innerWidth < 600 ? 1024 : 2048,
      }
    );

    this.clock = new THREE.Clock();

    this.lodManager = new LODManager();
    this.frustumCullingManager = new FrustumCullingManager();

    // FPS Overlay
    this.fpsOverlay = new FPSOverlay();
    if (featureFlags.isEnabled('fpsOverlay')) {
      this.fpsOverlay.show();
    } else {
      this.fpsOverlay.hide();
    }

    this.setupDawnLighting();
    this.setupMistParticles();

    this.fells = new FellsRidgeline();
    this.scene.add(this.fells.group);
    this.fells.setTintImmediate(new THREE.Color(0x416653));

    this.scene.add(new WoodedShore());
    this.rowboat = new Rowboat();
    this.rowboat.position.set(0, 0.1, -13);
    this.scene.add(this.rowboat);
    this.lodManager.addLOD(this.rowboat.lod);

    this.birdFlock = new BirdFlock();
    this.scene.add(this.birdFlock);

    this.sailboats = new SailboatInstancing(12);
    this.scene.add(this.sailboats);

    this.setupVolumetricClouds();

    this.fishShadows = new FishShadows(30);
    this.scene.add(this.fishShadows);

    this.setupStarfield();

    this.fireflies = new FireflyParticleSystem(0);
    this.scene.add(this.fireflies);

    this.audioEngine = new AudioEngine();
    /* Audio stays opt-in: no AudioContext is created until the first unmute. */

    // Register objects for Frustum Culling
    this.frustumCullingManager.registerObject(this.scene);

    // Reduce camera movement speed for Twilight Stillness
    this.cameraController.setSpeedMultiplier(0.85);

    this.setupContextLossHandling();

    this.animate();
  }

  private setupContextLossHandling() {
    this.canvas.addEventListener('webglcontextlost', this.onContextLost, false);
    this.canvas.addEventListener(
      'webglcontextrestored',
      this.onContextRestored,
      false
    );
  }

  private onContextLost = (event: Event) => {
    event.preventDefault();
    console.warn('WebGL Context Lost. Pausing animation loop.');
    this.isContextLost = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  };

  private onContextRestored = () => {
    console.info('WebGL Context Restored. Resuming animation loop.');
    this.isContextLost = false;

    // Optionally re-initialize resources here if not using three.js auto-recovery
    // For now, three.js handles most recovery automatically

    this.animate();
  };

  public dispose() {
    if (this.birdTimer !== null) window.clearInterval(this.birdTimer);
    this.fells?.dispose();
    this.cameraController.dispose();
    this.audioEngine.dispose();
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener(
      'webglcontextrestored',
      this.onContextRestored
    );
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    // other cleanup could go here
  }

  private async setupAudio() {
    await this.audioEngine.initialize();

    // Simulate setting up some audio sources for the profile
    const context = this.audioEngine.getContext();
    if (context) {
      this.audioSources['ambient_wind'] = context.createGain();
      this.audioSources['water_ripples'] = context.createGain();
      this.audioSources['ambient_piano'] = context.createGain();
      this.audioSources['crickets'] = context.createGain();
      this.audioSources['ambient_mist'] = context.createGain();
      this.audioSources['birds'] = context.createGain();

      Object.values(this.audioSources).forEach((source) => {
        source.connect(this.audioEngine.getMasterGain()!);
      });

      /* Place-true synthesized buffers: fell wind, shore lap, dawn hush,
         dawn chorus, evening crickets and owls. No samples, no voice. */
      const lake = renderLakeBuffers(context.sampleRate) as Record<
        string,
        { L: Float32Array; R: Float32Array }
      >;
      for (const key of [
        'ambient_wind',
        'water_ripples',
        'ambient_mist',
        'crickets',
        'birds',
      ]) {
        const data = lake[key];
        const buffer = context.createBuffer(
          2,
          data.L.length,
          context.sampleRate
        );
        buffer.getChannelData(0).set(data.L);
        buffer.getChannelData(1).set(data.R);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const level = context.createGain();
        level.gain.value = 0.9;
        source.connect(level).connect(this.audioSources[key]);
        source.start();
      }
      // Initialize with Dawn audio profile
      this.audioEngine.mapSceneAudioProfile('DawnSurface', this.audioSources);
    }
  }

  private audioSetupStarted = false;

  public toggleAudioMute(mute: boolean) {
    if (!mute && !this.audioSetupStarted) {
      this.audioSetupStarted = true;
      void this.setupAudio().then(async () => {
        await this.audioEngine.resume();
        this.audioEngine.setMute(false);
      });
      return;
    }
    if (this.audioEngine) {
      if (!mute) void this.audioEngine.resume();
      this.audioEngine.setMute(mute);
    }
  }

  public setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
    if (this.cameraController) {
      this.cameraController.setReducedMotion(reduced);
    }
  }

  public setLowPerformance(isLow: boolean) {
    if (this.renderer) {
      this.renderer.setPixelRatio(
        isLow ? 1 : Math.min(window.devicePixelRatio, 2)
      );
    }
  }

  public resetView() {
    this.cameraController.resetView();
  }

  public transitionToScene(targetScene: SceneState, duration: number = 3.0) {
    if (this.reducedMotion) duration = 0;
    let targetFogColor: THREE.Color;
    let targetFogDensity: number;
    let targetClearColor: THREE.Color;
    let targetSkyTop: THREE.Color;
    let targetSkyBottom: THREE.Color;
    let targetCloudDensity: number;
    let targetStarDensity: number;
    let targetFellsTint: THREE.Color;

    switch (targetScene) {
      case 'DawnSurface':
        targetFogColor = new THREE.Color(0x9a8c98);
        targetFogDensity = 0.0015;
        targetClearColor = new THREE.Color(0x9a8c98);
        targetSkyTop = new THREE.Color(0x87ceeb);
        targetSkyBottom = new THREE.Color(0xeac0a4);
        targetCloudDensity = 0.1;
        targetStarDensity = 0.0;
        targetFellsTint = new THREE.Color(0x416653);
        break;
      case 'MiddayExpanse':
        targetFogColor = new THREE.Color(0x87ceeb);
        targetFogDensity = 0.0012;
        targetClearColor = new THREE.Color(0x87ceeb);
        targetSkyTop = new THREE.Color(0x4f96bd);
        targetSkyBottom = new THREE.Color(0x87ceeb);
        targetCloudDensity = 0.15;
        targetStarDensity = 0.0;
        targetFellsTint = new THREE.Color(0x5c7386);
        break;
      case 'TwilightStillness':
        targetFogColor = new THREE.Color(0x1a1a2e);
        targetFogDensity = 0.0036;
        targetClearColor = new THREE.Color(0x1a1a2e);
        targetSkyTop = new THREE.Color(0x0f0c29);
        targetSkyBottom = new THREE.Color(0x302b63);
        targetCloudDensity = 0.05;
        targetStarDensity = 0.05;
        targetFellsTint = new THREE.Color(0x232344);
        break;
    }

    // GSAP visual transitions
    const fog = this.scene.fog as THREE.FogExp2;
    if (fog) {
      gsap.to(fog.color, {
        r: targetFogColor.r,
        g: targetFogColor.g,
        b: targetFogColor.b,
        duration,
      });
      gsap.to(fog, { density: targetFogDensity, duration });
    }

    const currentClearColor = new THREE.Color();
    this.renderer.getClearColor(currentClearColor);

    // Animate clear color via a dummy object
    const colorObj = {
      r: currentClearColor.r,
      g: currentClearColor.g,
      b: currentClearColor.b,
    };
    gsap.to(colorObj, {
      r: targetClearColor.r,
      g: targetClearColor.g,
      b: targetClearColor.b,
      duration,
      onUpdate: () => {
        this.renderer.setClearColor(
          new THREE.Color(colorObj.r, colorObj.g, colorObj.b)
        );
      },
    });

    if (this.skyDome && this.skyDome.material instanceof THREE.ShaderMaterial) {
      const topColor = this.skyDome.material.uniforms.topColor
        .value as THREE.Color;
      const bottomColor = this.skyDome.material.uniforms.bottomColor
        .value as THREE.Color;
      gsap.to(topColor, {
        r: targetSkyTop.r,
        g: targetSkyTop.g,
        b: targetSkyTop.b,
        duration,
      });
      gsap.to(bottomColor, {
        r: targetSkyBottom.r,
        g: targetSkyBottom.g,
        b: targetSkyBottom.b,
        duration,
      });
    }

    if (this.cloudMaterial) {
      gsap.to(this.cloudMaterial.uniforms.cloudDensity, {
        value: targetCloudDensity,
        duration,
      });
    }

    this.fells.tintFells(targetFellsTint, duration, gsap);

    if (this.starfieldMaterial) {
      gsap.to(this.starfieldMaterial.uniforms.starDensity, {
        value: targetStarDensity,
        duration,
      });
    }

    // Audio Transition (Crossfade handled linearly by AudioEngine internally over 2.0s)
    this.audioEngine.mapSceneAudioProfile(targetScene, this.audioSources);

    this.cameraController.setChapterView(targetScene);
    // Camera transition
    const targetSpeed = targetScene === 'TwilightStillness' ? 0.85 : 1.0;
    this.cameraController.transitionSpeedMultiplier(targetSpeed, duration);
  }

  private setupVolumetricClouds() {
    this.cloudMaterial = new VolumetricCloudMaterial({
      color: new THREE.Color(0xffffff),
      density: 0.15,
    });

    // Create cloud planes
    const cloudGeometry = new THREE.PlaneGeometry(300, 300, 64, 64);
    const cloudMesh = new THREE.Mesh(cloudGeometry, this.cloudMaterial);

    cloudMesh.rotation.x = -Math.PI / 2;
    cloudMesh.position.y = 40; // High above the scene

    this.scene.add(cloudMesh);
  }

  private setupMistParticles() {
    const particleCount = 180;
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
      color: new THREE.Color(0xdad7cd), // soft misty color
    });

    const particles = new THREE.Points(geometry, this.mistMaterial);
    this.scene.add(particles);
  }

  private setupDawnLighting() {
    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0xa6bdce, 1.15); // Soft gray
    this.scene.add(ambientLight);

    // Warm directional light representing the rising sun
    const directionalLight = new THREE.DirectionalLight(0xffd5a1, 2.2); // Light salmon/orange
    directionalLight.position.set(-35, 35, 20);
    this.scene.add(directionalLight);

    // Hemisphere light for sky/ground color gradients
    const hemiLight = new THREE.HemisphereLight(0xc9ada7, 0x4a4e69, 0.8);
    this.scene.add(hemiLight);

    // Denser fog to blend horizon for Twilight Stillness
    this.scene.fog = new THREE.FogExp2(0x9a8c98, 0.0015);

    // Add SkyDome for horizon gradient blending
    this.setupSkyDome();
  }

  private setupSkyDome() {
    const skyGeo = new THREE.SphereGeometry(800, 32, 15);
    const skyMat = new SkyDomeMaterial({
      topColor: new THREE.Color(0x87ceeb), // Sky blue
      bottomColor: new THREE.Color(0xeac0a4), // Match horizon
      offset: 10,
      exponent: 0.6,
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  private setupStarfield() {
    const starGeo = new THREE.SphereGeometry(450, 32, 32);
    this.starfieldMaterial = new StarfieldMaterial({
      starDensity: 0.05,
      starSize: 0.1,
    });
    this.starfield = new THREE.Mesh(starGeo, this.starfieldMaterial);

    // Reverse normals to render on the inside of the sphere
    this.starfieldMaterial.side = THREE.BackSide;

    this.scene.add(this.starfield);
  }

  private animate = () => {
    if (this.isContextLost) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // Update camera inertia and inputs
    this.cameraController.update();

    // Update water reflections and uniforms
    this.waterManager.update(this.reducedMotion);

    // Update mist particles
    if (this.mistMaterial) {
      this.mistMaterial.updateTime(this.reducedMotion ? 0 : delta);
    }

    // Update Volumetric Clouds
    if (this.cloudMaterial) {
      this.cloudMaterial.updateTime(this.reducedMotion ? 0 : delta);
      this.cloudMaterial.uniforms.cameraPosition.value.copy(
        this.cameraController.camera.position
      );
    }

    // Update LODs
    this.lodManager.update(this.cameraController.camera);

    // Update Rowboat bobbing
    if (this.rowboat) {
      // Gentle bobbing effect
      const time = this.reducedMotion ? 0 : this.clock.getElapsedTime();
      this.rowboat.position.y = 0.1 + Math.sin(time * 2) * 0.05;
      this.rowboat.rotation.z = Math.sin(time * 1.5) * 0.02;
      this.rowboat.rotation.x = Math.cos(time * 1.2) * 0.02;
    }

    // Update Bird Flock
    if (this.birdFlock) {
      const time = this.reducedMotion ? 0 : this.clock.getElapsedTime();
      this.birdFlock.update(time);
    }

    // Update Sailboats
    if (this.sailboats) {
      const time = this.reducedMotion ? 0 : this.clock.getElapsedTime();
      this.sailboats.update(time);
    }

    // Update Fish Shadows
    if (this.fishShadows) {
      const time = this.reducedMotion ? 0 : this.clock.getElapsedTime();
      this.fishShadows.update(time);
    }

    // Update Fireflies
    if (this.fireflies) {
      const time = this.reducedMotion ? 0 : this.clock.getElapsedTime();
      this.fireflies.update(time);
    }

    // Update Starfield
    if (this.starfieldMaterial) {
      this.starfieldMaterial.updateTime(this.reducedMotion ? 0 : delta);
    }

    this.renderer.render(this.scene, this.cameraController.camera);

    // Update FPS overlay
    if (featureFlags.isEnabled('fpsOverlay')) {
      this.fpsOverlay.update();
    }
  };
}
