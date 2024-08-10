import * as THREE from 'three';
import { createGeometry } from './GeneratedGeometry';
import vertexShader from '../../glsl/distanceField.vert';
import fragmentShader from '../../glsl/distanceField.frag';
const distanceFieldMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
})

export const createCliff = (renderer: THREE.WebGLRenderer, cliffMaterial: THREE.Material) => {
  const cliffGeometry = createGeometry(renderer);
  const cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
  cliff.scale.setScalar(10.0);
  const cliffGroup = new THREE.Group();
  cliffGroup.add(cliff);

  const planeGeometry = new THREE.PlaneGeometry(100, 100, 1, 1);
  const plane = new THREE.Mesh(planeGeometry, distanceFieldMaterial);
  plane.rotation.x = -Math.PI / 2;
  const camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0.1, 2);
  camera.position.y = 1;
  camera.lookAt(0, 0, 0);

  const renderTarget = new THREE.WebGLRenderTarget(512, 512);
  const rtScene = new THREE.Scene();
  rtScene.add(plane);
  rtScene.add(camera);
  renderer.setRenderTarget(renderTarget);
  renderer.render(rtScene, camera);
  renderer.setRenderTarget(null);
  const texture = renderTarget.texture;

  return {
    cliffGroup,
    texture,
    camera,
  };
}