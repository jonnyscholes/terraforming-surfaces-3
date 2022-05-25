import chroma from "chroma-js";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { ClrGltchSurface } from "./lib/ClrGltchSurface";

console.log("*----------------------------------------------------------*");
console.log("* ClrGltchSurface - By @jonnyscholes - 2022 *");
console.log("*----------------------------------------------------------*");

const $container = document.querySelector(".container");

document.addEventListener("DOMContentLoaded", function () {
  new ClrGltchSurface((can, colorSpectrum) => {
    $container.classList.remove("loading");
    new ArtMiner(can, colorSpectrum);
  });
});

class ArtMiner {
  constructor(surface, spectrum) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);

    $container.appendChild(this.renderer.domElement);

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
    this.visualTexture.repeat.set(1, 1);

    const fgColor = chroma.random().saturate(10).brighten(2).rgb();
    const bgColor = chroma.random().saturate(10).rgb();

    const brightestColor = this.calcBrightestColor(spectrum);

    this.displaceMod = 1 - brightestColor / 255;

    this.bgLightColor = new THREE.Color(chroma(bgColor).hex());
    this.fgLightColor = new THREE.Color(chroma(fgColor).hex());

    this.init();
  }

  init() {
    this.loadHeightMap();
    this.addLights();
    this.addEvents();
    this.animate();
  }

  loadHeightMap() {
    const depthMaterial = new THREE.MeshPhongMaterial({
      displacementMap: this.mapTexture,
      map: this.visualTexture,
      combine: THREE.AddOperation,
      displacementScale: 20 + 20 * this.displaceMod,
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
  }

  calcBrightestColor(colors) {
    const reds = colors.map((c) => chroma(c).rgb()[0]);
    let largest = 0;

    for (let i = 0; i <= reds.length - 1; i++) {
      if (reds[i] > largest) {
        largest = reds[i];
      }
    }

    return largest;
  }

  addLights() {
    var pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(30, 30, 30);
    this.scene.add(pointLight);
    pointLight.castShadow = true;

    var fogColor = new THREE.Color(this.bgLightColor);
    this.scene.background = fogColor; // Setting fogColor as the background color also
    this.scene.fog = new THREE.Fog(fogColor, 1, 100);

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
