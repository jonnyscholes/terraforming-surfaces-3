import ShelfPack from "@mapbox/shelf-pack";
const ndcv = require("ndarray-canvas");
const ndarray = require("ndarray");

import { rRange, rArray } from "./fxhUtils";
import sort from "./pixelSort";
import { ClrGltchFast } from "./ClrGltchFast";

const SIZE = 512;
const UNIT_SIZE = rArray([32, 32, 64, 64, 128]);
const ITERATIONS = 5;
const NUM_GLTCHS = 5;

const IMG_KEY = `TS003-${window.fxhash}`;
const SKIP_CACHE = false;

export class ClrGltchSurface {
  constructor(onComplete) {
    this.width = SIZE;
    this.height = SIZE;

    this.delay = rRange(100, 400);

    this.quadrantSizes = [32, 64, 128, 256]; // TODO: Doesnt work when SIZE = 256
    this.unitSize = UNIT_SIZE;
    this.units = this.width / this.unitSize;

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d");

    this.images = null;
    this.boxes = [];

    this.lastRender = 0;
    this.paused = false;
    this.colorSpectrum = [];

    this.init(onComplete);

    return this;
  }

  async init(onComplete) {
    const imagesSaved = JSON.parse(localStorage.getItem(IMG_KEY));
    if (!imagesSaved || SKIP_CACHE) {
      this.createBoxes();
      this.images = await this.loadImages();
      this.paintRects();
      this.runFrames();

      localStorage.setItem(`${IMG_KEY}-img`, this.canvas.toDataURL());
      localStorage.setItem(
        `${IMG_KEY}-colors`,
        JSON.stringify(this.colorSpectrum)
      );

      onComplete(this.canvas, this.colorSpectrum);
      localStorage.setItem(IMG_KEY, true);
    } else {
      const data = localStorage.getItem(`${IMG_KEY}-img`);
      const colors = JSON.parse(localStorage.getItem(`${IMG_KEY}-colors`));
      this.colorSpectrum = colors;

      const image = new Image();
      image.onload = (_) => {
        this.ctx.drawImage(image, 0, 0);
        onComplete(this.canvas, this.colorSpectrum);
      };
      image.src = data;
    }

    // this.addCanvas();
  }

  addCanvas() {
    document.body.appendChild(this.canvas);
  }

  async loadImages() {
    const images = [];

    for (let i = 0; i < NUM_GLTCHS; i++) {
      let c = new ClrGltchFast();
      images.push(c.canvas);
      this.colorSpectrum.push(...c.baseColors);
    }

    // const imagesSaved = JSON.parse(localStorage.getItem(IMG_KEY));
    // console.log(imagesSaved);

    // if (!imagesSaved) {
    //   console.log("generate images");
    //   for (let i = 0; i < NUM_GLTCHS; i++) {
    //     let c = new ClrGltchFast();
    //     images.push(c.canvas);

    //     localStorage.setItem(`${IMG_KEY}-${i}`, c.canvas.toDataURL());
    //     localStorage.setItem(
    //       `${IMG_KEY}-${i}-colors`,
    //       JSON.stringify(c.baseColors)
    //     );

    //     this.colorSpectrum.push(...c.baseColors);
    //   }
    //   localStorage.setItem(IMG_KEY, true);
    // } else {
    //   console.log("fetch saved images");
    //   for (let i = 0; i < NUM_GLTCHS; i++) {
    //     const data = localStorage.getItem(`${IMG_KEY}-${i}`);

    //     const img = new Image();
    //     img.src = data;
    //     images.push(img);

    //     const colors = JSON.parse(
    //       localStorage.getItem(`${IMG_KEY}-${i}-colors`)
    //     );
    //     this.colorSpectrum.push(...colors);
    //   }
    // }

    return images;
  }

