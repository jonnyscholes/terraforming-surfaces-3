function oneDTotwoD(arr) {
  console.log(arr);
  const newArr = [];
  while (arr.length) {
    newArr.push(arr.slice(0, 3));
  }
  return newArr;
}

function reshape(arr, rows, cols) {
  const newArr = [];

  for (var r = 0; r < rows; r++) {
    var row = [];
    for (let c = 0; c < cols; c++) {
      let i = r * cols + c;
      if (i < arr.length) {
        row.push(arr[i]);
      }
    }
    newArr.push(row);
  }

  return newArr;
}

function complementryRGBColor(r, g, b) {
  if (Math.max(r, g, b) == Math.min(r, g, b)) {
    return [255 - r, 255 - g, 255 - b];
  } else {
    (r /= 255), (g /= 255), (b /= 255);
    var max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    var h,
      s,
      l = (max + min) / 2;
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h = Math.round(h * 60 + 180) % 360;
    h /= 360;

    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
}

function hexToVBColor(rrggbb) {
  var bbggrr = rrggbb.substr(4, 2) + rrggbb.substr(2, 2) + rrggbb.substr(0, 2);
  return parseInt(bbggrr, 16);
}

export { reshape, complementryRGBColor, hexToVBColor };
