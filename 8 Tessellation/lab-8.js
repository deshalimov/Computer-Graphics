"use strict";

const vertexShader = `#version 300 es
	in vec4 _pos;
	in vec3 _nor;
	in vec2 _txy;

	uniform mat4 m4pt;
	uniform mat3 m3nt;
	uniform mat4 proj;

	out vec2 currentCoordinate;

	void main() {
		vec4 p = proj * (m4pt * _pos);
		gl_Position = p;

		currentCoordinate = _txy;
	}
`;

const fragmentShader = `#version 300 es
	precision mediump float;

	uniform sampler2D textureImage;

	uniform vec2 centerCoordinate;
	uniform float angularAcceleration;

	in vec2 currentCoordinate;
	out vec4 color;

	void main() {
		vec2 distanceVector2 = currentCoordinate-centerCoordinate;
		float phase = length(distanceVector2) * angularAcceleration;
		float c = cos(phase);
		float s = sin(phase);		
		vec2 newCoordinate;
		newCoordinate.x = distanceVector2.x*c - distanceVector2.y*s;
		newCoordinate.y = distanceVector2.x*s + distanceVector2.y*c;
		color = texture(textureImage, newCoordinate + centerCoordinate);
	}
`;

var image;
const _tx = new Uint8Array([0, 0, 255, 255]);

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  const image = new Image();
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn of mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}
function textureInit() {
  image = loadTexture(gl, "pictures/image.png");
}

function initProgram(vssrc, fssrc, name) {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vssrc);
  gl.compileShader(vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fssrc);
  gl.compileShader(fs);

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);

  return {
    name: name,
    prog: prog,
    vposloc: gl.getAttribLocation(prog, "_pos"),
    vnorloc: gl.getAttribLocation(prog, "_nor"),
    vtxyloc: gl.getAttribLocation(prog, "_txy"),

    m4ptloc: gl.getUniformLocation(prog, "m4pt"),
    m3ntloc: gl.getUniformLocation(prog, "m3nt"),
    projloc: gl.getUniformLocation(prog, "proj"),

    tx00loc: gl.getUniformLocation(prog, "centerCoordinate"),
    yrotloc: gl.getUniformLocation(prog, "angularAcceleration"),

    _tx1loc: gl.getUniformLocation(prog, "textureImage"),
  };
}

var info_1p;

var gl;
var h1;
var canv;
var curinfo;
window.onload = function main() {
  canv = document.querySelector("#canvas1");
  gl = canv.getContext("webgl2");

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.enable(gl.DEPTH_TEST);

  info_1p = initProgram(vertexShader, fragmentShader, "");
  curinfo = info_1p;

  textureInit();
  spaceinit();

  update();
};

window.onkeydown = (e) => {
  if (e.code == "KeyQ") yrot += 0.05;
  if (e.code == "KeyE") yrot -= 0.05;
};

var yrot = 0.0;
var tx00 = [0.5, 0.5];

class figure {
  constructor(size, posbuf, txybuf, norbuf, tx) {
    this.size = size;
    this.posbuf = posbuf;
    this.txybuf = txybuf;
    this.norbuf = norbuf;
    this.tx = tx;

    this.m4pt = mat4.create();
    this.m3nt = mat3.create();
    this.m4tm = mat4.create();
  }

  render() {
    const info = curinfo;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posbuf);
    gl.vertexAttribPointer(info.vposloc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(info.vposloc);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.norbuf);
    gl.vertexAttribPointer(info.vnorloc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(info.vnorloc);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.txybuf);
    gl.vertexAttribPointer(info.vtxyloc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(info.vtxyloc);

    gl.useProgram(info.prog);
    gl.uniformMatrix4fv(info.m4ptloc, false, this.m4pt);
    gl.uniformMatrix3fv(info.m3ntloc, false, this.m3nt);
    gl.uniformMatrix4fv(info.projloc, false, proj);

    gl.uniform2fv(info.tx00loc, tx00);
    gl.uniform1f(info.yrotloc, yrot);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tx);
    gl.uniform1i(info._tx1loc, 0);

    gl.drawArrays(gl.TRIANGLES, 0, this.size);
  }
  update() {}


  back() {
    mat4.copy(this.m4pt, this.m4tm);
  }

  apply(mat) {
    mat4.copy(this.m4tm, this.m4pt);
    mat4.multiply(this.m4pt, this.m4pt, mat);
    mat3.normalFromMat4(this.m3nt, this.m4pt);
  }
  selfapply(mat) {
    mat4.copy(this.m4tm, this.m4pt);
    const m = this.m4pt;
    const x = m[12],
      y = m[13],
      z = m[14];
    m[12] -= x;
    m[13] -= y;
    m[14] -= z;
    mat4.multiply(this.m4pt, this.m4pt, mat);
    mat3.normalFromMat4(this.m3nt, this.m4pt);
    m[12] += x;
    m[13] += y;
    m[14] += z;
  }

  scale(val) {
    mat4.copy(this.m4tm, this.m4pt);
    this.m4pt[15] *= val;
  }
  move(dx, dy, dz) {
    mat4.copy(this.m4tm, this.m4pt);
    this.m4pt[12] += dx;
    this.m4pt[13] += dy;
    this.m4pt[14] += dz;
  }
  moveto(x, y, z) {
    mat4.copy(this.m4tm, this.m4pt);
    this.m4pt[12] = x;
    this.m4pt[13] = y;
    this.m4pt[14] = z;
  }
}

class terrain extends figure {
  constructor(tx) {
    const p00 = [-1, 0, -1],
      p01 = [-1, 0, 1];
    const p10 = [1, 0, -1],
      p11 = [1, 0, 1];
    const pos = [p00, p01, p10, p01, p10, p11].flat(2);
    const n = [0, 1, 0];
    const nor = [n, n, n, n, n, n].flat(2);
    const t00 = [0, 0],
      t01 = [0, 1];
    const t10 = [1, 0],
      t11 = [1, 1];
    const txy = [t00, t01, t10, t01, t10, t11].flat(2);

    const posbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
    const txybuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, txybuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(txy), gl.STATIC_DRAW);
    const norbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, norbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nor), gl.STATIC_DRAW);

    super(pos.length, posbuf, txybuf, norbuf, tx);
  }
}
class banner extends figure {
  constructor(tx) {
    const p00 = [-1, -1, 0],
      p01 = [-1, 1, 0];
    const p10 = [1, -1, 0],
      p11 = [1, 1, 0];
    const pos = [p00, p01, p10, p01, p10, p11].flat(2);
    const n = [0, 0, 1];
    const nor = [n, n, n, n, n, n].flat(2);
    const t00 = [0, 0],
      t01 = [0, 1];
    const t10 = [1, 0],
      t11 = [1, 1];
    const txy = [t00, t01, t10, t01, t10, t11].flat(2);

    const posbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
    const txybuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, txybuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(txy), gl.STATIC_DRAW);
    const norbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, norbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nor), gl.STATIC_DRAW);

    super(pos.length, posbuf, txybuf, norbuf, tx);
  }
}

const figures = [];
function update() {
  figures.forEach((f) => {
    f.update();
  });
  drawScene();
  requestAnimationFrame(update);
}

const proj = mat4.create(),
  cam = mat4.create();
function basisinit() {}

async function spaceinit() {
  basisinit();

  const f3 = new banner(image);
  figures.push(f3);
  f3.move(0, 0, 0);
}

function drawScene() {
  gl.clearColor(0.5, 0.5, 0.5, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  figures.forEach((f) => {
    f.render();
  });
}
