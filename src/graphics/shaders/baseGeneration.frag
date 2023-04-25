#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform float u_seed;

out vec4 outColor;

float hash(float n) { return fract(sin(n) * 1e4); }
float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

vec2 rotate(vec2 v, float a) {
  float s = sin(a);
  float c = cos(a);
  mat2 m = mat2(c, -s, s, c);
  return m * v;
}

float noise(vec2 x) {
	vec2 i = floor(x);
	vec2 f = fract(x);

	// Four corners in 2D of a tile
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));

	// Simple 2D lerp using smoothstep envelope between the values.
	// return vec3(mix(mix(a, b, smoothstep(0.0, 1.0, f.x)),
	//			mix(c, d, smoothstep(0.0, 1.0, f.x)),
	//			smoothstep(0.0, 1.0, f.y)));

	// Same code, with the clamps in smoothstep and common subexpressions
	// optimized away.
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float centeredNoise(vec2 x) {
  return noise(x) * 2.0 - 1.0;
}

float fbm(vec2 st, float granularity) {
  // Initial values
  float value = 0.0;
  float amplitude = .5;

  // Loop of octaves
  for (int i = 0; i < 16; i++) {
    float iter = float(i + 1);
  
    value += amplitude * centeredNoise(st);
    st.x += iter * 0.69371;
    st.y += iter * 0.92537;
    st *= 2.;
    st = rotate(st, hash(10.0 * iter));
    amplitude *= granularity;
  }

  return value;
}

float fbm(vec2 st) {
  return fbm(st, 0.5);
}

float baseHeightMap(in vec2 st) {
  st.x += fbm(st) * 0.25;
  st.y += fbm(st) * 0.25;
  float granularity = fbm(st * 2.0 + 40.0) * 0.15 + 0.45;
  float height = fbm(st, granularity) * 1.1;
  return height;
}

float canyonHeightMap(in vec2 st) {
  st = rotate(st, 1.0 + 0.1 * fbm(st));

  for (int i = 0; i < 4; i++) {
    st.x += fbm(st) * 0.5;
    st.y += fbm(st) * 0.5;
  }
  
  float height = fbm(st);

  return height * height * 0.5;
}

float computeHeight(in vec2 st) {
  float height = baseHeightMap(st) + 0.02;

  height -= canyonHeightMap(10.0 - st * 0.3);
  height -= canyonHeightMap(10.0 + st) * 0.5;

  return height;
}

float computeHardness(in vec2 st) {
  return clamp(baseHeightMap(st) * 0.5 + 0.5, 0.0, 1.0);
}

void main() {
  vec2 st0 = gl_FragCoord.st / u_resolution;

  float distanceFromCenter = length(st0 - vec2(0.5));
  float squareMask = max(abs(st0.x - 0.5), abs(st0.y - 0.5));

  vec2 st = st0;
  st += u_seed / 10000.0;
  st *= 3.0;
  
  float height = computeHeight(st);

  // slight circular mask
  height -= smoothstep(0.4, 0.5, distanceFromCenter) * 0.3;
  // rect mask
  height -= smoothstep(0.38, 0.48, squareMask) * 0.3;

  float hardness = computeHardness(2.0 * st0 - u_seed / 1000.0) + 0.02;

  vec4 data = vec4(height, 0.0, 0.0, hardness);

  outColor = data;
}
