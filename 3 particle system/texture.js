var cubeRotation = 0;
"use strict";

// Исходный код вершинного шейдера
const vsSource = `# version 300 es

// Координаты вершины. Атрибут, инициализируется через буфер.
in vec3 aVertexPosition;
in vec3 aVertexNormal;

in vec2 aVertexTextureCoords;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

out vec2 vTextureCoords;

void main() {
    // установка позиции наблюдателя сцены

    // Finally transform the geometry
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoords = aVertexTextureCoords;
}
`;

// Исходный код фрагментного шейдера
const fsSource = `# version 300 es
// WebGl требует явно установить точность флоатов, так что ставим 32 бита
precision mediump float;

uniform sampler2D uSampler;
uniform sampler2D uSamplerMaterial;
in vec2 vTextureCoords;

// Цвет, который будем отрисовывать
out lowp vec4 color; 

uniform vec4 aVertexColor;
uniform int uModeTexture;
uniform float uAlpha;

void main() {
    vec4 texelColor = texture(uSampler, vTextureCoords);
    vec4 texelMaterialColor = texture(uSamplerMaterial, vTextureCoords);

    switch (uModeTexture) {
        case 1:
            color = vec4(texelColor.rgb, 1.0);
        break;
        case 2:
            color = vec4(texelColor.rgb*aVertexColor.rgb, texelColor.a);
        break;
        case 3:
            color = (1.0 - uAlpha) * texelMaterialColor + uAlpha *texelColor;
        break;
        case 4:
            color = ((1.0 - uAlpha) * texelMaterialColor + uAlpha *texelColor) * aVertexColor;
            // color = vec4(texelColor.rgb*aVertexColor.rgb*texelMaterialColor.rgb, texelColor.a);
        break;
        case 5: color = vec4(aVertexColor.rgb, 1.0);
        default:
            break;
    }
    // color = vec4(texelColor.rgb*aVertexColor.rgb, texelColor.a);
    // color = texelColor;

    // Тут происходит магия, чтобы кубик выглядел красиво
    //  color = vec4(vLightWeighting * aVertexColor.rgb, aVertexColor.a);
}
`;

var mult = 0;
var mode = 1
let modeTexture = 3

var alpha = 0.5

function updatePosition(index) {
    return function(event, ui) {
        if (index == 0)
        alpha = ui.value / 10;
    };
  }

  function typeOfRotation(){
    const a = document.querySelector("#typeOfRotation1")
    const b = document.querySelector("#typeOfRotation2")
    if(a.checked)
      mode = 1
    else if(b.checked)
      mode = 2
    else 
      mode = 3
}

function typeOfTexture(){
    const a = document.querySelector("#typeOfTexture1")
    const b = document.querySelector("#typeOfTexture2")
    const c = document.querySelector("#typeOfTexture3")
    const d = document.querySelector("#typeOfTexture4")
    if(a.checked)
    modeTexture = 1
    else if(b.checked)
    modeTexture = 2
    else if(c.checked)
    modeTexture = 3
    else if(d.checked) 
      modeTexture = 4
      else
      modeTexture = 5
}

window.onload = function main() {
    // Получаем канвас из html
    const canvas = document.querySelector("#gl_canvas");
    // Получаем контекст webgl2
    const gl = canvas.getContext("webgl2");

    // Обработка ошибок
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    // texture = gl.createTexture();

    webglLessonsUI.setupSlider("#x", {value: alpha * 10, slide: updatePosition(0), min: 0, max: 10, name: "Мощность фонового источника" });

    document.addEventListener('keydown', handleKeyDown, true);

    // Устанавливаем размер вьюпорта  
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Включаем z-buffer
    gl.enable(gl.DEPTH_TEST);

    // let shaderProgram;

    // Создаём шейдерную программу
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
	
    
    // Для удобства создадим объект с информацией о программе
    const programInfo = {
        // Сама программа
        program: shaderProgram,
        // Расположение параметров-аттрибутов в шейдере
        
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aVertexTextureCoords'),
        },
		uniformLocations: {
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uMVMatrix'),
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uPMatrix'),

            vertexColor: gl.getUniformLocation(shaderProgram, 'aVertexColor'),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
            modeTexture: gl.getUniformLocation(shaderProgram, 'uModeTexture'),
            samplerMaterial: gl.getUniformLocation(shaderProgram, 'uSamplerMaterial'),
            alpha: gl.getUniformLocation(shaderProgram, 'uAlpha')

        }
    };
 
    // Инициализируем буфер
    const buffers = initBuffers(gl)
    // gl.enable(gl.BLEND);
    // gl.disable(gl.DEPTH_TEST);
    const collectionTextures = [
        
        loadTexture(gl, '1.png'),
        loadTexture(gl, '2.png'),
        loadTexture(gl, '3.png'),
        loadTexture(gl, 'wood.jpg')
    ]

    gl.useProgram(shaderProgram);
    
      // Tell WebGL we want to affect texture unit 0
      gl.activeTexture(gl.TEXTURE0);

      // Bind the texture to texture unit 0
      gl.bindTexture(gl.TEXTURE_2D, collectionTextures[0]);
      gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, collectionTextures[1]);
      gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, collectionTextures[2]);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, collectionTextures[3]);


    var then = 0;

    function render(now) {
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;

        drawScene(gl, programInfo, buffers, collectionTextures, deltaTime);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

// Функция загрузки шейдера
function loadShader(gl, type, source) {
    // Создаём шейдер
    const shader = gl.createShader(type);

    // Компилируем шейдер
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Обрабатываем ошибки
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}
// Функция инициализации шейдерной программы
function initShaderProgram(gl, vsSource, fsSource) {
    // Загружаем вершинный шейдер
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    // Загружаем фрагментный шейдер
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    //Создаём программу и прикрепляем шейдеры к ней
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Обрабатываем ошибки
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    
    return shaderProgram;
}

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
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

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

function initBuffers(gl) {

    // Create a buffer for the cube's vertex positions.
  
    const positionBuffer = gl.createBuffer();
  
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
  
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
    // Now create an array of positions for the cube.
  
    const positions = [
      // Front face
      -2.0, -2.0,  2.0,
       2.0, -2.0,  2.0,
       2.0,  2.0,  2.0,
      -2.0,  2.0,  2.0,
  
      // Back face
      -2.0, -2.0, -2.0,
      -2.0,  2.0, -2.0,
       2.0,  2.0, -2.0,
       2.0, -2.0, -2.0,
  
      // Top face
      -2.0,  2.0, -2.0,
      -2.0,  2.0,  2.0,
       2.0,  2.0,  2.0,
       2.0,  2.0, -2.0,
  
      // Bottom face
      -2.0, -2.0, -2.0,
       2.0, -2.0, -2.0,
       2.0, -2.0,  2.0,
      -2.0, -2.0,  2.0,
  
      // Right face
       2.0, -2.0, -2.0,
       2.0,  2.0, -2.0,
       2.0,  2.0,  2.0,
       2.0, -2.0,  2.0,
  
      // Left face
      -2.0, -2.0, -2.0,
      -2.0, -2.0,  2.0,
      -2.0,  2.0,  2.0,
      -2.0,  2.0, -2.0,
    ];
  
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
    // Build the element array buffer; this specifies the indices
    // into the vertex arrays for each face's vertices.
  
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  
    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.
  
    const indices = [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      // 18, 19, 16,     18, 16, 17,   // right
      20, 21, 22,     20, 22, 23,   // left
    ];
  
    // Now send the element array to GL
  
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);
  
    // Координаты текстуры
    const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Back
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    0.0,  0.0,
    // Top
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    0.0,  0.0,
    // Left
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

    return {
      position: positionBuffer,
      textureCoord: textureCoordBuffer,
      indices: indexBuffer,
    };
  }


