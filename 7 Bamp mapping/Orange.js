function initProgramOrange(gl) {
  return webglUtils.createProgramInfo(gl, ["vertex-shader-orange", "fragment-shader-orange"]);
}

async function initBuffersOrange(gl) {
const response = await fetch('./model/sphere2.obj');  
const text = await response.text();
const obj =  parseOBJ(text);

const extents = getGeometriesExtents(obj.geometries);
orange.yPos = -extents.min[1]

return obj.geometries.map(({data}) => {

    if (data.color) {
      if (data.position.length === data.color.length) {
        // it's 3. The our helper library assumes 4 so we need
        // to tell it there are only 3.
        data.color = { numComponents: 1, data: data.color };
      }
    } else {
      // there are no vertex colors so just use constant white
      data.color = { value: [0, 0.51, 0., 1] };
    }
    // create a buffer for each array by calling
    // gl.createBuffer, gl.bindBuffer, gl.bufferData
    const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
    return {
      bufferInfo,
    };
  });
}


function drawOrange(gl, programInfo, buffers) {
  mat4.identity(mvMatrix);
  mat4.lookAt(mvMatrix, [0, 1, 3], [0, 0, -50], [0,1,0]);
  mat4.translate(mvMatrix, mvMatrix, [orange.xPos, orange.yPos, orange.zPos]);
  mat4.rotate(mvMatrix, mvMatrix, degToRad(orange.yaw), [1, 0, 0]);
  mat3.normalFromMat4(nMatrix, mvMatrix);

  gl.useProgram(programInfo.programOrange.program);
  webglUtils.setUniforms(programInfo.programOrange, {
      u_pMatrix: pMatrix, 
      u_mvMatrix: mvMatrix,
      u_nMatrix:nMatrix,
      u_res:[w, h]
  });

  webglUtils.setUniforms(programInfo.programOrange, identicalUniform);

  for (const {bufferInfo} of buffers.buffersOrange) {
    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    webglUtils.setBuffersAndAttributes(gl, programInfo.programOrange, bufferInfo);
    // calls gl.drawArrays or gl.drawElements
    webglUtils.drawBufferInfo(gl, bufferInfo);
  }
  animate()
}

class Orange {
  constructor(){
    /* Общий угол поворота */
    this.yaw = 3;

    /* на сколько меняем угол при нажатии */
    this.yawRate = 0;

    this.xPos = 0;
    this.yPos = 0;
    this.zPos = 0;
  }
}


var currentlyPressedKeys = {};

function handleKeyDown(event) {
  currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
  currentlyPressedKeys[event.keyCode] = false;
}

function handleKeys() {
  if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
      // Left cursor key or A
      orange.yawRate = 0.1;
  } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
      // Right cursor key or D
      orange.yawRate = -0.1;
  } else {
    orange.yawRate = 0;
  }
}
var lastTime = 0;
var orange = new Orange();

function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;
    orange.yaw += orange.yawRate * elapsed;

  }
  lastTime = timeNow;
}