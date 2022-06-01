import chroma from "chroma-js";

export function rRange(from, to) {
  return (fxrand() * (to - from) + from).toFixed(0) * 1;
}

export function rChromaColor() {
  const digits = "0123456789abcdef";
  let code = "#";
  for (let i = 0; i < 6; i++) {
    code += digits.charAt(Math.floor(fxrand() * 16));
  }
  return chroma(code);
}

export function rrSet(max) {
  let orderNumbers = new Set();

  for (let i = 1; ; i++) {
    let random = Math.floor(Math.random() * max + 1);
    orderNumbers.add(random);

    if (orderNumbers.size == max) {
      break;
    }
  }

  return orderNumbers;
}

export function rDoubleRange(from, to) {
  return (fxrand() * (to - from) + from) * 1;
}

export function rbool(thresh = 0.5) {
  return fxrand() > thresh;
}

export function rArray(arr) {
  return arr[rRange(0, arr.length - 1)];
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(fxrand() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function toTitleCase(str) {
  return str.replace(/\p{L}+('\p{L}+)?/gu, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  });
}
