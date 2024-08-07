import * as THREE from 'three'
import waterMaterial from "./materials/water"

const LOD_RANGE0 = 900;
const LOD_MAX_DEPTH = 5;

const THRESHOLD = 0.1;

const WIDTH = 200;
const HEIGHT = 200;
const widthSegments = 46;
const heightSegments = 46;
const geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT, widthSegments, heightSegments);

export const createWaterChunkArea = (centerPosition: THREE.Vector3, size: number) => {
  const chunks = [];
  
  for (let x = -size; x < size; x++) {
    for (let z = -size; z < size; z++) {
      const position = new THREE.Vector3(x * WIDTH, 0, z * HEIGHT);
      const worldPosition = position.clone().add(centerPosition);
      const chunk = new WaterChunk(position, worldPosition, 0);
      chunks.push(chunk);
    }
  }

  return chunks;
}

export class WaterChunk extends THREE.Group {
  mesh: THREE.Mesh;
  isSubdivided: boolean = false;
  lodDepth: number;
  childChunks: WaterChunk[] = [];
  scaleFactor: number;
  worldPosition: THREE.Vector3;

  constructor(position: THREE.Vector3, worldPosition: THREE.Vector3, lodDepth: number) {
    super();
    this.position.copy(position);
    this.mesh = new THREE.Mesh(geometry, waterMaterial);
    this.mesh.rotation.x = -Math.PI / 2;
    this.scaleFactor = 1 / (1 << lodDepth);
    this.mesh.scale.set(this.scaleFactor, this.scaleFactor, 1);
    this.add(this.mesh);
    this.lodDepth = lodDepth;
    this.worldPosition = worldPosition;
  }

  update(cameraPosition: THREE.Vector3) {
    if (this.isSubdivided && this.lodDepth < LOD_MAX_DEPTH) {
      this.childChunks.forEach((child: WaterChunk) => {
        child.update(cameraPosition);
      });
    }

    const distance = cameraPosition.distanceTo(this.worldPosition);
    const lodRange = LOD_RANGE0 / (2 << this.lodDepth);
  
    if (distance < lodRange - THRESHOLD && !this.isSubdivided) {
      this.subdivide();
    } else if (distance > lodRange + THRESHOLD && this.isSubdivided) {
      this.merge();
    }
  }

  subdivide() {
    console.log('subdividing', this.lodDepth);
    this.isSubdivided = true;
    this.mesh.visible = false;

    this.createChildren();
  }

  merge() {
    console.log('merging', this.lodDepth);
    this.isSubdivided = false;
    this.mesh.visible = true;
    this.removeChildren();
  }

  createChildren() {
    const width = this.scaleFactor * WIDTH;
    const height = this.scaleFactor * HEIGHT;
    
    const stichingFix = 0.25 * this.scaleFactor;

    // Add 4 children
    const positions = [
      new THREE.Vector3(-width / 4, stichingFix, -height / 4),
      new THREE.Vector3(-width / 4, stichingFix, height / 4),
      new THREE.Vector3(width / 4,  stichingFix, -height / 4),
      new THREE.Vector3(width / 4,  stichingFix, height / 4),
    ];

    for (let i = 0; i < 4; i++) {
      const child = new WaterChunk(positions[i], positions[i].clone().add(this.worldPosition), this.lodDepth + 1);
      this.add(child);
      this.childChunks.push(child);
    }
  }

  removeChildren() {
    this.childChunks.forEach((child: WaterChunk) => {
      this.remove(child);
    });
    this.childChunks = [];
  }
}
