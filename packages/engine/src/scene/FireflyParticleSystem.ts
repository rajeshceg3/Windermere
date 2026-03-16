import * as THREE from 'three';

export class FireflyParticleSystem extends THREE.Points {
  private customMaterial: THREE.ShaderMaterial;

  constructor(count = 500, spread = 200) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count); // Random phase for blinking

    for (let i = 0; i < count; i++) {
      // Spread them around the scene, keeping them mostly near the ground
      positions[i * 3] = (Math.random() - 0.5) * spread;     // x
      positions[i * 3 + 1] = Math.random() * 5 + 0.1;        // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread; // z

      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color: { value: new THREE.Color(0xd4ff00) }, // Yellow-green
      },
      vertexShader: `
        uniform float time;
        attribute float phase;
        varying float vAlpha;

        void main() {
          // Subtle vertical hovering
          vec3 pos = position;
          pos.y += sin(time * 2.0 + phase) * 0.5;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

          // Make size dependent on distance
          gl_PointSize = (15.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          // Blink effect
          vAlpha = sin(time * 3.0 + phase) * 0.5 + 0.5;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;

        void main() {
          // Create soft circular particles
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Smooth edge
          float alpha = (1.0 - (dist * 2.0)) * vAlpha;

          gl_FragColor = vec4(color, alpha * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    super(geometry, material);
    this.customMaterial = material;
  }

  update(time: number) {
    this.customMaterial.uniforms.time.value = time;
  }
}
