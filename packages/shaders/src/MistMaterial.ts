import * as THREE from 'three';

const vertexShader = `
uniform float uTime;
attribute float aSize;
varying vec2 vUv;
varying float vAlpha;

void main() {
    vUv = uv;

    // Slight drifting motion
    vec3 pos = position;
    pos.x += sin(uTime * 0.2 + pos.y) * 0.5;
    pos.z += cos(uTime * 0.15 + pos.x) * 0.5;
    pos.y += sin(uTime * 0.1 + pos.z) * 0.2;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Scale particles based on depth so they don't look weird up close
    gl_PointSize = aSize * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Fade out particles that are too close or too far
    float depth = -mvPosition.z;
    vAlpha = smoothstep(1.0, 10.0, depth) * (1.0 - smoothstep(150.0, 200.0, depth));
}
`;

const fragmentShader = `
uniform vec3 uColor;
varying vec2 vUv;
varying float vAlpha;

void main() {
    // Soft circular particle
    float dist = distance(gl_PointCoord, vec2(0.5));
    float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;

    // Ultra soft blending for mist
    alpha *= 0.15;

    gl_FragColor = vec4(uColor, alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export interface MistMaterialParams {
    color?: THREE.Color;
}

export class MistMaterial extends THREE.ShaderMaterial {
    constructor(params: MistMaterialParams = {}) {
        super({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0.0 },
                uColor: { value: params.color || new THREE.Color(0xffffff) }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending
        });
    }

    public updateTime(deltaTime: number) {
        this.uniforms.uTime.value += deltaTime;
    }
}
