import { BlendFunction, EffectComposer, EffectPass, RenderPass, SelectiveBloomEffect, ToneMappingEffect } from "postprocessing"
import { createSignal, onMount } from "solid-js"
import * as THREE from 'three'
import { MapControls } from "three/examples/jsm/controls/MapControls"
import { Sky } from "three/examples/jsm/objects/Sky"
import { ShadowMapViewer } from "three/examples/jsm/utils/ShadowMapViewer"
import { createLodChunkArea } from "./LodChunk"
import getWaterMaterial from "./materials/water"
import getCliffMaterial from "./materials/cliff"
import { createGeometry } from "./GeneratedGeometry"
import { shadowMaterial } from "./materials/shadow"

let waterMaterial: THREE.ShaderMaterial|null = null;

/**
 * Good links:
 * https://mofu-dev.com/en/blog/threejs-shadow-map/
 */

const start = () => {
  const canvas = document.getElementById('water') as HTMLCanvasElement

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 1200)
  camera.frustumCulled = true
  const renderer = new THREE.WebGLRenderer({ 
    canvas,
    antialias: false,
    stencil: false,
    depth: true,
    logarithmicDepthBuffer: true,
    precision: 'highp',
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType
  });
  composer.addPass(new RenderPass(scene, camera));

  const effect = new SelectiveBloomEffect(scene, camera, {
    radius: 0.7,
    blendFunction: BlendFunction.ADD,
    mipmapBlur: true,
    luminanceThreshold: 4.0,
    luminanceSmoothing: 0.1,
    intensity: 1.0
  });

  effect.inverted = true;
  const effectPass = new EffectPass(camera, effect);
  // composer.addPass(effectPass);

  const toneMappingEffect = new ToneMappingEffect({
    mode: THREE.ACESFilmicToneMapping,
    
  })

  const toneMappingPass = new EffectPass(camera, toneMappingEffect);
  composer.addPass(toneMappingPass);

  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(20, 20, 20);
  sun.shadow.camera = new THREE.OrthographicCamera(-40, 40, 40, -40, 0.5, 1000);
  sun.shadow.camera.position.copy(sun.position);
  sun.shadow.camera.lookAt(scene.position);
  sun.shadow.camera.layers.enable(1);
  scene.add(sun.shadow.camera);
  // const cameraHelper = new THREE.CameraHelper(sun.shadow.camera);
  // scene.add(cameraHelper);

  sun.shadow.mapSize.x = 2048;
  sun.shadow.mapSize.y = 2048;
  sun.shadow.map = new THREE.WebGLRenderTarget(sun.shadow.mapSize.x, sun.shadow.mapSize.y, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType
  });

  waterMaterial = getWaterMaterial({ shadowMap: sun.shadow.map.texture });
  const cliffMaterial = getCliffMaterial({ shadowMap: sun.shadow.map.texture });

  const waterChunks = createLodChunkArea(new THREE.Vector3(0, 0, 0), 12, waterMaterial)
  scene.add(...waterChunks);

  const cliffGeometry = createGeometry(renderer);
  const cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
  cliff.scale.setScalar(12.0);
  const cliffGroup = new THREE.Group();
  cliffGroup.layers.enable(1);
  cliffGroup.add(cliff);
  scene.add(cliffGroup);

  const sky = new Sky();
  sky.scale.setScalar( 450000 );
  scene.add(sky);

  camera.position.y = 20;
  camera.position.z = -20;
  const controls = new MapControls(camera, canvas);
  controls.target.set(0, 1.0, 0);
  controls.update();

  let prevFrameTime = 0;
  const animate: FrameRequestCallback = (time) => {
    requestAnimationFrame(animate);

    // Render cliff shadow
    cliff.material = shadowMaterial;
    renderer.setRenderTarget(sun.shadow.map);
    renderer.render(scene, sun.shadow.camera);
    renderer.setRenderTarget(null);
    cliff.material = cliffMaterial;

    // const depthViewer = new ShadowMapViewer(sun);
    // depthViewer.size.set(1024, 1024);
    // depthViewer.render( renderer );

    const initialDistance = 0 // camera.position.distanceTo(controls.target);
    waterChunks.forEach(wc => wc.update(camera.position, initialDistance));
    // console.log(waterMaterial.uniforms)
    waterMaterial!.uniforms.u_time.value = time / 1500.0;
    waterMaterial!.uniforms.u_sunDirection.value.copy(sun.position);
    waterMaterial!.uniforms.u_shadowCameraPosition.value.copy(sun.shadow.camera.position);
    waterMaterial!.uniforms.u_shadowCameraProjectionMatrix.value.copy(sun.shadow.camera.projectionMatrix);
    waterMaterial!.uniforms.u_shadowCameraViewMatrix.value.copy(sun.shadow.camera.matrixWorldInverse);
    cliffMaterial.uniforms.u_sunDirection.value.copy(sun.position);
    cliffMaterial.uniforms.u_shadowCameraPosition.value.copy(sun.shadow.camera.position);
    cliffMaterial.uniforms.u_shadowCameraProjectionMatrix.value.copy(sun.shadow.camera.projectionMatrix);
    cliffMaterial.uniforms.u_shadowCameraViewMatrix.value.copy(sun.shadow.camera.matrixWorldInverse);
    sky.material.uniforms.sunPosition.value.copy(sun.position);
  
    composer.render()
    setFrameTime(time - prevFrameTime)
    prevFrameTime = time
  }

  animate(0.0);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  })
}

const [frameTime, setFrameTime] = createSignal(0)

export default function Water() {

  onMount(() => {
    start()
  })

  return (
    <div class="bg-blue relative flex flex-col">
      <div class="relative">
        <canvas id="water" class="bg-transparent fixed top-0 w-full h-screen"></canvas>
        <div id="hud"/>
      </div>
      <div class="absolute text-amber-500 font-bold bg-slate-900/50 p-2 m-2 rounded-md">
        <p>{frameTime().toFixed(1)} ms</p>
        <p>Drag to pan, scroll to zoom</p>
        <button class="mt-4 p-1 border border-amber-500 rounded-md" onClick={() => {
          waterMaterial!.wireframe = !waterMaterial!.wireframe
        }}>Toggle wireframe</button>
      </div>
    </div>
  )
}