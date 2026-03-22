import * as THREE from 'three';

/**
 * FrustumCullingManager ensures all renderable objects in the scene have
 * properly computed bounding volumes (boundingSphere) so that Three.js's
 * built-in WebGLRenderer frustum culling works optimally without manual CPU
 * visibility checks in the render loop.
 */
export class FrustumCullingManager {
  constructor() {}

  /**
   * Traverses the scene or object to ensure frustum culling is enabled
   * and computes bounding spheres for objects that might be missing them
   * (e.g. dynamic InstancedMesh, Points).
   */
  public registerObject(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh || child instanceof THREE.Points) {
        child.frustumCulled = true;

        if (!child.geometry.boundingSphere) {
          child.geometry.computeBoundingSphere();
        }

        // For InstancedMesh or Points that spread out widely, the default bounding sphere
        // might only cover the base geometry at origin. We might need to enlarge it
        // based on instance data or point spread if needed, but for now, we ensure
        // at least a basic bounding sphere exists.

        // Custom handling for specific systems if they are known to spread widely:
        if (child instanceof THREE.InstancedMesh) {
          // A safe large bounding sphere for our sailboats/fish
          child.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 300);
        } else if (child instanceof THREE.Points) {
          // A safe large bounding sphere for our mist/fireflies
          child.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 300);
        }
      }
    });
  }
}