var mvMatrix = mat4.create(); // матрица вида модели
var pMatrix = mat4.create(); // матрица проекции


function setupWebGL(gl) {
    gl.clearColor(0.0, 0.0, 0.1, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(pMatrix, 45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
}

// var pMatrix, mvMatrix;
function drawScene(gl, programInfo, buffers, collectionTextures, time) {
    cubeRotation += mult * time;

    setupWebGL(gl)

        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
            
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);


     
    // Tell WebGL how to pull out the texture coordinates from
  // the texture coordinate buffer into the textureCoord attribute.
  {
    const numComponents = 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
        programInfo.attribLocations.textureCoord,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.textureCoord);
  }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

// Specify the texture to map onto the faces.



  gl.uniform1i(programInfo.uniformLocations.modeTexture, modeTexture);
  gl.uniform1i(programInfo.uniformLocations.samplerMaterial, 3);
  gl.uniform1f(programInfo.uniformLocations.alpha, alpha);


    const xShift = 4.0;
    /* Левый кубик */
    drawCube(gl, programInfo, [-1.7 - xShift, 0, 0], [1, 0, 0, 1], 1)
    /* Правый кубик */
    drawCube(gl, programInfo, [1.7 + xShift, 0, 0], [0, 1, 0, 1], 2)
    // // /* Нижний кубик */
    drawCube(gl, programInfo, [0, 0, 0], [0, 0, 1, 1], 0)
    // // /* Вверхний кубик */
    drawCube(gl, programInfo, [0, xShift, 0], [1, 1, 0, 1], 0)
    

}

function drawCube(gl, programInfo, translation, color, number){

    const xShift = 4.0

    mat4.identity(mvMatrix);
    mat4.lookAt(mvMatrix, [25, 10, 30], [0,0,0], [0,1,0]);
    // mat3.scale(mvMatrix, mvMatrix, [0.5, 0.5, 0.5])

    if (mode == 1) {
        mat4.translate(mvMatrix, mvMatrix, [xShift, 0.0, 0.0]);
        mat4.translate(mvMatrix, mvMatrix, translation);
        mat4.rotate(mvMatrix, mvMatrix, cubeRotation, [0, 1, 0]); 
    }
    else if (mode == 2) {
        mat4.translate(mvMatrix, mvMatrix, [xShift, 0.0, 0.0]);
        mat4.rotate(mvMatrix, mvMatrix, cubeRotation, [0, 1, 0]); 
        mat4.translate(mvMatrix, mvMatrix, translation);
    }
    else {
        mat4.rotate(mvMatrix, mvMatrix, cubeRotation, [0, 1, 0]); 
        mat4.translate(mvMatrix, mvMatrix, [xShift, 0.0, 0.0]);
        mat4.translate(mvMatrix, mvMatrix, translation);
    }

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        pMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        mvMatrix);
    if (number != null)
        gl.uniform1i(programInfo.uniformLocations.uSampler, number);
    else
        gl.uniform1i(programInfo.uniformLocations.uSampler, mat4.create());


    gl.uniform4fv(programInfo.uniformLocations.vertexColor, color);

    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
      }

}

function handleKeyDown(e){
    switch(e.keyCode)
    {
        case 39:  // стрелка вправо
        {
            if(mult === 1)
                mult = 0
                else
            mult = -1;
        }
            break;
        case 37:  // стрелка влево
            {
            if(mult === -1)
                mult = 0
            else
                mult = 1;
            }
            break;



       

        case 52:
        case 100:
            modeTexture = 1
            break;
        case 53:
        case 101:
            modeTexture = 2
            break;
        case 54:
        case 102:
            modeTexture = 3
            break;
        case 55:
        case 103:
            modeTexture = 4
            break;
    }
}