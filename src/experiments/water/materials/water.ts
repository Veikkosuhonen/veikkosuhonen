import * as THREE from 'three'
import { skyBox } from '../skybox';

// Vertex Shader
const vertexShader = /* glsl */`
#define PI 3.1415926535897932384626433832795
#define _WaveA vec4(0.5, 0.5, 0.05, 21.0)
#define _WaveB vec4(0.5, 0.41, 0.06, 16.1)
#define _WaveC vec4(0.5, 0.32, 0.05, 12.2)
#define _WaveD vec4(0.5, 0.23, 0.05, 10.3)
#define _WaveE vec4(0.5, 0.24, 0.05, 6.4)
#define _WaveF vec4(0.5, 0.25, 0.05, 4.5)
#define _WaveG vec4(0.5, 0.16, 0.05, 2.6)
#define _WaveH vec4(0.5, 0.27, 0.05, 1.7)
#define _WaveI vec4(0.5, 0.38, 0.05, 0.8)

#define _WaveBend 0.1
#define _WaveBendLength 0.1
#define _WaveShape 0.4
#define _WaveAmp 0.8
#define _WaveScale 2.0
uniform float u_time;

uniform sampler2D u_heightMap;

varying float vDistanceField;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vPeak;

vec3 GerstnerWave(
    vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal, inout float peak, in vec2 islandDirection
) {
  wave.w /= _WaveScale;
  p.x += sin(p.z / wave.w / _WaveBendLength) * wave.w * _WaveBend;

  float dotI = dot(-wave.xy, islandDirection);

  // Rotate wave towards center when near island
  float distanceToIsland = length(p.xz);
  float waveRotation = pow(smoothstep(20.0, 0.0, distanceToIsland), 2.0) * pow(smoothstep(10.0, 2.0, vDistanceField), 2.0);
  p.xz = mix(p.xz, islandDirection, sign(dotI) * waveRotation);

  vec2 d = normalize(wave.xy);

  // Dot wave dir with island direction.
  float waveAmp = _WaveAmp * (1.0 + dotI * smoothstep(9.0, 1.0, vDistanceField));
  waveAmp *= smoothstep(0.0, 5.0, length(p.xz));
  waveAmp = min(waveAmp, 1.4);

  float steepness = wave.z * waveAmp;
  float wavelength = wave.w;
  float k = 2. * PI / wavelength;
  float c = sqrt(9.8 / k);
  
  float f = k * (dot(d, p.xz) - c * u_time);
  float a = steepness / (k * _WaveShape);

  float sinf = sin(f);
  float cosf = cos(f);
  float ssinf = steepness * sinf;
  float scosf = steepness * cosf;

  peak += ssinf;

  tangent += vec3(
    -d.x * d.x * ssinf,
    d.x * scosf,
    -d.x * d.y * ssinf
  );
  binormal += vec3(
    -d.x * d.y * ssinf,
    d.y * scosf,
    -d.y * d.y * ssinf
  );
  return vec3(
    d.x * (a * cosf),
    a * sinf,
    d.y * (a * cosf)
  );
}

void main() {
    vec3 positionWS = (modelMatrix * vec4(position, 1.0)).xyz;
    vec2 worldUV = positionWS.xz;

    vec2 distanceFieldCoord = worldUV / 64.0 + vec2(0.5, -0.5);
    distanceFieldCoord.y = -distanceFieldCoord.y;

    float h = texture2D(u_heightMap, distanceFieldCoord).r;
    vDistanceField = 0.0 - h;
    float overBoundsX = step(0.95, distanceFieldCoord.x) * (distanceFieldCoord.x - 0.95);
    float overBoundsY = step(0.95, distanceFieldCoord.y) * (distanceFieldCoord.y - 0.95);
    float underBoundsX = step(distanceFieldCoord.x, 0.05) * -distanceFieldCoord.x;
    float underBoundsY = step(distanceFieldCoord.y, 0.05) * -distanceFieldCoord.y;
    float outofBoundsAttenuation = max(overBoundsX, max(overBoundsY, max(underBoundsX, underBoundsY)));
    vDistanceField += 20.0 * outofBoundsAttenuation;

    vec2 islandDirection = normalize(worldUV);

    vec3 tangent = vec3(1. ,0. ,0.);
    vec3 binormal = vec3(0., 0., 1.);
    vec3 positionOffset = vec3(0., 0., 0.);
    float peak = 0.0;
    positionOffset += GerstnerWave(_WaveA, positionWS, tangent, binormal, peak, islandDirection);
    positionOffset += GerstnerWave(_WaveB, positionWS, tangent, binormal, peak, islandDirection);
    positionOffset += GerstnerWave(_WaveC, positionWS, tangent, binormal, peak, islandDirection);
    positionOffset += GerstnerWave(_WaveD, positionWS, tangent, binormal, peak, islandDirection);
    positionOffset += GerstnerWave(_WaveE, positionWS, tangent, binormal, peak, islandDirection);
    positionOffset += GerstnerWave(_WaveF, positionWS, tangent, binormal, peak, islandDirection);
    positionOffset += GerstnerWave(_WaveG, positionWS, tangent, binormal, peak, islandDirection);
    positionOffset += GerstnerWave(_WaveH, positionWS, tangent, binormal, peak, islandDirection);
    positionOffset += GerstnerWave(_WaveI, positionWS, tangent, binormal, peak, islandDirection);
    positionWS += positionOffset;


    vPosition = positionWS;

    vNormal = normalize(cross(binormal, tangent));

    vPeak = peak / 9.0;

    vUv = worldUV;

    gl_Position = projectionMatrix * viewMatrix * vec4(positionWS, 1.0);
}
`;

