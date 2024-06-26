import { Component, createSignal, onMount } from 'solid-js'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { 
  EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode, BlendFunction,
	EdgeDetectionMode,
	SelectiveBloomEffect,
	SMAAEffect,
	SMAAPreset,
} from "postprocessing";

const G = 3
const AU = 10
const M_sun = 1
const M_earth = 0.000003


const [simulationSpeed, setSimulationSpeed] = createSignal(0.5)


class OrbitalBody {

  mass: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  force: THREE.Vector3
  mesh: THREE.Mesh
  trail: THREE.Points | null

  constructor(mass: number, position: THREE.Vector3, velocity: THREE.Vector3, mesh: THREE.Mesh, trail: THREE.Points | null = null) {
    this.mass = mass
    this.position = position
    this.velocity = velocity
    this.mesh = mesh
    this.force = new THREE.Vector3()
    this.trail = trail
  }

  updateForce(other: OrbitalBody) {
    const r = other.position.clone().sub(this.position)
    const distance = r.length()
    const force = r.normalize().multiplyScalar(G * this.mass * other.mass / (distance * distance))
    this.force.add(force)
  }

  updatePosition(deltaTime: number) {
    this.velocity.add(this.force.clone().multiplyScalar(deltaTime / this.mass))

    this.position.add(this.velocity.clone().multiplyScalar(deltaTime))

    this.force.set(0, 0, 0)
  }

  updateMesh() {
    this.mesh.position.copy(this.position)

    if (this.trail) {
      const positions = this.trail.geometry.attributes.position.array as Float32Array
      for (let i = positions.length - 3; i >= 3; i -= 3) {
        positions[i] = positions[i - 3]
        positions[i + 1] = positions[i - 2]
        positions[i + 2] = positions[i - 1]
      }
      positions[0] = this.mesh.position.x
      positions[1] = this.mesh.position.y
      positions[2] = this.mesh.position.z
      this.trail.geometry.attributes.position.needsUpdate = true
    }
  }
}

const createTrail = (length: number, color: number) => {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(length * 3)
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({ color: color, side: THREE.BackSide, sizeAttenuation: true, size: 0.2, depthTest: false})
  const trail = new THREE.Points(geometry, material)
  return trail
}

const createStar = (name: string, mass: number, position: THREE.Vector3, velocity: THREE.Vector3, color: number, radius: number) => {
  const geometry = new THREE.SphereGeometry(radius)
  const material = new THREE.MeshPhongMaterial({ color: color, emissive: color, emissiveIntensity: 100.0, shininess: 0 })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(position)

  mesh.add(new THREE.PointLight(color, 50, 0, 2))

  const labelDiv = document.createElement('div')
  labelDiv.className = 'mt-16 mr-16 text-white text-sm bg-black bg-opacity-20 p-1 rounded-md'
  labelDiv.textContent = name
  const label = new CSS2DObject(labelDiv)
  label.position.set(0, 0, 0)
  label.position.set(0, 0, 0)
  mesh.add(label)

  const trail = createTrail(1000, color)

  return new OrbitalBody(mass, position, velocity, mesh, trail)
}

const createPlanet = (mass: number, position: THREE.Vector3, velocity: THREE.Vector3, color: number, radius: number) => {
  const geometry = new THREE.SphereGeometry(radius)
  const material = new THREE.MeshPhongMaterial({ color: color, emissiveIntensity: 0.0, shininess: 0 })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(position)

  const labelDiv = document.createElement('div')
  labelDiv.className = 'mt-8 mr-8 text-white text-sm bg-black bg-opacity-20 p-1 rounded-md'
  labelDiv.textContent = "Planet"
  const label = new CSS2DObject(labelDiv)
  label.center.set(0, 0)
  label.position.set(0, 0, 0)
  mesh.add(label)

  const trail = createTrail(1000, color)

  return new OrbitalBody(mass, position, velocity, mesh, trail)
}

