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

export { reshape };
