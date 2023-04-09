#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform sampler2D u_data;

out vec4 outColor;

void main() {
  vec2 st = gl_FragCoord.st / u_resolution;

  vec4 data = texture(u_data, st);

  outColor = data;
}
