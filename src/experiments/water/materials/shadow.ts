import * as THREE from 'three';
import vertexShader from '../../../glsl/shadow.vert';
import shadowFragmentShader from '../../../glsl/shadow.frag';

export const shadowMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: shadowFragmentShader,
  uniforms: {
    u_heightMap: { value: null },
  }
});
