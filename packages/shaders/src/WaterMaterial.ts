import * as THREE from 'three';

const vertexShader = `
uniform float uTime;
uniform mat4 uTextureMatrix;
varying vec4 vReflectionCoord;
varying vec2 vUv;
varying vec4 vScreenPos;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vReflectionCoord=uTextureMatrix*worldPosition;

    vec4 mvPosition = viewMatrix * worldPosition;
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;

    // Calculate screen space coordinates for reflection mapping
    vScreenPos = gl_Position;
}
`;

const fragmentShader = `
uniform float uTime;
uniform sampler2D tReflectionMap;
varying vec4 vReflectionCoord;
uniform sampler2D tNormalMap;
uniform float uReflectionStrength;
uniform vec3 uWaterColor;
uniform vec3 uLightDirection;

varying vec2 vUv;
varying vec4 vScreenPos;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

void main() {
    // 1. Calculate screen coordinates for reflection map sampling
    vec2 screenCoord = vReflectionCoord.xy/vReflectionCoord.w;

    // Analytic world-space ripples work even without a normal-map asset.
    vec2 wave=vec2(sin(vWorldPosition.x*1.5+vWorldPosition.z*.4+uTime*.8),cos(vWorldPosition.z*2.3-vWorldPosition.x*.3-uTime*.6));
    vec3 blendedNormal=normalize(vec3(wave.x*.035,1.0,wave.y*.025));
    vec2 distortedScreenCoord=screenCoord+wave*.003;

    // Clamp coordinates to avoid sampling outside the texture
    distortedScreenCoord = clamp(distortedScreenCoord, 0.001, 0.999);

    // 4. Sample reflection map
    vec4 reflectionColor = texture2D(tReflectionMap, distortedScreenCoord);

    // 5. Fresnel effect (amount of reflection based on view angle)
    vec3 viewDir = normalize(cameraPosition-vWorldPosition);
    vec3 worldNormal = blendedNormal;

    float fresnel = dot(viewDir, worldNormal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 3.0); // Adjust falloff

    // 6. Basic Lighting (Specular highlight)
    vec3 lightDir = normalize(uLightDirection);
    vec3 halfVector = normalize(lightDir + viewDir);

    // Ensure both vectors are valid and dot product is > 0 before pow
    float dotProduct = max(dot(worldNormal, halfVector), 0.0);
    float specAmount = pow(dotProduct, 200.0);
    vec3 specularColor = vec3(1.0) * specAmount * 0.5; // Soft sunlight reflection

    // 7. Mix water color and reflection (optimized fragment cost - simple mixing)
    vec3 finalColor = mix(uWaterColor, reflectionColor.rgb, fresnel * uReflectionStrength);
    finalColor += specularColor;
    finalColor = mix(uWaterColor,finalColor,.35+.65*smoothstep(0.0,.35,screenCoord.y));

    gl_FragColor = vec4(finalColor, 1.0);

    // Apply tone mapping and color space
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export interface WaterMaterialParams {
  reflectionTexture?: THREE.Texture | null;
  normalTexture?: THREE.Texture | null;
  waterColor?: THREE.Color;
  lightDirection?: THREE.Vector3;
  reflectionStrength?: number;
}

export class WaterMaterial extends THREE.ShaderMaterial {
  constructor(params: WaterMaterialParams = {}) {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uTextureMatrix: { value: new THREE.Matrix4() },
        tReflectionMap: { value: params.reflectionTexture || null },
        tNormalMap: { value: params.normalTexture || null },
        uWaterColor: { value: params.waterColor || new THREE.Color(0x183f4c) },
        uLightDirection: {
          value:
            params.lightDirection || new THREE.Vector3(1, 1, 1).normalize(),
        },
        uReflectionStrength: {
          value:
            params.reflectionStrength !== undefined
              ? params.reflectionStrength
              : 0.8,
        },
      },
      transparent: true,
    });
  }

  public updateTime(deltaTime: number) {
    this.uniforms.uTime.value += deltaTime;
  }

  public setReflectionTexture(texture: THREE.Texture) {
    this.uniforms.tReflectionMap.value = texture;
  }

  public setNormalTexture(texture: THREE.Texture) {
    this.uniforms.tNormalMap.value = texture;
  }
}
