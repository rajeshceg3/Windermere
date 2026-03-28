export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  private isMuted = false;

  constructor() {
    console.log('Audio Engine Initialized');
  }

  public async initialize() {
    if (this.isInitialized) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();

      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = this.isMuted ? 0 : 1;

      this.isInitialized = true;
      console.log('Audio Engine initialized successfully');
    } catch (e) {
      console.error('Failed to initialize Audio Engine:', e);
    }
  }

  public getContext(): AudioContext | null {
    return this.context;
  }

  public getMasterGain(): GainNode | null {
    return this.masterGain;
  }

  public async resume() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  public createSpatialSource(buffer: AudioBuffer, loop = true): { source: AudioBufferSourceNode, panner: PannerNode } | null {
    if (!this.context || !this.masterGain) return null;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    const panner = this.context.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';

    // Default spatial properties
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;

    source.connect(panner);
    panner.connect(this.masterGain);

    return { source, panner };
  }

  public updateSpatialSource(
    panner: PannerNode,
    position: { x: number, y: number, z: number },
    orientation: { x: number, y: number, z: number } = { x: 0, y: 0, z: -1 }
  ) {
    if (!this.context) return;

    // Use current time or a slight delay for smooth transition
    const time = this.context.currentTime + 0.1;

    // Set position
    if (panner.positionX) {
      panner.positionX.linearRampToValueAtTime(position.x, time);
      panner.positionY.linearRampToValueAtTime(position.y, time);
      panner.positionZ.linearRampToValueAtTime(position.z, time);
    } else {
      panner.setPosition(position.x, position.y, position.z);
    }

    // Set orientation
    if (panner.orientationX) {
      panner.orientationX.linearRampToValueAtTime(orientation.x, time);
      panner.orientationY.linearRampToValueAtTime(orientation.y, time);
      panner.orientationZ.linearRampToValueAtTime(orientation.z, time);
    } else {
      panner.setOrientation(orientation.x, orientation.y, orientation.z);
    }
  }

  public setListenerPosition(
    position: { x: number, y: number, z: number },
    forward: { x: number, y: number, z: number },
    up: { x: number, y: number, z: number } = { x: 0, y: 1, z: 0 }
  ) {
    if (!this.context) return;

    const listener = this.context.listener;
    const time = this.context.currentTime + 0.1;

    // Position
    if (listener.positionX) {
      listener.positionX.linearRampToValueAtTime(position.x, time);
      listener.positionY.linearRampToValueAtTime(position.y, time);
      listener.positionZ.linearRampToValueAtTime(position.z, time);
    } else {
      listener.setPosition(position.x, position.y, position.z);
    }

    // Orientation
    if (listener.forwardX) {
      listener.forwardX.linearRampToValueAtTime(forward.x, time);
      listener.forwardY.linearRampToValueAtTime(forward.y, time);
      listener.forwardZ.linearRampToValueAtTime(forward.z, time);
      listener.upX.linearRampToValueAtTime(up.x, time);
      listener.upY.linearRampToValueAtTime(up.y, time);
      listener.upZ.linearRampToValueAtTime(up.z, time);
    } else {
      listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  public mapSceneAudioProfile(scene: 'DawnSurface' | 'MiddayExpanse' | 'TwilightStillness', audioSources: Record<string, GainNode>) {
    if (!this.context) return;
    const time = this.context.currentTime + 2.0; // 2 seconds crossfade

    // Default volumes for all scenes to zero
    Object.values(audioSources).forEach(source => {
      source.gain.linearRampToValueAtTime(0, time);
    });

    switch (scene) {
      case 'DawnSurface':
        if (audioSources['ambient_mist']) audioSources['ambient_mist'].gain.linearRampToValueAtTime(1.0, time);
        if (audioSources['birds']) audioSources['birds'].gain.linearRampToValueAtTime(0.5, time);
        break;
      case 'MiddayExpanse':
        if (audioSources['ambient_wind']) audioSources['ambient_wind'].gain.linearRampToValueAtTime(1.0, time);
        if (audioSources['water_ripples']) audioSources['water_ripples'].gain.linearRampToValueAtTime(0.8, time);
        break;
      case 'TwilightStillness':
        if (audioSources['ambient_piano']) audioSources['ambient_piano'].gain.linearRampToValueAtTime(1.0, time);
        if (audioSources['crickets']) audioSources['crickets'].gain.linearRampToValueAtTime(0.6, time);
        break;
    }
  }

  public modulateAudioBasedOnIdle(isIdle: boolean, targetGainNode: GainNode) {
    if (!this.context) return;

    const time = this.context.currentTime + 3.0; // 3 seconds smooth fade
    const targetVolume = isIdle ? 0.6 : 1.0; // Reduce volume by 40% when idle

    targetGainNode.gain.linearRampToValueAtTime(targetVolume, time);
  }

  public setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.masterGain && this.context) {
      this.masterGain.gain.linearRampToValueAtTime(mute ? 0 : 1, this.context.currentTime + 0.1);
    }
  }
}
