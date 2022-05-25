const ndcv = require("ndarray-canvas");
const ndarray = require("ndarray");
import chroma from "chroma-js";

import { rRange } from "./fxhUtils";
import sort from "./pixelSort";

export class ClrGltch {
  constructor() {
    this.SCALE = 512;
    this.COLORS = this.SCALE * this.SCALE;
    this.PX = 1;
    this.SIZE = this.SCALE * this.PX;

    this.width = this.SIZE;
    this.height = this.SIZE;

    this.delay = 60;

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d");

    this.lastRender = 0;
    this.offset = 0;
    this.maxOffset = 50;

    const baseColors = new Array(rRange(2, 5))
      .fill(false)
      .map((_) => rRange(0, 16777215));

    // const baseColors = [6701143, 8086468, 15852659];

    this.colorList = chroma.scale(baseColors).mode("lch").colors(this.COLORS);

    this.init();

    return this;
  }

  async init() {
    this.addCanvas();
    this.paintColors();
    this.runRender();
  }

  addCanvas() {
    document.body.appendChild(this.canvas);
  }

  paintColors() {
    for (let y = 0; y < this.SCALE; y++) {
      for (let x = 0; x < this.SCALE; x++) {
        let i = y * this.SCALE + x;
        let color = this.colorList[i];

        this.ctx.fillStyle = `${color}`;
        this.ctx.fillRect(x * this.PX, y * this.PX, this.PX, this.PX);
      }
    }
  }

  pixelSort(x, y, w, h, method) {
    var pixels = this.ctx.getImageData(x, y, w, h);
    const imArr = ndarray(
      new Uint8Array(pixels.data),
      [w, h, 4],
      [4, 4 * w, 1],
      0
    );

    const filterIncludeAll = (_) => true;

    sort(imArr, filterIncludeAll, method);

    const sortedCan = ndcv(
      null,
      imArr.transpose(0, 1, 2).pick(null, null, 0),
      imArr.transpose(0, 1, 2).pick(null, null, 1),
      imArr.transpose(0, 1, 2).pick(null, null, 2)
    );

    this.ctx.drawImage(sortedCan, x, y, w, h);
  }

  runRender() {
    for (let i = 0; i < 3; i++) {
      this.render(
        this.maxOffset -
          Math.abs((this.offset++ % (this.maxOffset * 2)) - this.maxOffset)
      );
    }
  }

  render(offset) {
    const byOffRGB = (a, b, offset, i) => {
      const o = Math.min(offset, 255);
      if (a[i] - o > b[i]) {
        return 1;
      } else if (a[i] - o < b[i]) {
        return -1;
      } else {
        return 0;
      }
    };

    const byOffR = (a, b, off) => byOffRGB(a, b, off, 0);
    const byOffG = (a, b, off) => byOffRGB(a, b, off, 1);
    const byOffB = (a, b, off) => byOffRGB(a, b, off, 2);

    const u = parseInt(this.canvas.width / 8);
    const w = this.canvas.width;
    const h = this.canvas.width;

    this.pixelSort(0, 0, w, h, (a, b) => byOffR(a, b, offset));
    this.pixelSort(u, u, w - u * 2, h - u * 2, (a, b) => byOffG(a, b, offset));
    this.pixelSort(u * 2, u * 2, w - u * 4, h - u * 4, (a, b) =>
      byOffB(a, b, offset)
    );
  }
}
