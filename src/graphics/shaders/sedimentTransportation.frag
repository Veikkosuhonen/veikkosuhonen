#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform sampler2D u_terrain;
uniform sampler2D u_fluidFlow;

const float DeltaT = 0.01;

out vec4 outColor;

vec4 sampleTerrain(vec2 st) {
  vec4 terrain = texture(u_terrain, st);

  return terrain;
}

void main() {
  vec2 st = gl_FragCoord.st / u_resolution;
  vec2 offset = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y);

  vec4 terrainHere = sampleTerrain(st);

  // compute water level changes
  vec4 flowHere = texture(u_fluidFlow, st);
  vec4 flowTop = texture(u_fluidFlow, st + vec2(0.0, offset.y));
  vec4 flowBottom = texture(u_fluidFlow, st + vec2(0.0, -offset.y));
  vec4 flowLeft = texture(u_fluidFlow, st + vec2(-offset.x, 0.0));
  vec4 flowRight = texture(u_fluidFlow, st + vec2(offset.x, 0.0));

  vec2 waterVelocity = vec2(
    (flowHere.r + flowRight.b) - (flowHere.b + flowLeft.r), 
    (flowHere.g + flowTop.a) - (flowHere.a + flowBottom.g)
  );

  vec2 previousPosition = st - clamp(waterVelocity * DeltaT * 0.01, -offset * 0.1, offset * 0.1);

  float suspendedSediment = texture(u_terrain, previousPosition).b;

  outColor = vec4(terrainHere.r, terrainHere.g, suspendedSediment, terrainHere.a);
}
