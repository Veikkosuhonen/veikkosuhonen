#include "lygia/generative/pnoise.glsl"

float dist(vec3 position) {
  float distFromCenter = length(position.xz);
  return position.y + distFromCenter - 0.5 + pnoise(position * 2.0, vec3(10.0, 10.0, 10.0)) * 0.5;
}
