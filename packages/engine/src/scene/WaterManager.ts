import * as THREE from 'three';
import { WaterMaterial } from '@windermere/shaders';

export interface WaterManagerOptions {
    waterHeight?: number;
    renderTargetSize?: number;
    normalMapUrl?: string | null;
}

export class WaterManager {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private mainCamera: THREE.PerspectiveCamera;

    private reflectionRenderTarget: THREE.WebGLRenderTarget;
    private mirrorCamera: THREE.PerspectiveCamera;
    private waterPlane: THREE.Mesh;
    private waterMaterial: WaterMaterial;

    private clock: THREE.Clock;
    private waterHeight: number;

    constructor(
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        options: WaterManagerOptions = {}
    ) {
        this.renderer = renderer;
        this.scene = scene;
        this.mainCamera = camera;
        this.waterHeight = options.waterHeight || 0;
        this.clock = new THREE.Clock();

        const renderTargetSize = options.renderTargetSize || 512;

        // 1. Setup Reflection Render Target
        this.reflectionRenderTarget = new THREE.WebGLRenderTarget(renderTargetSize, renderTargetSize, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            generateMipmaps: false,
        });

        // 2. Setup Mirror Camera
        this.mirrorCamera = this.mainCamera.clone();

        // 3. Setup Water Material
        this.waterMaterial = new WaterMaterial({
            reflectionTexture: this.reflectionRenderTarget.texture
        });

        // Optional normal map loading would typically happen via TextureManager,
        // but can be hooked up later through waterMaterial.setNormalTexture()

        // 4. Setup Water Plane
        const waterGeometry = new THREE.PlaneGeometry(10000, 10000, 10, 10);
        this.waterPlane = new THREE.Mesh(waterGeometry, this.waterMaterial);
        this.waterPlane.rotation.x = -Math.PI / 2;
        this.waterPlane.position.y = this.waterHeight;

        // Add to scene
        this.scene.add(this.waterPlane);
    }

    /**
     * Call this every frame to update uniforms and render reflections
     */
    public update() {
        // 1. Update time uniform for ripples
        const deltaTime = this.clock.getDelta();
        this.waterMaterial.updateTime(deltaTime);

        // 2. Render reflection
        this.renderReflection();
    }

    private renderReflection() {
        // Hide the water plane itself during reflection rendering
        this.waterPlane.visible = false;

        // Sync mirror camera with main camera
        this.mirrorCamera.copy(this.mainCamera);

        // Position mirror camera inverted along the water plane
        const cameraPos = this.mainCamera.position;
        this.mirrorCamera.position.y = -cameraPos.y + (2 * this.waterHeight);

        // Reflect camera rotation/look direction
        this.mirrorCamera.lookAt(
            this.mirrorCamera.position.x + this.mainCamera.getWorldDirection(new THREE.Vector3()).x,
            this.mirrorCamera.position.y - this.mainCamera.getWorldDirection(new THREE.Vector3()).y,
            this.mirrorCamera.position.z + this.mainCamera.getWorldDirection(new THREE.Vector3()).z
        );

        // Save current render target
        const currentRenderTarget = this.renderer.getRenderTarget();

        // Render scene to reflection target
        this.renderer.setRenderTarget(this.reflectionRenderTarget);
        this.renderer.clear();
        this.renderer.render(this.scene, this.mirrorCamera);

        // Restore original render target and show water plane again
        this.renderer.setRenderTarget(currentRenderTarget);
        this.waterPlane.visible = true;
    }

    public getWaterMaterial(): WaterMaterial {
        return this.waterMaterial;
    }

    public dispose() {
        this.reflectionRenderTarget.dispose();
        this.waterMaterial.dispose();
        this.waterPlane.geometry.dispose();
    }
}
