import * as THREE from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

export class TextureManager {
  private ktx2Loader: KTX2Loader;

  constructor(renderer: THREE.WebGLRenderer) {
    this.ktx2Loader = new KTX2Loader()
      .setTranscoderPath('/basis/')
      .detectSupport(renderer);
  }

  public getLoader(): KTX2Loader {
    return this.ktx2Loader;
  }
}
