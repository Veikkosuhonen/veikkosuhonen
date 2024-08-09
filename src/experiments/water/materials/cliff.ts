import * as THREE from 'three'

// Vertex Shader
const vertexShader = /* glsl */`

uniform mat4 u_shadowCameraViewMatrix;
uniform mat4 u_shadowCameraProjectionMatrix;

varying vec4 vShadowCoord;
varying vec3 vPosition;
varying vec3 vNormal;


void main() {
    vec3 positionWS = (modelMatrix * vec4(position, 1.0)).xyz;
    vPosition = positionWS;
    vNormal = normal;
    gl_Position = projectionMatrix * viewMatrix * vec4(positionWS, 1.0);
    vShadowCoord = u_shadowCameraProjectionMatrix * u_shadowCameraViewMatrix * vec4(positionWS, 1.0);
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

uniform vec3 u_shadowCameraPosition;
uniform sampler2D u_shadowMap;

// Varyings
varying vec4 vShadowCoord;
varying vec3 vPosition;
varying vec3 vNormal;

#include <packing>

void main() {
    vec3 normal = normalize(vNormal);
  
    vec3 shadowCoord = vShadowCoord.xyz / vShadowCoord.w * 0.5 + 0.5;

    float depth_shadowCoord = shadowCoord.z;

    vec2 depthMapUv = shadowCoord.xy;
    float depth_depthMap = unpackRGBAToDepth(texture2D(u_shadowMap, depthMapUv));

    float cosTheta = dot(normalize(u_sunDirection), normal);
    float bias = 0.0005 * tan(acos(cosTheta)); // cosTheta is dot( n,l ), clamped between 0 and 1
    bias = clamp(bias, 0.0, 0.01);
    
    float shadowFactor = step(depth_shadowCoord - bias, depth_depthMap);
  

    vec3 viewDirection = normalize(cameraPosition - vPosition);
    

    vec2 rippleNormal1 = abs(normal.z) * (texture2D(u_rippleNormal, vPosition.xy / 5.0 + vec2(0.9, 0.1)).xy * 2.0 - 1.0);
    vec2 rippleNormal2 = abs(normal.y) * (texture2D(u_rippleNormal, vPosition.xz / 5.0 - vec2(0.8, 0.2)).xy * 2.0 - 1.0);
    vec2 rippleNormal3 = abs(normal.x) * (texture2D(u_rippleNormal, vPosition.yz / 5.0 + vec2(0.1,-0.9)).xy * 2.0 - 1.0);
    vec2 rippleNormal = rippleNormal1 + rippleNormal2 + rippleNormal3;
  
    normal.xz += rippleNormal * u_rippleStrength;
    normal = normalize(normal);

    vec3 lightDirection = normalize(u_sunDirection);
    vec3 halfwayDirection = normalize(lightDirection + viewDirection);
    vec3 reflectionDirection = reflect(-viewDirection, normal);

    // Diffuse
    vec3 rock = vec3(0.2, 0.2, 0.2);
    vec3 grass = vec3(0.05, 0.2, 0.1);

    vec3 diffuse = mix(rock, grass, clamp(0.0, 1.0, smoothstep(0.5, 0.8, normal.y) - smoothstep(1.5, 1.0, vPosition.y)));
    float diffuseSunLight = max(0.0, dot(normal, lightDirection)) * 0.2 * shadowFactor;
    float diffuseSkyLight = max(0.0, normal.y) * 0.2 * (0.5 + 0.5 * shadowFactor);
    float ambientLight = 0.1;
    diffuse *= diffuseSunLight + diffuseSkyLight + ambientLight;

    // Sample skybox
    vec3 skybox = textureCube(u_skybox, normal).rgb;
    diffuse *= 1.0 + skybox * 0.5;

    vec3 color = diffuse;

    float dist = length(vPosition - cameraPosition);
    float fogFactor = pow(2.0, -dist * 0.0004);
    color = mix(color, vec3(1.0), 1.0 - fogFactor);

    gl_FragColor = vec4(color, 1.0);
}
`;

const skyBox = new THREE.CubeTextureLoader().setPath("/assets/").load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);

const rippleNormal = new THREE.TextureLoader().load("/assets/ripple_normal.jpg");
rippleNormal.wrapS = THREE.MirroredRepeatWrapping;
rippleNormal.wrapT = THREE.MirroredRepeatWrapping;

export default ({
  shadowMap
}: {
  shadowMap: THREE.Texture
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
    u_shadowCameraViewMatrix: { value: new THREE.Matrix4() },
    u_shadowCameraProjectionMatrix: { value: new THREE.Matrix4() },
    u_shadowCameraPosition: { value: new THREE.Vector3() },
    u_shadowMap: { value: shadowMap },
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  side: THREE.FrontSide,
  // wireframe: true
});