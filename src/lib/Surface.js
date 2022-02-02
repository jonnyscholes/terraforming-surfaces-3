import ShelfPack from "@mapbox/shelf-pack";
const ndcv = require("ndarray-canvas");
const blur = require("ndarray-gaussian-filter");
const ndarray = require("ndarray");

import { rRange, rArray, shuffleArray, toTitleCase } from "./fxhUtils";
import sort from "./pixelSort";

const SIZE = 512;
const MAX_IMGS = 5;

const IMAGE_COUNT = rRange(2, MAX_IMGS);
const UNIT_SIZE = rArray([32, 32, 64, 64, 128]);
const COLOR_SCHEME = "dark";
const EXTRA_COLOR = fxrand() < 0.1;
const ITERATIONS = 5;

export class Surface {
  constructor(onComplete) {
    console.log("*----------------------------------------------------------*");
    console.log("* TODO - By @jonnyscholes - 2022 *");
    console.log("*----------------------------------------------------------*");

    this.width = SIZE;
    this.height = SIZE;

    this.delay = rRange(100, 400);

    this.imageCount = IMAGE_COUNT;
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

    this.init(onComplete);

    return this;
  }

  async init(onComplete) {
    console.log("init");
    this.createBoxes();
    this.images = await this.loadImages();
    this.paintRects();
    this.animate();
    console.log("before onComplete");
    onComplete(this.canvas);
  }

  async loadImages() {
    const nums = [1, 2, 3, 4, 5];
    shuffleArray(nums);
    const mixed = ["light", "dark", "light", "dark", rArray(["light", "dark"])];
    const images = nums.slice(0, this.imageCount).map((n, i) => {
      let folder = COLOR_SCHEME === "mixed" ? mixed[i] : COLOR_SCHEME;
      return imageCanvas(n, folder, this.width, this.height);
    });

    if (EXTRA_COLOR) {
      images.push(
        imageCanvas(rArray([1, 2, 3]), "vivid", this.width, this.height)
      );
    }
    return Promise.all(images);
  }

  pixelSort(x, y, w, h) {
    var pixels = this.ctx.getImageData(x, y, w, h);
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

    // blur(imArr, 1);

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

  animate() {
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

function imageCanvas(id, subfolder, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = function () {
      ctx.drawImage(img, 0, 0, canvas.width + 2, canvas.height + 2);
      resolve(canvas);
    };

    img.src = `./images/${subfolder}-${id}.png`;
  });
}
