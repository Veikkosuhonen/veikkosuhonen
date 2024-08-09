import * as THREE from 'three'

// Vertex Shader
const vertexShader = /* glsl */`

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;


void main() {
    vec3 positionWS = (modelMatrix * vec4(position, 1.0)).xyz;
    vec2 worldUV = positionWS.xz;
    vPosition = positionWS;
    vNormal = normal;
    vUv = worldUV;
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
varying vec2 vUv;

void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    vec3 normal = normalize(vNormal);

    vec2 rippleNormal1 = texture2D(u_rippleNormal, vUv / 7.0 + vec2(0.9, 0.1) * u_time / 12.0).xy * 2.0 - 1.0;
    vec2 rippleNormal2 = texture2D(u_rippleNormal, vUv / 5.0 - vec2(0.8, 0.2) * u_time / 14.0).xy * 2.0 - 1.0;
    vec2 rippleNormal3 = texture2D(u_rippleNormal, vUv / 3.0 + vec2(0.1,-0.9) * u_time / 16.0).xy * 2.0 - 1.0;
    vec2 rippleNormal = rippleNormal1 + rippleNormal2 * 0.8 + rippleNormal3 * 0.6;
  
    normal.xz += rippleNormal * u_rippleStrength;
    normal = normalize(normal);

    vec3 lightDirection = normalize(u_sunDirection);
    vec3 halfwayDirection = normalize(lightDirection + viewDirection);
    vec3 reflectionDirection = reflect(-viewDirection, normal);

    // Diffuse
    vec3 rock = vec3(0.2, 0.2, 0.2);
    vec3 grass = vec3(0.05, 0.2, 0.1);

    vec3 diffuse = mix(rock, grass, clamp(0.0, 1.0, smoothstep(0.5, 0.8, normal.y) - smoothstep(1.5, 1.0, vPosition.y)));
    float diffuseSunLight = max(0.0, dot(normal, lightDirection)) * 0.2;
    float diffuseSkyLight = max(0.0, normal.y) * 0.1;
    float ambientLight = 0.1;
    diffuse *= diffuseSunLight + diffuseSkyLight + ambientLight;

    // Sample skybox
    vec3 skybox = textureCube(u_skybox, normal).rgb;
    diffuse *= 1.0 + skybox * 0.5;

    vec3 color = diffuse;

    gl_FragColor = vec4(color, 1.0);
}
`;

const skyBox = new THREE.CubeTextureLoader().setPath("/assets/").load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);

const rippleNormal = new THREE.TextureLoader().load("/assets/ripple_normal.jpg");
rippleNormal.wrapS = THREE.MirroredRepeatWrapping;
rippleNormal.wrapT = THREE.MirroredRepeatWrapping;

export default new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0.0 },
    u_skybox: { value: skyBox },
    u_rippleNormal: { value: rippleNormal },
    u_rippleStrength: { value: 0.5 },
    u_specularStrength: { value: 0.5 },
    u_specularPower: { value: 3.0 },
    u_specularNormalStrength: { value: 1.0 },
    u_sunDirection: { value: new THREE.Vector3(0.5, 0.5, 0) },
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  side: THREE.FrontSide,
  // wireframe: true
});