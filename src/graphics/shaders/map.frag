#version 300 es

precision highp float;

uniform sampler2D u_terrain;
uniform sampler2D u_shadows;
uniform sampler2D u_fluidFlow;
uniform vec2 u_resolution;
uniform vec2 u_canvasSize;
uniform float u_time;
uniform vec3 u_sunDirection;
uniform float u_zoom;
uniform vec2 u_cameraPos;

out vec4 outColor;

const float IceLevel = 0.45;

vec3 stdNormalMap(in vec2 uv) {
  vec2 s = 1.0 / u_resolution.xy;
  
  float p = texture(u_terrain, uv).x;
  float h1 = texture(u_terrain, uv + s * vec2(1.0,0)).x;
  float v1 = texture(u_terrain, uv + s * vec2(0,1.0)).x;

  return normalize(vec3(p - vec2(h1, v1), 1.0 / u_resolution.x * 10.0));
}

float airAmount(float height, float shadowHeight) {
  float airAmount = 1.0 - max(shadowHeight, max(height, 0.0));
  airAmount *= airAmount;

  return airAmount * 0.3;
}

void main() {
  vec2 fragCoord = gl_FragCoord.st;

  vec2 aspectDiff = u_canvasSize.st / u_resolution;

  vec2 st0 = fragCoord / u_resolution;

  float scaling = min(u_resolution.s, u_resolution.t) / min(u_canvasSize.s, u_canvasSize.t);
  vec2 stScaled = st0 * aspectDiff * scaling;


  // Center along longer axis
  vec2 centering = u_canvasSize.s > u_canvasSize.t 
    ? vec2((u_canvasSize.s - u_canvasSize.t) / u_resolution.s, 0.0) 
    : vec2(0.0, (u_canvasSize.t - u_canvasSize.s) / u_resolution.t);

  stScaled -= centering * scaling * 0.5;

  vec2 st = stScaled - vec2(0.5);

  st *= u_zoom;

  st += vec2(0.5) + u_cameraPos;

  vec4 data = texture(u_terrain, st);
  vec4 flux = texture(u_fluidFlow, st);
  float fluxTotal = flux.r + flux.g + flux.b + flux.a;

  float totalWater = 2.0 * fluxTotal + data.g;
  float height = data.r;

  float distanceFromCenter =  length(st - vec2(0.5));
  float distanceFalloffFromCenter = smoothstep(0.5, 0.7, distanceFromCenter);

  height = mix(height, -1.0, distanceFalloffFromCenter);
  vec4 shadowsData = texture(u_shadows, st);
  float shadowHeight = shadowsData.r;
  shadowHeight = mix(shadowHeight, -1.0, distanceFalloffFromCenter);

  vec3 normal = stdNormalMap(st);
  vec3 diffuse = vec3(0.2824, 0.2941, 0.2588);
  float specular = 0.0;

  float fertility = normal.z + totalWater + data.a - max(0.0, height) * 1.2;

  diffuse = mix(diffuse, vec3(0.0078, 0.2353, 0.0392), smoothstep(0.8, 1.1, fertility));
  diffuse = mix(diffuse, vec3(0.5216, 0.4706, 0.3373), smoothstep(0.015, 0.0, abs(height) * normal.z));
  diffuse = mix(diffuse, vec3(0.3333, 0.3333, 0.3333), smoothstep(0.91, 0.70, (normal.z)));

  // ice
  diffuse = mix(diffuse, vec3(0.7843, 0.9098, 0.9333), smoothstep(0.0, 0.01, totalWater) * smoothstep(0.0, 0.05, height - IceLevel));
  

  float ambientLight = 0.5;
  float sunLightAmount = 0.7;
  float sunLightBleedAmount = 0.1;
  float skyLightAmount = 0.4;
  float hitByLight = smoothstep(-0.01, 0.0, height - shadowHeight);
  float light = (sunLightAmount * hitByLight + sunLightBleedAmount) * max(0.0, dot(normal, normalize(u_sunDirection)));
  float skyLight = skyLightAmount * max(0.0, dot(normal, vec3(0.0, 0.0, 1.0)));

  diffuse *= light + ambientLight + skyLight;

  if ((height < 0.0 || totalWater > 0.05) && height < IceLevel) {
    // water
    float waterAmount = max(-height, data.g / 10.0);
    vec3 waterColor = mix(vec3(0.1373, 0.3686, 0.5686), vec3(0.1176, 0.1843, 0.4588), min(waterAmount, 1.0));

    float waterHitByLight = smoothstep(-0.01, 0.0, max(0.0, height + data.g) - shadowHeight);
    float waterLight = sunLightAmount * waterHitByLight * max(0.0, dot(vec3(0.0, 0.0, 1.0), normalize(u_sunDirection)));
    float waterSkyLight = skyLightAmount;
    waterColor *= waterLight + ambientLight + waterSkyLight;

    diffuse /= (0.5 * waterAmount * waterAmount + 1.0);
    diffuse = mix(diffuse, waterColor, min(5.0 * waterAmount * waterAmount + 0.7, 1.0));
  }

  // fog
  diffuse = mix(diffuse, vec3(1.0), airAmount(height, shadowHeight));

  // vignette
  diffuse *= smoothstep(1.0, 0.35, length(st0 - vec2(0.5)));
  // outColor = vec4(vec3(data.g * 20.0), 1.);
  outColor = vec4(diffuse, 1.0);
  // outColor = shadows * 1.2;
  //vec4 flux = texture(u_fluidFlow, st).rgba;
  //flux = step(flux, vec3(0.0));
  //float heightLine = smoothstep(0.9, 1.0, fract(height * 15.0)) * 0.7;
  //outColor = vec4(heightLine,-data.b * 300.0, data.b * 300.0, 1.0);
 // outColor = vec4(vec3(data.r, (fl)), 1.0);
}