// Fragment Shader
const fragmentShader = /* glsl */`
precision highp float;

// Uniforms
uniform samplerCube u_skybox;
uniform sampler2D u_foam;
uniform sampler2D u_rippleNormal;
uniform float u_rippleStrength;
uniform float u_time;
uniform float u_fresnelStrength;
uniform float u_fresnelPower;
uniform float u_fresnelBias;
uniform float u_fresnelNormalStrength;
uniform float u_specularStrength;
uniform float u_specularPower;
uniform float u_specularNormalStrength;
uniform float u_underwaterLightStrength;
uniform float u_underwaterLightPower;
uniform float u_underwaterFogPower;
uniform float u_foamAmount;
uniform float u_peakBrightening;
uniform vec3 u_shallowWater;
uniform vec3 u_deepWater;
uniform vec3 u_sunDirection;

uniform sampler2D u_heightMap;

// Varyings
varying float vDistanceField;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vPeak;

#include <packing>

void main() {
    vec3 normal = normalize(vNormal);
  
    float ndotl = max(0.0, dot(normalize(u_sunDirection), normal));

    vec3 viewDirection = normalize(cameraPosition - vPosition);

    vec2 rippleNormal1 = texture2D(u_rippleNormal, vUv / 7.0 - vec2(0.5, 0.5) * u_time / 10.0).xy * 2.0 - 1.0;
    vec2 rippleNormal2 = texture2D(u_rippleNormal, vUv / 5.0 - vec2(0.4, 0.1) * u_time / 12.0).xy * 2.0 - 1.0;
    vec2 rippleNormal3 = texture2D(u_rippleNormal, vUv / 3.0 - vec2(0.1, 0.4) * u_time / 14.0).xy * 2.0 - 1.0;
    vec2 rippleNormal = rippleNormal1 + rippleNormal2 * 0.8 + rippleNormal3 * 0.6;
  
    normal.xz += rippleNormal * u_rippleStrength;
    normal = normalize(normal);

    vec3 lightDirection = normalize(u_sunDirection);
    vec3 halfwayDirection = normalize(lightDirection + viewDirection);
    vec3 reflectionDirection = reflect(-viewDirection, normal);

    // Fresnel
    vec3 fresnelNormal = normal;
    fresnelNormal.xz *= u_fresnelNormalStrength;
    fresnelNormal = normalize(fresnelNormal);

    float base = 1.0 - dot(viewDirection, fresnelNormal);
    float fresnel = pow(base, u_fresnelPower);
    fresnel += u_fresnelBias * (1.0 - fresnel);
    fresnel *= u_fresnelStrength;

    // Sample skybox
    vec3 skyboxDirection = reflectionDirection;
    skyboxDirection.x = -skyboxDirection.x;
    vec3 skybox = textureCube(u_skybox, skyboxDirection).rgb;
    vec3 fresnelColor = skybox * fresnel;

    // Peak effect
    float peak = max(0.0, vPeak);
    float foam = smoothstep(0.004, 0.05, peak) * u_foamAmount;
    foam *= (1.0 + smoothstep(1.0, 0.0, vDistanceField));
    foam += pow(smoothstep(0.5, -0.1, vDistanceField), 16.0) * 0.4;

    // Foam decrease specular power
    float specularPower = u_specularPower * (1.0 - foam * 0.1);

    // Specular
    vec3 specNormal = normal;
    specNormal.xz *= u_specularNormalStrength;
    specNormal = normalize(specNormal);
    float spec = pow(max(dot(halfwayDirection, specNormal), 0.0), specularPower) * ndotl * u_specularStrength;
    vec3 specularColor = vec3(1.0) * spec;

    // Fresnel for specular
    base = 1.0 - dot(viewDirection, halfwayDirection);
    fresnel = pow(base, 5.0);
    fresnel += u_fresnelBias * (1.0 - fresnel);
    specularColor *= fresnel;

    vec3 shallowWaterColor = u_shallowWater;
    // Brighten shallow water in peaks
    shallowWaterColor *= 1.0 + u_peakBrightening * foam;

    // Refraction
    vec3 refractDirection = refract(-viewDirection, normal, 1.0 / 1.333);
    float underwaterLightContrib = pow(max(0.0, dot(lightDirection, refractDirection)), u_underwaterLightPower);
    float underwaterLightAmount = (underwaterLightContrib) * u_underwaterLightStrength;

    float down = max(0.0, pow(max(0.0, -refractDirection.y), u_underwaterFogPower) - underwaterLightAmount);
    down = clamp(down - pow(smoothstep(1.5, 0.2, vDistanceField), 2.0) * 0.05, 0.0, 1.0);
    vec3 waterColor = mix(shallowWaterColor, u_deepWater, down);

    // Foam
    vec3 foamColor = texture2D(u_foam, vUv / 4.0).rgb;
    waterColor += foamColor * foam;

    vec3 color = fresnelColor + waterColor + specularColor;

    float dist = length(vPosition - cameraPosition);
    float fogFactor = pow(2.0, -dist * 0.0002);
    color = mix(color, vec3(1.0), 1.0 - fogFactor);

    gl_FragColor = vec4(color, 1.0);
}
`;

