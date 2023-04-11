#version 300 es

precision highp float;

uniform sampler2D u_data;
uniform sampler2D u_shadows;
uniform vec2 u_resolution;
uniform vec2 u_canvasSize;
uniform float u_time;
uniform vec3 u_sunDirection;
uniform float u_zoom;
uniform vec2 u_cameraPos;

out vec4 outColor;

vec2 stdNormalMap(in vec2 uv) {
  float height = texture(u_data, uv).r;
  return (-vec2(dFdx(height), dFdy(height)) + 0.0) * 150.0 / u_zoom;
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

  vec4 data = texture(u_data, st);
  float height = data.r;

  float distanceFromCenter =  length(st - vec2(0.5));
  float distanceFalloffFromCenter = smoothstep(0.5, 0.7, distanceFromCenter);

  height = mix(height, -1.0, distanceFalloffFromCenter);
  vec4 shadowsData = texture(u_shadows, st);
  float shadowHeight = shadowsData.r;
  shadowHeight = mix(shadowHeight, -1.0, distanceFalloffFromCenter);

  vec3 normal = normalize(vec3(stdNormalMap(st), 1.0));
  vec3 diffuse = vec3(0.2824, 0.3176, 0.2235);
  float specular = 0.0;

  diffuse = mix(diffuse, vec3(0.0078, 0.2353, 0.0392), smoothstep(0.95, 1.6, normal.z));
  diffuse = mix(diffuse, vec3(0.5216, 0.4706, 0.3373), smoothstep(0.015, 0.0, abs(height) * normal.z));
  diffuse = mix(diffuse, vec3(0.3333, 0.3333, 0.3333), smoothstep(0.91, 0.70, (normal.z)));

  float ambientLight = 0.5;
  float sunLightAmount = 0.7;
  float sunLightBleedAmount = 0.1;
  float skyLightAmount = 0.4;
  float hitByLight = smoothstep(-0.01, 0.0, height - shadowHeight);
  float light = (sunLightAmount * hitByLight + sunLightBleedAmount) * max(0.0, dot(normal, normalize(u_sunDirection)));
  float skyLight = skyLightAmount * max(0.0, dot(normal, vec3(0.0, 0.0, 1.0)));

  diffuse *= light + ambientLight + skyLight;

  // water
  if (height < 0.0) {
    vec3 waterColor = mix(vec3(0.1373, 0.3686, 0.5686), vec3(0.1176, 0.1843, 0.4588), min(-height, 1.0));

    float waterHitByLight = smoothstep(-0.01, 0.0, -shadowHeight);
    float waterLight = sunLightAmount * waterHitByLight * max(0.0, dot(vec3(0.0, 0.0, 1.0), normalize(u_sunDirection)));
    float waterSkyLight = skyLightAmount;
    waterColor *= waterLight + ambientLight + waterSkyLight;

    diffuse /= (0.5 * height * height + 1.0);
    diffuse = mix(diffuse, waterColor, min(6.0 * height * height + 0.75, 1.0));
  }

  // fog
  diffuse = mix(diffuse, vec3(1.0), airAmount(height, shadowHeight));

  // vignette
  diffuse *= smoothstep(1.0, 0.35, length(st0 - vec2(0.5)));
  // outColor = vec4(vec3(data.r * 0.5 + 0.5), 1.);
  outColor = vec4(diffuse, 1.0);
  // outColor = shadows * 1.2;
}