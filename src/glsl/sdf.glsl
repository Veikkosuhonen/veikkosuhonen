#include "lygia/generative/fbm.glsl"

float dist(vec3 position) {
  // Scale down
  position *= 2.0;

  float distFromCenter = length(position.xz);

  vec2 uv = position.xz;

  uv.s += 0.5 * fbm(0.2 * uv);
  uv.t += 0.5 * fbm(0.2 * uv.ts);

  float height = fbm(0.4 * uv);
  height -= pow(max(abs(uv.x), abs(uv.y)) / 2.0, 16.0);

  float y = position.y - 1.0;
  y = 0.7 * y * y + y * y * y;

  float topSurface = sin(distFromCenter * 0.1);
  topSurface += 0.3 * fbm(0.2 * uv + vec2(123.0));
  y *= 1.0 + 100000.0 * smoothstep(1.0 - topSurface, 1.1 - topSurface, position.y);

  return y - height;
}
