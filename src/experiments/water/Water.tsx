import { BlendFunction, EffectComposer, EffectPass, RenderPass, SelectiveBloomEffect, DepthOfFieldEffect, ToneMappingEffect } from "postprocessing"
import { createSignal, on, onCleanup, onMount } from "solid-js"
import * as THREE from 'three'
import { MapControls } from "three/examples/jsm/controls/MapControls"
import { Sky } from "three/examples/jsm/objects/Sky"
import { GPUStatsPanel } from "three/examples/jsm/utils/GPUStatsPanel"
import { createLodChunkArea } from "./LodChunk"
import getWaterMaterial from "./materials/water"
import getCliffMaterial from "./materials/cliff"
import { createGeometry } from "./GeneratedGeometry"
import { createCliff } from "./createCliff"
import { skyBox } from "./skybox"
import { Howl } from 'howler'
import { createHeightmap } from "./createHeightmap"

let waterMaterial: THREE.ShaderMaterial|null = null;
let cliffMaterial: THREE.ShaderMaterial|null = null;

const start = () => {
  const canvas = document.getElementById('water') as HTMLCanvasElement

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.frustumCulled = true
  const renderer = new THREE.WebGLRenderer({ 
    canvas,
    powerPreference: 'high-performance',
    antialias: false,
    stencil: false,
    depth: true,
    logarithmicDepthBuffer: true,
    precision: 'highp',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setSize(window.innerWidth, window.innerHeight);

  const stats = new GPUStatsPanel(renderer.getContext());
  stats.dom.style.position = 'absolute';
  stats.dom.style.top = '0px';
  stats.dom.style.right = '0px';
  stats.dom.style.zIndex = '100';
  document.body.appendChild(stats.dom);

  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
  });
  composer.addPass(new RenderPass(scene, camera));

  const dofEffect = new DepthOfFieldEffect(camera, {
    focalLength: 0.1,
    bokehScale: 5,
    height: 720,
  })
  const dofPass = new EffectPass(camera, dofEffect);
  dofEffect.cocMaterial.adoptCameraSettings(camera);
  composer.addPass(dofPass);

  const bloomEffect = new SelectiveBloomEffect(scene, camera, {
    radius: 0.7,
    blendFunction: BlendFunction.ADD,
    mipmapBlur: true,
    luminanceThreshold: 2.0,
    luminanceSmoothing: 0.1,
    intensity: 2.0,
  });
  bloomEffect.inverted = true;

  const effectPass = new EffectPass(camera, bloomEffect);
  // composer.addPass(effectPass);

  const toneMappingEffect = new ToneMappingEffect({
    mode: THREE.ACESFilmicToneMapping,
    
  })

  const toneMappingPass = new EffectPass(camera, toneMappingEffect);
  composer.addPass(toneMappingPass);

  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(-40, 10, 40);

  const heightMap = createHeightmap(renderer);

  waterMaterial = getWaterMaterial({ heightMap });
  cliffMaterial = getCliffMaterial({ heightMap });

  const waterChunks = createLodChunkArea(new THREE.Vector3(0, 0, 0), 12, waterMaterial)
  scene.add(...waterChunks);

  const cliffMesh = new THREE.PlaneGeometry(64, 64, 256, 256);
  cliffMesh.rotateX(-Math.PI / 2);
  const cliff = new THREE.Mesh(cliffMesh, cliffMaterial);
  scene.add(cliff);

  // const sky = new Sky();
  // sky.scale.setScalar( 450000 );
  // scene.add(sky);
  scene.background = skyBox;
  scene.backgroundIntensity = 2.0;

  camera.position.y = 20;
  camera.position.z = -20;
  const controls = new MapControls(camera, canvas);
  controls.target.set(0, 1.0, 0);
  controls.update();
  // dofEffect.target = controls.target;

  let prevFrameStart = 0;
  const animate: FrameRequestCallback = (time) => {
    requestAnimationFrame(animate);
    stats.startQuery();

    const initialDistance = 0 // camera.position.distanceTo(controls.target);
    waterChunks.forEach(wc => wc.update(camera.position, initialDistance));
    // console.log(waterMaterial.uniforms)
    waterMaterial!.uniforms.u_time.value = time / 1500.0;
    waterMaterial!.uniforms.u_sunDirection.value.copy(sun.position);
    cliffMaterial!.uniforms.u_sunDirection.value.copy(sun.position);
    // sky.material.uniforms.sunPosition.value.copy(sun.position);

    dofEffect.cocMaterial.focusDistance = focusDistance();

    composer.render();
    setFrameTime(time - prevFrameStart)
    prevFrameStart = time
    stats.endQuery();
  }

  animate(0.0);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  })
}

const [frameTime, setFrameTime] = createSignal(0)
const [focusDistance, setFocusDistance] = createSignal(0.96)

export default function Water() {
  let audio: Howl|undefined

  onMount(() => {
    start()
    audio = new Howl({
      src: ['/assets/oceanscape1.mp3'],
      volume: 0.2,
      loop: true,
      html5: true,
    });
  })

  onCleanup(() => {
    audio?.unload()
  })

  return (
    <div class="bg-blue relative flex flex-col text-sm">
      <div class="relative" onmousedown={() => {
        if (!audio!.playing()) {
          audio!.play()
        }
      }}>
        <canvas id="water" class="bg-transparent fixed top-0 w-full h-screen"></canvas>
        <div id="hud"/>
      </div>
      <div class="absolute text-amber-500 font-bold bg-slate-900/50 p-2 m-2 rounded-md">
        <p>{frameTime().toFixed(1)} ms</p>
        <p>Drag to pan, scroll to zoom</p>
        <div class="mt-4 flex flex-col gap-2">
          <button class="p-1 border border-amber-500 rounded-md" onClick={() => {
            waterMaterial!.wireframe = !waterMaterial!.wireframe
            cliffMaterial!.wireframe = !cliffMaterial!.wireframe
          }}>Toggle wireframe</button>
          <button class="p-1 rounded-md" onClick={() => {
            audio?.playing() ? audio!.pause() : audio!.play()
          }
          }>Toggle sound</button>
        </div>
        
        <div class="flex flex-col mt-4">
          <label for="focus" class="text-xs">Camera focus distance</label>
          <input type="range" min="0.4" max="1" step="0.01" value={focusDistance()} class="w-40" oninput={(e) => {
            setFocusDistance(parseFloat(e.currentTarget.value))
          }}/>
        </div>
      </div>
    </div>
  )
}