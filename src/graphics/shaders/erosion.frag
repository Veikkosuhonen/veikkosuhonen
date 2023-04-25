#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform sampler2D u_terrain;
uniform sampler2D u_fluidFlow;
uniform vec2 u_mouse;

const float DeltaT = 0.01;
const float RainFall = 0.0003;
const float SedimentCapacityFactor = 0.0002;
const float DissolvingFactor = 0.03;
const float DepositionFactor = 0.03;
const float EvaporationFactor = 0.01;
const float MinimumTilt = 0.0;
const float CollapseFactor = 0.1;

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
  return clamp(tilt, MinimumTilt, 0.02);
}

vec3 sampleTerrain(vec2 st) {
  vec3 terrain = texture(u_terrain, st).rgb;

  return terrain;
}

void main() {
  vec2 st = gl_FragCoord.st / u_resolution;
  vec2 offset = vec2(1.5 / u_resolution.x, 1.5 / u_resolution.y);

  vec3 terrainHere = sampleTerrain(st);
  float waterHere = terrainHere.g;
  float sedimentHere = terrainHere.b;

  // compute water level changes
  vec4 flowHere = texture(u_fluidFlow, st);
  vec4 flowTop = texture(u_fluidFlow, st + vec2(0.0, offset.y));
  vec4 flowBottom = texture(u_fluidFlow, st + vec2(0.0, -offset.y));
  vec4 flowLeft = texture(u_fluidFlow, st + vec2(-offset.x, 0.0));
  vec4 flowRight = texture(u_fluidFlow, st + vec2(offset.x, 0.0));

  float flowOut = flowHere.r + flowHere.g + flowHere.b + flowHere.a;

  vec4 deltaFlow = vec4(
    flowRight.b - flowHere.r,
    flowTop.a - flowHere.g,
    flowLeft.r - flowHere.b,
    flowBottom.g - flowHere.a
  );

  float waterLevelChange = DeltaT * (deltaFlow.r + deltaFlow.g + deltaFlow.b + deltaFlow.a);
  float newWaterLevel = max(0.0, waterHere + waterLevelChange);

  float waterVelocity = flowOut / (1.0 + waterHere * 10.0);

  // Sediment transport
  vec3 terrainRight = sampleTerrain(st + vec2(offset.x, 0.0));
  vec3 terrainTop = sampleTerrain(st + vec2(0.0, offset.y));
  vec3 terrainLeft = sampleTerrain(st + vec2(-offset.x, 0.0));
  vec3 terrainBottom = sampleTerrain(st + vec2(0.0, -offset.y));

  deltaFlow = max(deltaFlow, 0.0);
  float sedimentRight = deltaFlow.r  * terrainRight.b;
  float sedimentTop = deltaFlow.g * terrainTop.b;
  float sedimentLeft = deltaFlow.b * terrainLeft.b;
  float sedimentBottom = deltaFlow.a * terrainBottom.b;
  float sedimentOut = flowOut * sedimentHere;

  float suspendedSedimentChange = sedimentRight + sedimentTop + sedimentLeft + sedimentBottom - sedimentOut;
  float suspendedSediment = sedimentHere + suspendedSedimentChange;

  // Evaporation
  newWaterLevel = max(0.0, newWaterLevel - DeltaT * (EvaporationFactor * newWaterLevel + RainFall * 0.01));

  // "Evaporate" a lot if under sea level
  newWaterLevel = max(0.0, newWaterLevel - DeltaT * newWaterLevel * step(terrainHere.r, 0.0));

  // Erosion and deposition
  float tilt = getLocalTilt(st);
  float sedimentTransportCapacity = clamp(0.0, 0.002, SedimentCapacityFactor * waterVelocity * tilt);
  sedimentTransportCapacity *= terrainHere.r < 0.0 ? 0.1 : 1.0;

  float newHeight = terrainHere.r;
  float diff = sedimentTransportCapacity - suspendedSediment;
  float erosion, deposition = 0.0;
  if (diff > 0.0) {
    // Erosion
    erosion = diff * DissolvingFactor;
    newHeight -= erosion;
    suspendedSediment += erosion;
  }/* else {
    // Deposition
    deposition = -diff * DepositionFactor;
    newHeight += deposition;
    suspendedSediment -= deposition;
  }*/

  // RainFall
  newWaterLevel += DeltaT * RainFall * (u_mouse.x + 0.05);// * step(length(u_mouse - st), 0.01);

  // Collapse
  float avgTerrain = (terrainRight.r + terrainTop.r + terrainLeft.r + terrainBottom.r) / 4.0;
  diff = newHeight - avgTerrain;
  if (abs(diff) > 0.05) {
    newHeight += avgTerrain * CollapseFactor * DeltaT;
  }

  outColor = vec4(newHeight, newWaterLevel, suspendedSediment, tilt);
}