const start = () => {
  const canvas = document.getElementById('threebody') as HTMLCanvasElement

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.frustumCulled = false
  const renderer = new THREE.WebGLRenderer({ 
    canvas,
    antialias: false,
    stencil: false,
    depth: true,
    logarithmicDepthBuffer: true,
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType
  });
  composer.addPass(new RenderPass(scene, camera));


  const smaaEffect = new SMAAEffect({
    preset: SMAAPreset.HIGH,
    edgeDetectionMode: EdgeDetectionMode.DEPTH
  });

  smaaEffect.edgeDetectionMaterial.edgeDetectionThreshold = 0.01;

  const effect = new SelectiveBloomEffect(scene, camera, {
    radius: 0.7,
    blendFunction: BlendFunction.ADD,
    mipmapBlur: true,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.2,
    intensity: 0.1
  });

  effect.inverted = true;
  const effectPass = new EffectPass(camera, smaaEffect, effect);
  composer.addPass(effectPass);

  const alphaCentauri = createStar(
    'Alpha Centauri', 
    1.1 * M_sun, 
    new THREE.Vector3(0, 0, 0), 
    new THREE.Vector3(0, 0, -0.1), 
    0xfff0e9, 
    1.2175
  )
  const betaCentauri = createStar(
    'Beta Centauri', 
    0.907 * M_sun, 
    new THREE.Vector3(3 * -AU, 0.2 * AU, -0.2 * AU), 
    new THREE.Vector3(0.1, 0.1, 0.35), 
    0xffe8d5, 
    0.8591
  )
  const proximaCentauri = createStar(
    'Proxima Centauri', 
    0.122 * M_sun, 
    new THREE.Vector3(3 * AU, -0.2 * AU, 0.2 * AU), 
    new THREE.Vector3(-0.1, -0.2, 0.1), 
    0xffb46b, 
    0.1542
  )

  const orbitalBodies = [
    alphaCentauri,
    betaCentauri,
    proximaCentauri,
    createPlanet(M_earth, new THREE.Vector3(AU * 0.8, 0, 0), new THREE.Vector3(0, 0, 0.6), 0xa0a0a0, 0.2),
  ]
  const system = new THREE.Group()
  scene.add(system)

  orbitalBodies.forEach(body => {
    system.add(body.mesh)
    if (body.trail) {
      system.add(body.trail)
    }
  })


  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize( window.innerWidth, window.innerHeight );
  labelRenderer.domElement.style.position = 'fixed';
  labelRenderer.domElement.style.top = '0px';
  document.getElementById("hud")!.appendChild( labelRenderer.domElement );

  camera.position.y = 60

  const controls = new OrbitControls(camera, labelRenderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();


  const animate: FrameRequestCallback = () => {
    requestAnimationFrame(animate)

    const deltaTimePerFrame = simulationSpeed()
    const stepsPerFrame = 20

    for (let step = 0; step < stepsPerFrame; step++) {
      const deltaTime = deltaTimePerFrame / stepsPerFrame


      for (let i = 0; i < orbitalBodies.length; i++) {
        for (let j = 0; j < orbitalBodies.length; j++) {
          if (i !== j) {
            orbitalBodies[i].updateForce(orbitalBodies[j])
          }
        }
      }


      orbitalBodies.forEach(body => {
        body.updatePosition(deltaTime)
        
      })
    }

    const centerOfMass = new THREE.Vector3()
    let totalMass = 0

    orbitalBodies.forEach((body) => {
      body.updateMesh()
      centerOfMass.addScaledVector(body.position, body.mass)
      totalMass += body.mass

      camera.updateMatrixWorld()
    })

    centerOfMass.divideScalar(totalMass)

    system.position.copy(centerOfMass.clone().negate())

    labelRenderer.render(scene, camera);
    composer.render();
  }

  animate(0.0)

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
  })
}

export default function ThreeBody() {

  onMount(() => {
    start()
  })

  const fasterStr = "2x Faster >>"
  const slowerStr = "<< 2x Slower"

  return (
    <div class="bg-blue relative flex flex-col">
      <div class="relative">
        <canvas id="threebody" class="bg-transparent fixed top-0 w-full h-screen"></canvas>
        <div id="hud"/>
      </div>
      <div class="absolute left-1/2 ">
        <div class="flex gap-2 text-white text-lg">
          <button onMouseDown={() => setSimulationSpeed(simulationSpeed() / 2)} class="text-slate-300 bg-black bg-opacity-50 p-2 rounded-md hover:text-white">{slowerStr}</button>
          <button onMouseDown={() => setSimulationSpeed(simulationSpeed() * 2)} class="text-slate-300 bg-black bg-opacity-50 p-2 rounded-md hover:text-white">{fasterStr}</button>
        </div>
      </div>
    </div>
  )
}
