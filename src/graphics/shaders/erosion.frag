#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform sampler2D u_terrain;
uniform sampler2D u_fluidFlow;
uniform vec2 u_mouse;

const float DeltaT = 0.01;
const float RainFall = 0.002;
const float SedimentCapacityFactor = 0.05;
const float EvaporationFactor = 0.01;
const float MinimumTilt = 0.0;
const float CollapseFactor = 0.5;

out vec4 outColor;

vec3 normalMap(in vec2 uv) {
  vec2 s = 1.0 / u_resolution.xy;
  
  float p = texture(u_terrain, uv).x;
  float h1 = texture(u_terrain, uv + s * vec2(4.0,0)).x;
  float v1 = texture(u_terrain, uv + s * vec2(0,4.0)).x;
     
  return normalize(vec3(p - vec2(h1, v1), 1.0 / u_resolution.x * 10.0));
}

float getLocalTilt(in vec2 st) {
  vec3 normal = normalMap(st);
  float tilt = 1.0 - abs(normal.z);
  return clamp(tilt, MinimumTilt, 1.0);
}

vec4 sampleTerrain(vec2 st) {
  vec4 terrain = texture(u_terrain, st);

  return terrain;
}

void main() {
  vec2 st = gl_FragCoord.st / u_resolution;
  vec2 offset = vec2(1.1 / u_resolution.x, 1.1 / u_resolution.y);

  vec4 terrainHere = sampleTerrain(st);
  float waterHere = terrainHere.g;
  float hardness = terrainHere.a;

  // compute water level changes
  vec4 flowHere = texture(u_fluidFlow, st);
  vec4 flowTop = texture(u_fluidFlow, st + vec2(0.0, offset.y));
  vec4 flowBottom = texture(u_fluidFlow, st + vec2(0.0, -offset.y));
  vec4 flowLeft = texture(u_fluidFlow, st + vec2(-offset.x, 0.0));
  vec4 flowRight = texture(u_fluidFlow, st + vec2(offset.x, 0.0));

  vec4 deltaFlow = vec4(
    flowRight.b - flowHere.r,
    flowTop.a - flowHere.g,
    flowLeft.r - flowHere.b,
    flowBottom.g - flowHere.a
  );

  float waterLevelChange = (deltaFlow.r + deltaFlow.g + deltaFlow.b + deltaFlow.a);
  float newWaterLevel = max(0.0, waterHere + DeltaT * waterLevelChange);

  vec4 terrainRight = sampleTerrain(st + vec2(offset.x, 0.0));
  vec4 terrainTop = sampleTerrain(st + vec2(0.0, offset.y));
  vec4 terrainLeft = sampleTerrain(st + vec2(-offset.x, 0.0));
  vec4 terrainBottom = sampleTerrain(st + vec2(0.0, -offset.y));
  // Collapse
  float newHeight = terrainHere.r;
  float avgTerrain = (terrainRight.r + terrainTop.r + terrainLeft.r + terrainBottom.r) / 4.0;
  float diff = newHeight - avgTerrain;
  if (hardness * 0.02 + abs(diff) > 0.025) {
    newHeight -= diff * CollapseFactor * DeltaT;
  }
  

  // Evaporation
  newWaterLevel = max(0.0, newWaterLevel - DeltaT * (EvaporationFactor * newWaterLevel + RainFall * 0.2));

  // "Evaporate" a lot if under sea level
  newWaterLevel = max(0.0, newWaterLevel - DeltaT * newWaterLevel * step(terrainHere.r, 0.0));

  // RainFall
  newWaterLevel += DeltaT * RainFall * (u_mouse.x);// * step(length(u_mouse - st), 0.01);

  outColor = vec4(newHeight, newWaterLevel, 1.0, hardness);
}
