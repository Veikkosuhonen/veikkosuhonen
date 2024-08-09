import * as THREE from 'three';
import { SDFGeometryGenerator } from "three/examples/jsm/geometries/SDFGeometryGenerator"
import sdf from "../../glsl/sdf.glsl"

export const createGeometry = (renderer: THREE.WebGLRenderer) => {
  const generator = new SDFGeometryGenerator( renderer );
  const geometry = generator.generate( 128, sdf, 2.0 ); // ~> THREE.BufferGeometry
  geometry.computeVertexNormals();
  return geometry;
}
