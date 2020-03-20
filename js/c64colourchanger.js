/*
  C64 colour changer JS
  Homepage: https://github.com/codepo8/c64-colour-changer/
  Copyright (c) 2020 Christian Heilmann
  Code licensed under the BSD License:
  http://christianheilmann.com/license.txt
*/

(function(){

  if (!document.querySelector) {return false;}
  var swab =       document.querySelector('#swab');
  var c64palette = document.querySelector('#c64colours');
  var container =  document.querySelector('#container');
  var save =  document.querySelector('#savebutton');
  var url = window.URL || window.webkitURL;
  var objURL = url.createObjectURL || false;
  var fileinput = document.querySelector('#getfile');
  var c = document.querySelector('#main');
  var ctx = c.getContext('2d');
  var zc = document.querySelector('#zoom');
  var zcx = zc.getContext('2d');
  zc.width = 80;
  zc.height = 80;
  zcx.imageSmoothingEnabled = false;
  zcx.mozImageSmoothingEnabled = false;
  zcx.webkitImageSmoothingEnabled = false;
  var pixels;
  var colourpicked = false;
  var oldpixelcolour;
  var pixelbuffer = [];
  var c64cols = {
    transparent: [0, 0, 0, 0],
    black:      [0, 0, 0, 255],
    white:      [255, 255, 255, 255],
    red:        [104, 55, 43, 255],
    cyan:       [112, 164, 178, 255],
    purple:     [111, 61, 134, 255],
    green:      [77, 141, 67, 255],
    blue:       [53, 40, 121, 255],
    yellow:     [184, 199, 111, 255],
    orange:     [111, 79, 37, 255],
    brown:      [67, 57, 0, 255],
    lightred:   [154, 103, 89, 255],
    darkgrey:   [68, 68, 68, 255],
    grey:       [108, 108, 108, 255],
    lightgreen: [154, 210, 132, 255],
    lightblue:  [108, 94, 181, 255],
    lightgrey:  [149, 149, 149, 255]
  };

  function getC64colour(e) {
    var t = e.target;
    if (t.tagName === 'LI') {
      if (oldpixelcolour) {
        replacecolour(
          ctx.getImageData(0,0,c.width,c.height),
          [
            oldpixelcolour.r,
            oldpixelcolour.g,
            oldpixelcolour.b,
            oldpixelcolour.a
          ],
          c64cols[t.className.replace(/ row| used/g,'')]
        );
      }
    }
    colourpicked = false;
    e.preventDefault();
  }

  function replacecolour(moo, oldcolour, newcolour) {
    var all = pixelbuffer.length;
    for(var j = 0; j < all; j++) {
      var i = pixelbuffer[j];
        pixels.data[i] = newcolour[0];
        pixels.data[i+1] = newcolour[1];
        pixels.data[i+2] = newcolour[2];
        pixels.data[i+3] = newcolour[3];
    }
    ctx.putImageData(pixels, 0, 0);
    tosavestring();
  }

  function tosavestring(){
    save.href = c.toDataURL('image/png'); 
  }

  function showzoom(ev) {
    var x = ev.layerX;
    var y = ev.layerY;
    var sx = (x-5) < 0 ? 0 : x-5;
    var sy = (y-5) < 0 ? 0 : y-5;
    zcx.fillStyle = '#000';
    zcx.fillRect(0,0,80,80);
    zcx.drawImage(c,sx,sy,10,10,0,0,80,80);
    zcx.strokeStyle = 'black';
    zcx.lineWidth = 1;
    zcx.lineCap = 'square';
    zcx.strokeRect(30,40,20,10);
  }

  function readcolour(ev) {
    var x = ev.layerX;
    var y = ev.layerY;
    swab.style.background = 'rgba('+
      pixelcolour(x, y).r + ',' +
      pixelcolour(x, y).g + ',' +
      pixelcolour(x, y).b + ',' +
      pixelcolour(x, y).a + ')';
    if (ev.type === 'click') {
      oldpixelcolour = pixelcolour(x,y);
      getpixelsofcolour(pixelcolour(x,y));
    }
  }

  function getpixelsofcolour(col) {
    pixelbuffer = [];
    var pixels = ctx.getImageData(0, 0, c.width, c.height);
    var all = pixels.data.length;
    for(var i = 0; i < all; i+=4) {
      if (pixels.data[i] === col.r &&
          pixels.data[i+1] === col.g &&
          pixels.data[i+2] === col.b &&
          pixels.data[i+3] === col.a) {
        pixelbuffer.push(i);
      }
    }
  }

  function pixelcolour(x, y) {
    var pixeldata = ctx.getImageData(x,y,1,1);
    return {
        r: pixeldata.data[0],
        g: pixeldata.data[1],
        b: pixeldata.data[2],
        a: pixeldata.data[3]
    };
  }

  function getClipboardImage(pasteEvent, callback){
    if(pasteEvent.clipboardData == false){
          if(typeof(callback) == "function"){
              callback(undefined);
          }
      };
      var items = pasteEvent.clipboardData.items;
      if (items) {
          if(typeof(callback) == "function"){
              callback(undefined);
          }
      };
      for (var i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") == -1) continue;
          var blob = items[i].getAsFile();
          if(typeof(callback) == "function"){
              callback(blob);
          }
      }
  }

  window.addEventListener('paste', function(e){
    getClipboardImage(e, function(imageBlob){
          if(imageBlob){
              var img = new Image();
              img.onload = function(){
                imagetocanvas(this, img.naturalWidth, img.naturalHeight, name);
              };
              var URLObj = window.URL || window.webkitURL;
              img.src = URLObj.createObjectURL(imageBlob);
          }
      });
  }, false);

  function getfile(e) {
    i = 0;
    var file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
        if(objURL) {
          loadImage(url.createObjectURL(file),file.name);
        } else {
          var reader = new FileReader();
          reader.readAsDataURL( file );
          reader.onload = function ( ev ) {
            loadImage(ev.target.result,file.name);
          };
        }

    e.preventDefault();
  }

  function loadImage(file, name) {
    var img = new Image();
    img.src = file;
    img.onload = function() {
      imagetocanvas(this, img.naturalWidth, img.naturalHeight, name);
    };
  }
  function imagetocanvas(img, w, h, name) {
    c.width = w;
    c.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    pixels = ctx.getImageData(0, 0, c.width, c.height);
    tosavestring();
  }

  c.addEventListener('click', function(ev) {
    readcolour(ev);
    colourpicked = true;
  }, false);

  c.addEventListener('mousemove', function(ev) {
    if (!colourpicked) {
      readcolour(ev);
    }
    showzoom(ev);
  }, false);

  c64palette.addEventListener('click', getC64colour, false);

  container.addEventListener('dragover', function(ev) {
    ev.preventDefault();
  }, false );
  container.addEventListener('drop', getfile, false);
  fileinput.addEventListener('change', getfile, false);

})();