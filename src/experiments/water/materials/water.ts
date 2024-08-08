import * as THREE from 'three'

// Vertex Shader
const vertexShader = /* glsl */`
#define PI 3.1415926535897932384626433832795
#define _WaveA vec4(0.5, 0.5, 0.05, 21.0)
#define _WaveB vec4(0.5, 0.4, 0.06, 16.1)
#define _WaveC vec4(0.5, 0.3, 0.07, 12.2)
#define _WaveD vec4(0.5, 0.2, 0.05, 10.3)
#define _WaveE vec4(0.5, 0.1, 0.05, 6.4)
#define _WaveF vec4(0.5, 0.0, 0.05, 4.5)
#define _WaveG vec4(0.5, 0.11, 0.05, 2.6)
#define _WaveH vec4(0.5, 0.22, 0.05, 1.7)
#define _WaveI vec4(0.5, 0.33, 0.05, 0.8)

#define _WaveBend 0.1
#define _WaveBendLength 0.1
#define _WaveShape 0.4
#define _WaveAmp 1.2
#define _WaveScale 2.0
uniform float u_time;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vPeak;

vec3 GerstnerWave(
    vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal, inout float peak
) {
  wave.w /= _WaveScale;
  p.x += sin(p.z / wave.w / _WaveBendLength) * wave.w * _WaveBend;

  float steepness = wave.z * _WaveAmp;
  float wavelength = wave.w;
  float k = 2. * PI / wavelength;
  float c = sqrt(9.8 / k);
  vec2 d = normalize(wave.xy);
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

    vec3 tangent = vec3(1. ,0. ,0.);
    vec3 binormal = vec3(0., 0., 1.);
    vec3 positionOffset = vec3(0., 0., 0.);
    float peak = 0.0;
    positionOffset += GerstnerWave(_WaveA, positionWS, tangent, binormal, peak);
    positionOffset += GerstnerWave(_WaveB, positionWS, tangent, binormal, peak);
    positionOffset += GerstnerWave(_WaveC, positionWS, tangent, binormal, peak);
    positionOffset += GerstnerWave(_WaveD, positionWS, tangent, binormal, peak);
    positionOffset += GerstnerWave(_WaveE, positionWS, tangent, binormal, peak);
    positionOffset += GerstnerWave(_WaveF, positionWS, tangent, binormal, peak);
    positionOffset += GerstnerWave(_WaveG, positionWS, tangent, binormal, peak);
    positionOffset += GerstnerWave(_WaveH, positionWS, tangent, binormal, peak);
    positionOffset += GerstnerWave(_WaveI, positionWS, tangent, binormal, peak);
    positionWS += positionOffset;
    vPosition = positionWS;
    vNormal = normalize(cross(binormal, tangent));
    vPeak = peak / 9.0;
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * vec4(positionWS, 1.0);
}
`;

// Fragment Shader
const fragmentShader = /* glsl */`
precision highp float;

// Uniforms
uniform samplerCube u_skybox;
uniform sampler2D u_foam;
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
uniform vec3 u_shallowWater;
uniform vec3 u_deepWater;
uniform vec3 u_sunDirection;

// Varyings
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float vPeak;

void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    vec3 normal = normalize(vNormal);
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
    vec3 skybox = textureCube(u_skybox, reflectionDirection).rgb;
    vec3 fresnelColor = skybox * fresnel;

    // Specular
    float ndotl = max(dot(normal, lightDirection), 0.0);
    vec3 specNormal = normal;
    specNormal.xz *= u_specularNormalStrength;
    specNormal = normalize(specNormal);
    float spec = pow(max(dot(halfwayDirection, specNormal), 0.0), u_specularPower) * ndotl * u_specularStrength;
    vec3 specularColor = vec3(1.0) * spec;

    // Fresnel for specular
    base = 1.0 - dot(viewDirection, halfwayDirection);
    fresnel = pow(base, 5.0);
    fresnel += u_fresnelBias * (1.0 - fresnel);
    specularColor *= fresnel;

    // Refraction
    vec3 refractDirection = refract(-viewDirection, normal, 1.0 / 1.333);
    float underwaterLightContrib = pow(max(0.0, dot(lightDirection, refractDirection)), u_underwaterLightPower);
    float underwaterLightAmount = underwaterLightContrib * u_underwaterLightStrength;

    float down = max(0.0, pow(max(0.0, -refractDirection.y), u_underwaterFogPower) - underwaterLightAmount);
    vec3 waterColor = mix(u_shallowWater, u_deepWater, down);

    // Foam
    vec3 foamColor = texture2D(u_foam, vUv / 2.0).rgb;
    waterColor += foamColor * smoothstep(0.004, 0.05, vPeak);

    vec3 color = fresnelColor + specularColor + waterColor;

    float dist = length(vPosition - cameraPosition);
    float fogFactor = pow(2.0, -dist * 0.0004);
    color = mix(color, vec3(1.0), 1.0 - fogFactor);
  
    // color = pow(color, vec3(1.7));

    gl_FragColor = vec4(color, 1.0);
}
`;

export default new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0.0 },
    u_skybox: { value: new THREE.CubeTextureLoader().setPath("/assets/").load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']) },
    u_foam: { value: new THREE.TextureLoader().load("/assets/foam.jpg") },
    u_fresnelStrength: { value: 0.9 },
    u_fresnelPower: { value: 2.1 },
    u_fresnelBias: { value: 0.13 },
    u_fresnelNormalStrength: { value: 1.1 },
    u_specularStrength: { value: 40.0 },
    u_specularPower: { value: 100.0 },
    u_specularNormalStrength: { value: 1.2 },
    u_underwaterLightStrength: { value: 1.0 },
    u_underwaterLightPower: { value: 2.0 },
    u_underwaterFogPower: { value: 0.3 },
    u_shallowWater: { value: new THREE.Color(0x10afaf) },
    u_deepWater: { value: new THREE.Color(0x000a57) },
    u_sunDirection: { value: new THREE.Vector3(0.5, 0.5, 0) }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  side: THREE.FrontSide,
  // wireframe: true
});