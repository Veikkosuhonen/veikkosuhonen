#version 300 es

/*
* Implementation of "Fast Hydraulic Erosion Simulation and Visualization on GPU" by Mei, Decauding, Hu 2020
* by Veikko Suhonen
* Fluid flux step
*/

precision highp float;

uniform vec2 u_resolution;
uniform sampler2D u_terrain;
uniform sampler2D u_fluidFlow;


const float deltaT = 0.01;
const float A = 1.0; // pipe cross section
const float g = 9.81;
const float l = 1.0; // pipe length

out vec4 outflowFlux;

vec2 sampleTerrain(vec2 st) {
  vec2 terrain = texture(u_terrain, st).rg;

  return terrain;
}

float squaredLength(in vec4 v) {
  return v.r * v.r + v.g * v.g + v.b * v.b + v.a * v.a;
}

void main() {
  vec2 st = gl_FragCoord.st / u_resolution;
  vec2 offset = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y);

  vec2 terrainHere = sampleTerrain(st);
  vec2 terrainTop = sampleTerrain(st + vec2(0.0, offset.y));
  vec2 terrainBottom = sampleTerrain(st + vec2(0.0, -offset.y));
  vec2 terrainLeft = sampleTerrain(st + vec2(-offset.x, 0.0));
  vec2 terrainRight = sampleTerrain(st + vec2(offset.x, 0.0));

  float effectiveHeightHere = terrainHere.r + terrainHere.g;

  vec4 deltaHeight = vec4( // right top left bottom
    effectiveHeightHere - (terrainRight.r  + terrainRight.g ),
    effectiveHeightHere - (terrainTop.r    + terrainTop.g   ),
    effectiveHeightHere - (terrainLeft.r   + terrainLeft.g  ),
    effectiveHeightHere - (terrainBottom.r + terrainBottom.g)
  );

  vec4 flux = texture(u_fluidFlow, st);

  vec4 resultingFlux = max(vec4(0.0), flux + deltaT * A * g * deltaHeight / l);

  float K = min(1.0, terrainHere.g / ((resultingFlux.r + resultingFlux.g + resultingFlux.b + resultingFlux.a) * deltaT));

  resultingFlux *= K;

  // not in paper: add some damping
  // resultingFlux *= 1.0 - min(1.0, squaredLength(resultingFlux) * 0.1);

  outflowFlux = resultingFlux;
}
