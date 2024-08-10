#include "./sdf.glsl"

varying vec3 vPosition;

void main() {
    gl_FragColor = vec4(pow((1.0 + dist(vPosition)) / 2.0, 2.0), 0.0, 0.0, 1.0);
}
