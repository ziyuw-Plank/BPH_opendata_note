(function() {
  'use strict';

  var STEP = 128;

  var canvas = document.createElement('canvas');
  canvas.id = 'grain-canvas';
  canvas.width = STEP;
  canvas.height = STEP;

  var ctx = canvas.getContext('2d');
  var imageData = ctx.createImageData(STEP, STEP);
  var data = imageData.data;

  for (var i = 0; i < data.length; i += 4) {
    var v = Math.floor(Math.random() * 48) + 8;
    data[i]     = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);

  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.imageRendering = 'auto';

  if (document.body) {
    document.body.appendChild(canvas);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      document.body.appendChild(canvas);
    });
  }
})();
