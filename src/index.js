import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";

// import { Surface } from "./lib/Surface";

document.addEventListener("DOMContentLoaded", function () {
  new ArtMiner();
  // const surface = new Surface((can) => {
  //   console.log("here");
  //   document.body.appendChild(can);
  // });
});

// TODO: Cut off the repeated section except for 5% and updated render to jump at 95%.
// this.visualTexture.repeat.set() will need to be updated to match.
var MAP_ASS = "./images/3-primaries/heightmap.png";
var VIS_ASS = "./images/3-primaries/texture.png";

class ArtMiner {
  constructor() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.loader = new THREE.TextureLoader();

    this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.camera.position.y = 50;
    this.camera.position.z = 30;
    this.camera.position.x = 30;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.delay = 16;

    this.controls.update();

    this.mapTexture = null;
    this.visualTexture = null;

    this.init();
  }

  async init() {
    this.loadObjects((_) => {
      console.log("loaded");
    });
    await this.loadHeightMap();
    this.addLights();
    this.addEvents();
    this.animate();
  }

  async loadHeightMap() {
    this.mapTexture = await this.loader.loadAsync(MAP_ASS);
    this.visualTexture = await this.loader.loadAsync(VIS_ASS);
    this.visualTexture.repeat.set(1, 0.165);
    window.visualTexture = this.visualTexture;

    const depthMaterial = new THREE.MeshPhongMaterial({
      displacementMap: this.mapTexture,
      // bumpMap: this.mapTexture,
      map: this.visualTexture,
      combine: THREE.AddOperation,
      displacementScale: 4.5,
      color: new THREE.Color(0xffffff),
    });

    const scale = this.mapTexture.image.height;
    console.log(scale);
    const elevationPlaneGeo = new THREE.PlaneBufferGeometry(
      20,
      20,
      scale,
      scale
    );
    // const elevationPlaneGeo = new THREE.RingGeometry(0, 20, 1000, 1000);
    const elevationPlane = new THREE.Mesh(elevationPlaneGeo, depthMaterial);
    elevationPlane.castShadow = false;
    elevationPlane.receiveShadow = true;
    elevationPlane.rotation.x = -Math.PI / 2;
    elevationPlane.position.y = 0;

    this.scene.add(elevationPlane);
  }

  loadObjects(onLoaded) {
    const manager = new THREE.LoadingManager();
    const path = "objects/3dviewer/";

    new MTLLoader(manager).setPath(path).load("model.mtl", (materials) => {
      materials.preload();

      new OBJLoader(manager)
        .setMaterials(materials)
        .setPath(path)
        .load("model.obj", (object) => {
          object.scale.set(15, 15, 15);
          object.position.set(-1, -9, 0);
          this.scene.add(object);
          onLoaded();
        });
    });
  }

  addLights() {
    var pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(30, 30, 30);
    this.scene.add(pointLight);
    pointLight.castShadow = true;

    var ambLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambLight);
  }

  addEvents() {
    window.addEventListener(
      "resize",
      (e) => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      },
      false
    );
  }

  animate(now) {
    if (
      (!this.lastRender || now - this.lastRender >= this.delay) &&
      !this.paused
    ) {
      this.lastRender = now;

      this.render();
    }

    requestAnimationFrame(this.animate.bind(this));
  }

  render() {
    this.controls.update();
    if (this.visualTexture) {
      let offset = this.visualTexture.offset.y;
      if (offset >= 0.5) {
        offset = 0;
      } else {
        offset += 0.0005;
      }
      this.visualTexture.offset.set(0, offset);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
