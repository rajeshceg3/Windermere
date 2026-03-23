import * as THREE from 'three';

export class LODManager {
  private lods: THREE.LOD[] = [];

  constructor() {}

  public addLOD(lod: THREE.LOD) {
    if (!this.lods.includes(lod)) {
      this.lods.push(lod);
    }
  }

  public removeLOD(lod: THREE.LOD) {
    const index = this.lods.indexOf(lod);
    if (index !== -1) {
      this.lods.splice(index, 1);
    }
  }

  public update(camera: THREE.Camera) {
    for (const lod of this.lods) {
      lod.update(camera);
    }
  }

  public dispose() {
    this.lods = [];
  }
}
