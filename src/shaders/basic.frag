precision highp float;

const float DATA_LENGTH = 256.0;
const float ELEMENTS_PER_TEXEL = 3.0;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_freq;

uniform float u_channel;

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

void main() {
  vec2 st = gl_FragCoord.st / u_resolution.st;

  float stx = st.x / 2.0;
  vec4 data = texture2D(u_freq, vec2(stx, u_channel));

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