  pixelSort(x, y, w, h) {
    const pixels = this.ctx.getImageData(x, y, w, h);
    const imArr = ndarray(
      new Uint8Array(pixels.data),
      [w, h, 4],
      [4, 4 * w, 1],
      0
    );

    const filterIncludeAll = (_) => true;

    const byR = (a, b) => a[0] - b[0];
    const byG = (a, b) => a[1] - b[1];
    const byB = (a, b) => a[2] - b[2];

    const sortMethods = [byR, byG, byB];

    sort(
      imArr,
      filterIncludeAll,
      sortMethods[rRange(0, sortMethods.length - 1)]
    );

    const sortedCan = ndcv(
      null,
      imArr.transpose(1, 0, 2).pick(null, null, 0),
      imArr.transpose(1, 0, 2).pick(null, null, 1),
      imArr.transpose(1, 0, 2).pick(null, null, 2)
    );

    this.ctx.drawImage(sortedCan, x, y, w, h);
  }

  createBoxes() {
    // 16 32 64 128 256
    for (let i = fxrand() * 2; i >= 0; i--) this.boxes.push({ w: 256, h: 256 });
    for (let i = fxrand() * 20; i >= 0; i--)
      this.boxes.push({ w: 128, h: 128 });
    for (let i = fxrand() * 50; i >= 0; i--) this.boxes.push({ w: 64, h: 64 });
    for (let i = fxrand() * 50; i >= 0; i--) this.boxes.push({ w: 32, h: 32 });
    for (let i = fxrand() * 50; i >= 0; i--) this.boxes.push({ w: 16, h: 16 });

    const w = (a, b) => {
      return b.w - a.w;
    };
    const h = (a, b) => {
      return b.h - a.h;
    };
    const max = (a, b) => {
      return Math.max(b.w, b.h) - Math.max(a.w, a.h);
    };
    const min = (a, b) => {
      return Math.min(b.w, b.h) - Math.min(a.w, a.h);
    };

    const msort = (a, b, criteria) => {
      let diff;
      for (const sortFunc of criteria) {
        diff = sortFunc(a, b);
        if (diff != 0) return diff;
      }

      return 0;
    };

    const maxside = (a, b) => {
      return msort(a, b, [max, min, h, w]);
    };

    this.boxes.sort(maxside);

    const sprite = new ShelfPack(this.width, this.height);
    this.boxes = sprite.pack(this.boxes);
  }

  paintRects() {
    this.ctx.strokeStyle = "black";

    const ri = rRange(0, this.images.length - 1);
    this.ctx.drawImage(
      this.images[ri],
      0,
      0,
      this.width,
      this.height,
      0,
      0,
      this.width,
      this.height
    );

    for (const box of this.boxes) {
      this.paintRect(box);
    }
  }

  paintRect(box) {
    const ri = rRange(0, this.images.length - 1);

    this.ctx.drawImage(
      this.images[ri],
      rRange(0, this.width - box.w),
      rRange(0, this.height - box.h),
      box.w,
      box.h,
      box.x,
      box.y,
      box.w,
      box.h
    );
  }

  runFrames() {
    for (let index = 0; index < ITERATIONS; index++) {
      this.render();
    }
  }

  render() {
    const x = rRange(0, this.units - 1);
    const y = rRange(0, this.units - 1);
    const maxSz = Math.min(this.units - x, this.units - y) * this.unitSize;
    const closest = (prev, curr) =>
      Math.abs(curr - maxSz) < Math.abs(prev - maxSz) ? curr : prev;
    const size = this.quadrantSizes.filter((s) => s <= maxSz).reduce(closest);

    this.pixelSort(x * this.unitSize, y * this.unitSize, size, size);

    if (fxrand() > 0.96) {
      this.pixelSort(0, 0, size, size);
    }

    if (fxrand() > 0.95) {
      const boxes = this.boxes.filter((b) => {
        return b.w !== 256;
      });
      this.paintRect(boxes[rRange(0, boxes.length - 1)]);
    }
  }
}
