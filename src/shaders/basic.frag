precision highp float;

const float DATA_LENGTH = 512.0;
const float ELEMENTS_PER_TEXEL = 3.0;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_freq;
uniform float u_freqScale;

uniform float u_channel;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float getComponent(vec4 data, float x) {
  float m = mod(x, ELEMENTS_PER_TEXEL);
  float r = 1.0 - step(1.0, m);
  float g = step(1.0, m) - step(2.0, m);
  float b = step(2.0, m);
  return (
    r * data.r +
    g * data.g +
    b * data.b
  );
}

float noteFrequency(float key) {
  return pow(2.0, (key - 49.0) / 12.0) * 440.0;
}

void main() {
  vec2 st = gl_FragCoord.ts / u_resolution.ts;

  float key = st.x * 100.0;
  float noteFreq = noteFrequency(key);
  float stx = noteFreq / u_freqScale;

  vec4 data = texture2D(u_freq, vec2(stx, st.y));

  float x = stx * DATA_LENGTH * ELEMENTS_PER_TEXEL;

  float freq = getComponent(data, x);
  // freq -= 0.3 * step(0.5, u_channel);
  freq *= log(stx + 2.0);
  freq = exp(freq) - 1.0;

  float distanceFromCenter = abs(st.y - 0.5);
  float barHeight = freq * 0.5;
  // float barStrength = timeDomain;

  float a = step(distanceFromCenter, barHeight);

  vec3 innerColor = mix(vec3(0.0078, 0.2588, 0.1098), vec3(0.0863, 0.7098, 0.4902), barHeight * 2.0 - 0.3);
  vec3 outerColor = mix(vec3(0.0157, 0.0431, 0.0902), vec3(0.2471, 0.0588, 0.1451), barHeight * 2.0 - 0.3);
  
  vec3 color = mix(innerColor, outerColor, (1.0 - (barHeight - distanceFromCenter) / barHeight));
  color = mix(color, vec3(0.1961, 1.0, 0.6235), barHeight * barHeight * 0.1 * max(1.0 / distanceFromCenter, 0.0));
  color = mix(vec3(0.0), color, a);

  gl_FragColor = vec4(color, a);
}
