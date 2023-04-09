#version 300 es

precision highp float;

uniform sampler2D u_data;
uniform sampler2D u_shadows;
uniform vec2 u_resolution;
uniform vec2 u_canvasResolution;
uniform float u_time;
uniform vec3 u_sunDirection;

out vec4 outColor;

vec2 stdNormalMap(in vec2 uv) {
  float height = texture(u_data, uv).r;
  return (-vec2(dFdx(height), dFdy(height)) + 0.0) * 100.0;
}

void main() {
  vec2 st = gl_FragCoord.st / u_canvasResolution.ts;
  vec4 data = texture(u_data, st);
  float height = data.r;
  vec4 shadowsData = texture(u_shadows, st);
  float shadowHeight = shadowsData.r;

  vec3 normal = normalize(vec3(stdNormalMap(st), 1.0));
  vec3 diffuse = vec3(0.3569, 0.349, 0.2549);
  float specular = 0.0;

  diffuse = mix(diffuse, vec3(0.5216, 0.4706, 0.3373), smoothstep(0.015, 0.0, abs(height) * normal.z));
  diffuse = mix(diffuse, vec3(0.3647, 0.3647, 0.3647), smoothstep(0.91, 0.70, (normal.z)));

  if (data.x + data.y > 0.6) {
    diffuse = vec3(0.8039, 0.8039, 0.8039);
    specular = 0.5;
  }

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

  // outColor = vec4(vec3(data.r * 0.5 + 0.5), 1.);
  outColor = vec4(diffuse, 1.0);
  // outColor = shadows * 1.2;
}