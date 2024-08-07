import * as THREE from 'three'

// Vertex Shader
const vertexShader = /* glsl */`
#define PI 3.1415926535897932384626433832795
#define _WaveA vec4(0.5, 0.5, 0.05, 21.0)
#define _WaveB vec4(0.5, 0.4, 0.05, 16.1)
#define _WaveC vec4(0.5, 0.3, 0.05, 12.2)
#define _WaveD vec4(0.5, 0.2, 0.05, 10.3)
#define _WaveE vec4(0.5, 0.1, 0.05, 6.4)
#define _WaveF vec4(0.5, 0.0, 0.05, 4.5)
#define _WaveG vec4(0.5, 0.1, 0.05, 2.6)
#define _WaveH vec4(0.5, 0.2, 0.05, 1.7)
#define _WaveI vec4(0.5, 0.3, 0.05, 0.8)

#define _WaveBend 0.1
#define _WaveBendLength 0.1
#define _WaveShape 0.4
uniform float u_time;

varying vec3 vPosition;
varying vec3 vNormal;

vec3 GerstnerWave(
    vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal
) {
  p.x += sin(p.z / wave.w / _WaveBendLength) * wave.w * _WaveBend;

  float steepness = wave.z;
  float wavelength = wave.w;
  float k = 2. * PI / wavelength;
  float c = sqrt(9.8 / k);
  vec2 d = normalize(wave.xy);
  float f = k * (dot(d, p.xz) - c * u_time);
  float a = steepness / (k * _WaveShape);

  //p.x += d.x * (a * cos(f));
  //p.y = a * sin(f);
  //p.z += d.y * (a * cos(f));

  tangent += vec3(
    -d.x * d.x * (steepness * sin(f)),
    d.x * (steepness * cos(f)),
    -d.x * d.y * (steepness * sin(f))
  );
  binormal += vec3(
    -d.x * d.y * (steepness * sin(f)),
    d.y * (steepness * cos(f)),
    -d.y * d.y * (steepness * sin(f))
  );
  return vec3(
    d.x * (a * cos(f)),
    a * sin(f),
    d.y * (a * cos(f))
  );
}

void main() {
    vec3 positionWS = (modelMatrix * vec4(position, 1.0)).xyz;

    vec3 tangent = vec3(1. ,0. ,0.);
    vec3 binormal = vec3(0., 0., 1.);
    vec3 positionOffset = vec3(0., 0., 0.);
    positionOffset += GerstnerWave(_WaveA, positionWS, tangent, binormal);
    positionOffset += GerstnerWave(_WaveB, positionWS, tangent, binormal);
    positionOffset += GerstnerWave(_WaveC, positionWS, tangent, binormal);
    positionOffset += GerstnerWave(_WaveD, positionWS, tangent, binormal);
    positionOffset += GerstnerWave(_WaveE, positionWS, tangent, binormal);
    positionOffset += GerstnerWave(_WaveF, positionWS, tangent, binormal);
    positionOffset += GerstnerWave(_WaveG, positionWS, tangent, binormal);
    positionOffset += GerstnerWave(_WaveH, positionWS, tangent, binormal);
    positionOffset += GerstnerWave(_WaveI, positionWS, tangent, binormal);
    positionWS += positionOffset;
    vPosition = positionWS;
    vNormal = normalize(cross(binormal, tangent));
    gl_Position = projectionMatrix * viewMatrix * vec4(positionWS, 1.0);
}
`;

// Fragment Shader
const fragmentShader = /* glsl */`
// Uniforms
uniform samplerCube u_skybox;
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


// Varyings
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    vec3 normal = normalize(vNormal);
    vec3 lightDirection = normalize(vec3(0.5, 0.1, 0.5));
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

    vec3 color = fresnelColor + specularColor + waterColor;

    // color = pow(color, vec3(1.7));

    gl_FragColor = vec4(color, 1.0);
}
`;

export default new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0.0 },
    u_skybox: { value: new THREE.CubeTextureLoader().setPath("/assets/").load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']) },
    u_fresnelStrength: { value: 1.2 },
    u_fresnelPower: { value: 1.0 },
    u_fresnelBias: { value: 0.13 },
    u_fresnelNormalStrength: { value: 1.0 },
    u_specularStrength: { value: 10.0 },
    u_specularPower: { value: 300.0 },
    u_specularNormalStrength: { value: 1.0 },
    u_underwaterLightStrength: { value: 1.0 },
    u_underwaterLightPower: { value: 2.0 },
    u_underwaterFogPower: { value: 0.3 },
    u_shallowWater: { value: new THREE.Color(0x10afaf) },
    u_deepWater: { value: new THREE.Color(0x000a57) }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  side: THREE.FrontSide,
  // wireframe: true
});