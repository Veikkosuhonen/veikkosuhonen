import { BlendFunction, EffectComposer, EffectPass, RenderPass, SelectiveBloomEffect } from "postprocessing"
import { createSignal, onMount } from "solid-js"
import * as THREE from 'three'
import { MapControls } from "three/examples/jsm/controls/MapControls"
import { createWaterChunkArea, WaterChunk } from "./WaterChunk"
import waterMaterial from "./materials/water"

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
    precision: 'highp'
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
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.01,
    intensity: 1.0
  });

  effect.inverted = true;
  const effectPass = new EffectPass(camera, effect);
  // composer.addPass(effectPass);

  const waterChunks = createWaterChunkArea(new THREE.Vector3(0, 0, 0), 10)
  scene.add(...waterChunks)

  camera.position.y = 10;
  camera.position.z = -10;
  const controls = new MapControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.update();

  let prevFrameTime = 0;
  const animate: FrameRequestCallback = (time) => {
    requestAnimationFrame(animate)

    const initialDistance = camera.position.distanceTo(controls.target);
    waterChunks.forEach(wc => wc.update(controls.target, initialDistance));
    waterMaterial.uniforms.u_time.value = time / 1500.0;
  
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
          waterMaterial.wireframe = !waterMaterial.wireframe
        }}>Toggle wireframe</button>
      </div>
    </div>
  )
}