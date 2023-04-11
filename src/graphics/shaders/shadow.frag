#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform sampler2D u_shadows;
uniform sampler2D u_data;
uniform vec3 u_sunDirection;
uniform float u_zoom;

out vec4 outColor;

void main() {
  vec2 st = gl_FragCoord.st / u_resolution;

  vec3 sunRay = normalize(u_sunDirection) / u_resolution.x; // assuming a square frame buffer

  vec2 samplePos = st + sunRay.xy;

  vec4 shadowDataThere = texture(u_shadows, samplePos);
  float shadowThere = shadowDataThere.r;
  vec4 dataThere = texture(u_data, samplePos);
  float heightThere = dataThere.r;
  float shadowCasterThere = max(shadowThere, heightThere);

  float shadowHere = shadowCasterThere - sunRay.z;

  outColor = vec4(shadowHere, 0.0, 0.0, 1.0);
}
