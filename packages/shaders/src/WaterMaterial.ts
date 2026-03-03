import * as THREE from 'three';

const vertexShader = `
uniform float uTime;
varying vec2 vUv;
varying vec4 vScreenPos;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

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
    vec2 screenCoord = (vScreenPos.xy / vScreenPos.w) * 0.5 + 0.5;

    // 2. Animate UVs for normal mapping (time-based ripple uniform)
    vec2 uv1 = vUv * 4.0 + vec2(uTime * 0.05, uTime * 0.02);
    vec2 uv2 = vUv * 6.0 + vec2(-uTime * 0.03, uTime * 0.04);

    // 3. Sample normal map twice for complex ripple pattern (subtle normal map distortion)
    vec4 normal1 = texture2D(tNormalMap, uv1);
    vec4 normal2 = texture2D(tNormalMap, uv2);

    // Unpack normals from [0, 1] to [-1, 1] and blend
    vec3 n1 = normal1.xyz * 2.0 - 1.0;
    vec3 n2 = normal2.xyz * 2.0 - 1.0;
    vec3 blendedNormal = normalize(n1 + n2);

    // Scale down normal distortion so it's subtle
    blendedNormal.xy *= 0.15;
    blendedNormal = normalize(blendedNormal);

    // Distort screen coordinates using the blended normal
    vec2 distortedScreenCoord = screenCoord + blendedNormal.xy * 0.1;

    // Clamp coordinates to avoid sampling outside the texture
    distortedScreenCoord = clamp(distortedScreenCoord, 0.001, 0.999);

    // 4. Sample reflection map
    vec4 reflectionColor = texture2D(tReflectionMap, distortedScreenCoord);

    // 5. Fresnel effect (amount of reflection based on view angle)
    vec3 viewDir = normalize(vViewPosition);
    vec3 worldNormal = normalize(vec3(0.0, 1.0, 0.0) + vec3(blendedNormal.x, 0.0, blendedNormal.y));

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
                tReflectionMap: { value: params.reflectionTexture || null },
                tNormalMap: { value: params.normalTexture || null },
                uWaterColor: { value: params.waterColor || new THREE.Color(0x001e0f) },
                uLightDirection: { value: params.lightDirection || new THREE.Vector3(1, 1, 1).normalize() },
                uReflectionStrength: { value: params.reflectionStrength !== undefined ? params.reflectionStrength : 0.8 },
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
