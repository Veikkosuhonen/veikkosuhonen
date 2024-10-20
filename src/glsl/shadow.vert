uniform sampler2D u_heightMap;

void main() {
    float y = texture(u_heightMap, uv).r * 10.0;
    vec3 newPos = position + vec3(0.0, y, 0.0);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPos, 1.0);
}