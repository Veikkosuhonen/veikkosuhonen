#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform sampler2D u_terrain;
uniform sampler2D u_fluidFlow;
uniform vec2 u_mouse;

const float DeltaT = 0.01;
const float RainFall = 0.01;
const float SedimentCapacityFactor = 0.005;
const float DissolvingFactor = 0.0001;
const float DepositionFactor = 0.0001;
const float EvaporationFactor = 0.01;
const float MinimumTilt = 0.00001;

out vec4 outColor;

vec3 normalMap(in vec2 uv) {
  vec2 s = 1.0 / u_resolution.xy;
  
  float p = texture(u_terrain, uv).x;
  float h1 = texture(u_terrain, uv + s * vec2(1.0,0)).x;
  float v1 = texture(u_terrain, uv + s * vec2(0,1.0)).x;
     
  return normalize(vec3(p - vec2(h1, v1), 1.0 / u_resolution.x * 10.0));
}

float getLocalTilt(in vec2 st) {
  vec3 normal = normalMap(st);
  float tilt = 1.0 - abs(normal.z);
  return max(MinimumTilt, tilt);
}

vec3 sampleTerrain(vec2 st) {
  vec3 terrain = texture(u_terrain, st).rgb;

  return terrain;
}

void main() {
  vec2 st = gl_FragCoord.st / u_resolution;
  vec2 offset = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y);

  vec3 terrainHere = sampleTerrain(st);
  float waterHere = terrainHere.g;
  float sedimentHere = terrainHere.b;

  // compute water level changes
  vec4 flowHere = texture(u_fluidFlow, st);
  vec4 flowTop = texture(u_fluidFlow, st + vec2(0.0, offset.y));
  vec4 flowBottom = texture(u_fluidFlow, st + vec2(0.0, -offset.y));
  vec4 flowLeft = texture(u_fluidFlow, st + vec2(-offset.x, 0.0));
  vec4 flowRight = texture(u_fluidFlow, st + vec2(offset.x, 0.0));

  // remember: fluid flow is encoded as right top left bottom
  float flowIn = flowLeft.r + flowTop.a + flowRight.b + flowBottom.g;
  float flowOut = flowHere.r + flowHere.g + flowHere.b + flowHere.a;
  flowOut = min(flowOut, waterHere);
  float waterLevelChange = DeltaT * (flowIn - flowOut);
  float newWaterLevel = waterHere + waterLevelChange;

  // Sediment transport
  vec3 terrainRight = sampleTerrain(st + vec2(offset.x, 0.0));
  vec3 terrainTop = sampleTerrain(st + vec2(0.0, offset.y));
  vec3 terrainLeft = sampleTerrain(st + vec2(-offset.x, 0.0));
  vec3 terrainBottom = sampleTerrain(st + vec2(0.0, -offset.y));

  float sedimentRight = terrainRight.r > 0.0 && terrainRight.g > 0.0 ? flowRight.b * terrainRight.b : 0.0;
  float sedimentTop = terrainTop.r > 0.0 && terrainTop.g > 0.0 ? flowTop.a * terrainTop.b : 0.0;
  float sedimentLeft = terrainLeft.r > 0.0 && terrainLeft.g > 0.0 ? flowLeft.r * terrainLeft.b : 0.0;
  float sedimentBottom = terrainBottom.r > 0.0 && terrainBottom.g > 0.0 ? flowBottom.g * terrainBottom.b : 0.0;
  float sedimentOut = terrainHere.r > 0.0 && waterHere > 0.0 ? flowOut * sedimentHere : 0.0;

  float suspendedSedimentChange = sedimentRight + sedimentTop + sedimentLeft + sedimentBottom - sedimentOut;
  float suspendedSediment = sedimentHere + suspendedSedimentChange;

  // Erosion and deposition
  float tilt = getLocalTilt(st);
  float sedimentTransportCapacity = SedimentCapacityFactor * tilt * (flowIn + flowOut);

  float newHeight = terrainHere.r;
  if (sedimentTransportCapacity > suspendedSediment) {
    float dissolvedSediment = DissolvingFactor * (sedimentTransportCapacity - suspendedSediment);
    newHeight -= dissolvedSediment;
    suspendedSediment += dissolvedSediment;
  } else {
    float depositedSediment = DepositionFactor * (suspendedSediment - sedimentTransportCapacity);
    newHeight += depositedSediment;
    suspendedSediment -= depositedSediment;
  }

  // RainFall
  newWaterLevel += DeltaT * RainFall * u_mouse.x;// * step(length(u_mouse - st), 0.01);

  // Evaporation
  newWaterLevel = max(0.0, newWaterLevel - DeltaT * (EvaporationFactor * newWaterLevel + RainFall * 0.1));

  outColor = vec4(newHeight, newWaterLevel, suspendedSediment, 1.0);
}
