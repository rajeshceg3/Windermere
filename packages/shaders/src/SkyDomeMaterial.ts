import * as THREE from 'three';

export class SkyDomeMaterial extends THREE.ShaderMaterial {
  constructor(options: { topColor?: THREE.Color, bottomColor?: THREE.Color, offset?: number, exponent?: number } = {}) {
    const topColor = options.topColor || new THREE.Color(0x0077ff);
    const bottomColor = options.bottomColor || new THREE.Color(0xffffff);
    const offset = options.offset !== undefined ? options.offset : 33.0;
    const exponent = options.exponent !== undefined ? options.exponent : 0.6;

    super({
      uniforms: {
        topColor: { value: topColor },
        bottomColor: { value: bottomColor },
        offset: { value: offset },
        exponent: { value: exponent },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }
}
