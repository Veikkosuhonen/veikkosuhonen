import * as THREE from 'three'

const LOD_RANGE0 = 900;
const LOD_MAX_DEPTH = 5;

const THRESHOLD = 0.1;

const WIDTH = 160;
const HEIGHT = 160;
const widthSegments = 46;
const heightSegments = 46;
const geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT, widthSegments, heightSegments);

export const createLodChunkArea = (centerPosition: THREE.Vector3, size: number, material: THREE.Material) => {
  const chunks = [];
  
  for (let x = -size; x < size; x++) {
    for (let z = -size; z < size; z++) {
      const position = new THREE.Vector3(x * WIDTH, 0, z * HEIGHT);
      const worldPosition = position.clone().add(centerPosition);
      const chunk = new LodChunk(position, worldPosition, 0, material);
      chunks.push(chunk);
    }
  }

  return chunks;
}

export class LodChunk extends THREE.Group {
  mesh: THREE.Mesh;
  isSubdivided: boolean = false;
  lodDepth: number;
  childChunks: LodChunk[] = [];
  scaleFactor: number;
  worldPosition: THREE.Vector3;
  material: THREE.Material;

  constructor(position: THREE.Vector3, worldPosition: THREE.Vector3, lodDepth: number, material: THREE.Material) {
    super();
    this.position.copy(position);
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;
    this.mesh.rotation.x = -Math.PI / 2;
    this.scaleFactor = 1 / (1 << lodDepth);
    this.mesh.scale.set(this.scaleFactor, this.scaleFactor, 1);
    this.add(this.mesh);
    this.lodDepth = lodDepth;
    this.worldPosition = worldPosition;
    this.material = material;
  }

  update(targetPosition: THREE.Vector3, initialDistance: number) {
    if (this.isSubdivided && this.lodDepth < LOD_MAX_DEPTH) {
      this.childChunks.forEach((child: LodChunk) => {
        child.update(targetPosition, initialDistance);
      });
    }

    const distance = targetPosition.distanceTo(this.worldPosition) + initialDistance;
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
      const child = new LodChunk(positions[i], positions[i].clone().add(this.worldPosition), this.lodDepth + 1, this.material);
      this.add(child);
      this.childChunks.push(child);
    }
  }

  removeChildren() {
    this.childChunks.forEach((child: LodChunk) => {
      this.remove(child);
    });
    this.childChunks = [];
  }
}
