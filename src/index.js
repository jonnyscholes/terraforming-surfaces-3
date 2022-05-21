import chroma from "chroma-js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

import { Surface } from "./lib/Surface";
import { complementryRGBColor } from "./lib/utils";

document.addEventListener("DOMContentLoaded", function () {
  new Surface((can) => {
    new ArtMiner(can);
    can.classList.add("surface");
    document.body.appendChild(can);
  });
});

class ArtMiner {
  constructor(surface) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    document.body.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.loader = new THREE.TextureLoader();

    this.camera = new THREE.PerspectiveCamera(85, aspect, 1, 10000);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.camera.position.y = 50;
    this.camera.position.z = 30;
    this.camera.position.x = 30;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.delay = 16;

    this.controls.update();

    this.mapTexture = new THREE.CanvasTexture(surface);
    this.visualTexture = this.mapTexture;
    // this.visualTexture.repeat.set(0.165, 1);
    this.visualTexture.repeat.set(1, 1);

    const fgColor = chroma.random().saturate(10).luminance(0.5).rgb();
    const bgColor = chroma.random().saturate(10).rgb();

    this.bgLightColor = new THREE.Color(chroma(bgColor).hex());
    this.fgLightColor = new THREE.Color(chroma(fgColor).hex());

    this.init();
  }

  async init() {
    await this.loadHeightMap();
    this.addLights();
    this.addEvents();
    this.animate();
  }

  async loadHeightMap() {
    // this.mapTexture = await this.loader.loadAsync(MAP_ASS);
    // this.visualTexture = await this.loader.loadAsync(VIS_ASS);

    const depthMaterial = new THREE.MeshPhongMaterial({
      displacementMap: this.mapTexture,
      // bumpMap: this.mapTexture,
      map: this.visualTexture,
      combine: THREE.AddOperation,
      displacementScale: 30,
      reflectivity: 0,
      shininess: 0,
      side: THREE.DoubleSide,
    });

    const elevationPlaneGeo = new THREE.SphereGeometry(20, 100, 100);
    this.planetMesh = new THREE.Mesh(elevationPlaneGeo, depthMaterial);
    this.planetMesh.castShadow = false;
    this.planetMesh.receiveShadow = true;
    this.planetMesh.rotation.x = -Math.PI / 2;
    this.planetMesh.position.y = 0;

    this.scene.add(this.planetMesh);

    // const mirrorGeom = new THREE.PlaneGeometry(40, 64);
    // const groundMirror = new Reflector(mirrorGeom, {
    //   clipBias: 0.003,
    //   textureWidth: window.innerWidth * window.devicePixelRatio,
    //   textureHeight: window.innerHeight * window.devicePixelRatio,
    //   color: 0x0000ff,
    // });
    // groundMirror.rotateX((Math.PI / 5) * -1);
    // groundMirror.position.y = 50;
    // groundMirror.rotateX(-Math.PI / 2);

    // this.scene.add(groundMirror);
  }

  addLights() {
    var pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(30, 30, 30);
    this.scene.add(pointLight);
    pointLight.castShadow = true;

    var fogColor = new THREE.Color(this.bgLightColor);
    this.scene.background = fogColor; // Setting fogColor as the background color also
    this.scene.fog = new THREE.Fog(fogColor, 1, 150);

    var hemiLight = new THREE.HemisphereLight(
      this.fgLightColor,
      this.bgLightColor,
      1
    );
    this.scene.add(hemiLight);

    var ambLight = new THREE.AmbientLight(this.fgLightColor, 0.4);
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
      let offset = this.visualTexture.offset.x;
      if (offset >= 0.5) {
        offset = 0;
      } else {
        offset += 0.00005;
      }
      this.visualTexture.offset.set(offset, 0);

      this.planetMesh.rotation.y += 0.005;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
