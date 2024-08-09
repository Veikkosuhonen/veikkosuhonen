// https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderChunk/packing.glsl.js#L18
#include <packing>

void main(){
    // gl_FragCoord.z contains depth values from 0 to 1 in the viewing frustum range of the shadow camera.
    // 0 for near clip, 1 for far clip
    gl_FragColor = packDepthToRGBA(gl_FragCoord.z);
}