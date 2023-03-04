precision highp float;

const float DATA_LENGTH = 512.0;
const float ELEMENTS_PER_TEXEL = 3.0;
const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;
const float HALF_PI = 1.57079632679;

uniform vec2 u_resolution;
uniform vec2 u_canvasSize;
uniform float u_time;
uniform float u_hue;
uniform float u_brightness;
uniform sampler2D u_freq;
uniform float u_freqScale;
uniform float u_freqRange;
uniform float u_ringRadius;
uniform float u_speed;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 hueShift( vec3 color, float hueAdjust ){
    const vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);
    const vec3  kRGBToI      = vec3 (0.596, -0.275, -0.321);
    const vec3  kRGBToQ      = vec3 (0.212, -0.523, 0.311);

    const vec3  kYIQToR     = vec3 (1.0, 0.956, 0.621);
    const vec3  kYIQToG     = vec3 (1.0, -0.272, -0.647);
    const vec3  kYIQToB     = vec3 (1.0, -1.107, 1.704);

    float   YPrime  = dot (color, kRGBToYPrime);
    float   I       = dot (color, kRGBToI);
    float   Q       = dot (color, kRGBToQ);
    float   hue     = atan (Q, I);
    float   chroma  = sqrt (I * I + Q * Q);

    hue += hueAdjust;

    Q = chroma * sin (hue);
    I = chroma * cos (hue);

    vec3    yIQ   = vec3 (YPrime, I, Q);

    return vec3( dot (yIQ, kYIQToR), dot (yIQ, kYIQToG), dot (yIQ, kYIQToB) );
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

float fetchKey(float key, float channel, float r) {
  float noteFreq = noteFrequency(key);
  float stx = noteFreq / u_freqScale;
  vec4 data = texture2D(u_freq, vec2(stx + channel * 0.5, r));
  float x = stx * DATA_LENGTH * ELEMENTS_PER_TEXEL;
  float amp = getComponent(data, x);
  return amp;
}

float fetchKey(float key, float channel) {
  return fetchKey(key, channel, 0.0);
}

vec3 spectrogramBackground(float key, float angle, float channel, float r) {
  float y = r * u_speed;
  float amp = fetchKey(key, channel, y);
  amp = exp(amp) - 1.0;
  amp *= log(angle + 2.5);
  amp = pow(amp, 6.0) * 0.2 * max((1.0 - y), 0.0);
  return vec3(0.2, 0.0275, 0.3412) * amp * step(0.0001, y) * step(y, 1.0);
}

void main() {

  vec2 fragCoord = gl_FragCoord.st;

  vec2 aspectDiff = u_canvasSize.st / u_resolution;

  vec2 st = fragCoord / u_resolution;

  float scaling = min(u_resolution.s, u_resolution.t) / min(u_canvasSize.s, u_canvasSize.t);
  vec2 stScaled = st * aspectDiff * scaling;


  // Center along longer axis
  vec2 centering = u_canvasSize.s > u_canvasSize.t 
    ? vec2((u_canvasSize.s - u_canvasSize.t) / u_resolution.s, 0.0) 
    : vec2(0.0, (u_canvasSize.t - u_canvasSize.s) / u_resolution.t);

  stScaled -= centering * scaling * 0.5;


  // move drawing origin to center
  vec2 stc = stScaled - vec2(0.5);


  float r = sqrt(stc.x * stc.x + stc.y * stc.y) * 2.0;
  float phi = mod(atan(stc.y, stc.x) + HALF_PI, TWO_PI) / TWO_PI;

  float angle = phi > 0.5 ? (1.0 - phi) * 2.0 : phi * 2.0;
  float key = angle * 88.0 * u_freqRange;

  float channel = phi > 0.5 ? 1.0 : 0.0;
  
  float amp = fetchKey(key, channel) + 0.02;
  // freq -= 0.3 * step(0.5, u_channel);
  amp *= log(angle + 3.0) * 0.5;
  amp = exp(amp) - 1.0;

  float radius = u_ringRadius;
  float distanceFromRing = max(r - radius, 0.0);

  float barDistanceFromRing = abs(r - radius) * (1.0 + step(r - radius, 0.0) * 3.0);
  float barHeight = amp * 0.7;
  // float barStrength = timeDomain;

  float alpha = step(barDistanceFromRing, barHeight);
  float a = alpha;

  vec3 innerColor = mix(vec3(0.0078, 0.2196, 0.0941), vec3(0.0863, 0.7098, 0.4902), amp * 2.0 - 0.4);
  vec3 outerColor = mix(vec3(0.0078, 0.0275, 0.0549), vec3(0.251, 0.0275, 0.1216), amp * 2.0 - 0.4);

  innerColor = hueShift(innerColor, -(angle + u_hue) * 2.);
  outerColor = hueShift(outerColor, -(angle + u_hue) * 2.);

  vec3 color = mix(innerColor, outerColor, (1.0 - (barHeight - barDistanceFromRing) / barHeight));

  float coreBrightness = min(amp * 0.3 * u_brightness / max((barDistanceFromRing * (1.0 - amp * 0.1)), 0.001), 30.0);

  color = mix(color * coreBrightness, vec3(1.0), coreBrightness * 0.01);
  color = mix(vec3(0.0), color, a);

  color += spectrogramBackground(key, angle, channel, distanceFromRing);

  gl_FragColor = vec4(color, 1.0);
}
