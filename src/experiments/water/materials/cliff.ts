import * as THREE from 'three'
import { skyBox } from '../skybox';

// Vertex Shader
const vertexShader = /* glsl */`

uniform sampler2D u_heightMap;

varying vec3 vPosition;
varying vec3 vNormal;


void main() {
    float y = texture2D(u_heightMap, uv).r;
    vec3 newPos = position + vec3(0.0, 10.0 * y, 0.0);
    vec3 positionWS = (modelMatrix * vec4(newPos, 1.0)).xyz;
  
    float s = 1.0/512.0;
    vec3 off = vec3(s, s, 0.0);
    float hL = texture2D(u_heightMap, uv - off.xz).r;
    float hR = texture2D(u_heightMap, uv + off.xz).r;
    float hD = texture2D(u_heightMap, uv - off.zy).r;
    float hU = texture2D(u_heightMap, uv + off.zy).r;

    // deduce terrain normal
    vec3 normal = vec3(
      hL - hR,
      2. * s,
      hU - hD
    );
    normal = normalize(normal.xyz);

    vPosition = positionWS;
    vNormal = normal;
    gl_Position = projectionMatrix * viewMatrix * vec4(positionWS, 1.0);
}
`;

// Fragment Shader
const fragmentShader = /* glsl */`
precision highp float;

// Uniforms
uniform samplerCube u_skybox;
uniform sampler2D u_rippleNormal;
uniform float u_rippleStrength;
uniform float u_time;
uniform float u_specularStrength;
uniform float u_specularPower;
uniform float u_specularNormalStrength;
uniform vec3 u_sunDirection;

// Varyings
varying vec3 vPosition;
varying vec3 vNormal;

#include <packing>

void main() {
    vec3 normal = normalize(vNormal);

    vec3 viewDirection = normalize(cameraPosition - vPosition);

    float ndotl = max(0.0, dot(normalize(u_sunDirection), normal));
    

    vec2 rippleNormal1 = abs(normal.z) * (texture2D(u_rippleNormal, vPosition.xy / 3.0 + vec2(0.9, 0.1)).xy * 2.0 - 1.0);
    vec2 rippleNormal2 = abs(normal.y) * (texture2D(u_rippleNormal, vPosition.xz / 3.0 - vec2(0.8, 0.2)).xy * 2.0 - 1.0);
    vec2 rippleNormal3 = abs(normal.x) * (texture2D(u_rippleNormal, vPosition.yz / 3.0 + vec2(0.1,-0.9)).xy * 2.0 - 1.0);
    vec2 rippleNormal = rippleNormal1 + rippleNormal2 + rippleNormal3;
  
    normal.xz += rippleNormal * u_rippleStrength;
    normal = normalize(normal);

    vec3 lightDirection = normalize(u_sunDirection);
    vec3 halfwayDirection = normalize(lightDirection + viewDirection);
    
    vec3 specNormal = normal;
    specNormal.xz *= 1.5;
    specNormal = normalize(specNormal);
    float spec = pow(max(dot(halfwayDirection, specNormal), 0.0), 10.0) * ndotl * smoothstep(1.5, 0.0, vPosition.y) * 0.2;
    vec3 specularColor = vec3(1.0) * spec;

    // Diffuse
    vec3 rock = vec3(0.2, 0.2, 0.2);
    vec3 grass = vec3(0.05, 0.18, 0.11);

    vec3 diffuse = mix(rock, grass, clamp(0.0, 1.0, smoothstep(0.4, 0.7, normal.y) - smoothstep(1.5, 1.0, vPosition.y)));
    float diffuseSunLight = max(0.0, dot(normal, lightDirection)) * 0.4;
    float diffuseSkyLight = max(0.0, normal.y) * 0.4 * (0.5 + 0.5);
    float ambientLight = 0.12;
    diffuse *= diffuseSunLight + diffuseSkyLight + ambientLight;

    // Sample skybox
    vec3 skybox = textureCube(u_skybox, normal).rgb;
    diffuse *= 1.0 + skybox * 0.5;

    vec3 color = diffuse + specularColor;

    float dist = length(vPosition - cameraPosition);
    float fogFactor = pow(2.0, -dist * 0.0002);
    color = mix(color, vec3(1.0), 1.0 - fogFactor);

    gl_FragColor = vec4(color, 1.0);
}
`;

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
    u_rippleNormal: { value: rippleNormal },
    u_rippleStrength: { value: 0.5 },
    u_specularStrength: { value: 0.5 },
    u_specularPower: { value: 3.0 },
    u_specularNormalStrength: { value: 1.0 },
    u_sunDirection: { value: new THREE.Vector3(0.5, 0.5, 0) },
    u_heightMap: { value: heightMap }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  side: THREE.FrontSide,
  // wireframe: true
});