const foam = new THREE.TextureLoader().load("/assets/foam.jpg");
foam.wrapS = THREE.MirroredRepeatWrapping;
foam.wrapT = THREE.MirroredRepeatWrapping;

const rippleNormal = new THREE.TextureLoader().load("/assets/ripple_normal.jpg");
rippleNormal.wrapS = THREE.MirroredRepeatWrapping;
rippleNormal.wrapT = THREE.MirroredRepeatWrapping;

export default ({
  heightMap,
}: {
  heightMap: THREE.Texture,
}) => new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0.0 },
    u_skybox: { value: skyBox },
    u_foam: { value: foam },
    u_rippleNormal: { value: rippleNormal },
    u_rippleStrength: { value: 0.03 },
    u_fresnelStrength: { value: 2.0 },
    u_fresnelPower: { value: 3.0 },
    u_fresnelBias: { value: 0.02 },
    u_fresnelNormalStrength: { value: 1.5 },
    u_specularStrength: { value: 40.0 },
    u_specularPower: { value: 500.0 },
    u_specularNormalStrength: { value: 1.2 },
    u_underwaterLightStrength: { value: 0.7 },
    u_underwaterLightPower: { value: 2.6 },
    u_underwaterFogPower: { value: 0.2 },
    u_peakBrightening: { value: 1.5 },
    u_foamAmount: { value: 0.2  },
    u_shallowWater: { value: new THREE.Color(0x10afaf) },
    u_deepWater: { value: new THREE.Color(0x000a57) },
    u_sunDirection: { value: new THREE.Vector3(0.5, 0.5, 0) },
    u_heightMap: { value: heightMap },
    u_distanceCameraViewMatrix: { value: new THREE.Matrix4() },
    u_distanceCameraProjectionMatrix: { value: new THREE.Matrix4() },
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  side: THREE.FrontSide,
});
