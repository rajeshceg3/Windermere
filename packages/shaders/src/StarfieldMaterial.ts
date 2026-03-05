import * as THREE from 'three';

export class StarfieldMaterial extends THREE.ShaderMaterial {
  constructor(options: { starDensity?: number, starSize?: number } = {}) {
    const starDensity = options.starDensity !== undefined ? options.starDensity : 0.05;
    const starSize = options.starSize !== undefined ? options.starSize : 0.1;

    super({
      uniforms: {
        time: { value: 0.0 },
        starDensity: { value: starDensity },
        starSize: { value: starSize },
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
        uniform float time;
        uniform float starDensity;
        uniform float starSize;
        varying vec3 vWorldPosition;

        float hash(vec3 p) {
            p  = fract( p*0.3183099+.1 );
            p *= 17.0;
            return fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
        }

        float star(vec3 ray, float density, float size) {
            vec3 p = floor(ray * density);
            vec3 f = fract(ray * density);
            float h = hash(p);

            // Randomize position within cell
            vec3 randPos = vec3(hash(p + vec3(1.0)), hash(p + vec3(2.0)), hash(p + vec3(3.0)));
            float dist = length(f - randPos);

            // Sparkle effect
            float sparkle = sin(time * 2.0 + h * 10.0) * 0.5 + 0.5;

            float brightness = smoothstep(size, 0.0, dist) * h * sparkle;
            return brightness;
        }

        void main() {
          vec3 ray = normalize(vWorldPosition);
          float brightness = star(ray, starDensity, starSize);
          gl_FragColor = vec4(vec3(brightness), brightness);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  updateTime(delta: number) {
    this.uniforms.time.value += delta;
  }
}
