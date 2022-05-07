var cubeRotation = 0;
// Рисует кубик в клеточку
"use strict";

// Исходный код вершинного шейдера
const vsSourceGuro = `# version 300 es

// Координаты вершины. Атрибут, инициализируется через буфер.
in vec3 aVertexPosition;
in vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 uLightPosition;
uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;

out vec3 vLightWeighting;

const float shininess = 16.0;

uniform int typeAttenuation;
uniform int lightingModel;

void main() {
    // установка позиции наблюдателя сцены
    vec4 vertexPositionEye4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vec3 vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;
    float dist = 0.0;
    // получаем вектор направления света
    vec3 lightDirection;
    lightDirection = uLightPosition - vertexPositionEye3;
    dist = length(lightDirection);
    if(typeAttenuation == 1) dist = dist * dist;

    lightDirection = normalize(lightDirection);

    // получаем нормаль
    vec3 normal = normalize(uNMatrix * aVertexNormal);
    
    switch(lightingModel) {
        case 0:
            // получаем скалярное произведение векторов нормали и направления света
            float lambertTerm = max(dot(normal, lightDirection), 0.0);
        
            // отраженный свет равен диффузному отражению света
            vLightWeighting = (uDiffuseLightColor * lambertTerm) / dist;
            break;
        case 1:
            // получаем скалярное произведение векторов нормали и направления света
            float diffuseLightDot = max(dot(normal, lightDirection), 0.0);
                                                
            // получаем вектор отраженного луча и нормализуем его
            vec3 reflectionVector = normalize(reflect(-lightDirection, normal));
            
            // установка вектора камеры
            vec3 viewVectorEye = -normalize(vertexPositionEye3);
            
            float specularLightDot = max(dot(reflectionVector, viewVectorEye), 0.0);
            
            float specularLightParam = pow(specularLightDot, shininess);
        
            // отраженный свет равен сумме фонового, диффузного и зеркального отражений света
            vLightWeighting = uAmbientLightColor + (uDiffuseLightColor * diffuseLightDot +
                            uSpecularLightColor * specularLightParam) / dist;
            break;
        case 2:
            // получаем скалярное произведение векторов нормали и направления света
            diffuseLightDot = max(dot(normal, lightDirection), 0.0);
                                                
            
            // установка вектора камеры
            viewVectorEye = -normalize(vertexPositionEye3);
            vec3 h = (lightDirection + viewVectorEye) / 2.0;
            specularLightDot = max(dot(h, normal), 0.0);
            
            specularLightParam = pow(specularLightDot, shininess);
        
            // отраженный свет равен сумме фонового, диффузного и зеркального отражений света
            vLightWeighting = uAmbientLightColor + (uDiffuseLightColor * diffuseLightDot +
                            uSpecularLightColor * specularLightParam) / dist;
            break;
        case 3:
            
            break;
        
    }
    // Finally transform the geometry
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}
`;

// Исходный код фрагментного шейдера
const fsSourceGuro = `# version 300 es
// WebGl требует явно установить точность флоатов, так что ставим 32 бита
precision mediump float;

in vec3 vLightWeighting;

// Цвет, который будем отрисовывать
out lowp vec4 color; 

uniform vec4 aVertexColor;

void main() {
    // Тут происходит магия, чтобы кубик выглядел красиво
      color = vec4(vLightWeighting * aVertexColor.rgb, aVertexColor.a);
}
`;

// Исходный код вершинного шейдера
const vsSourcePhong = `# version 300 es

// Координаты вершины. Атрибут, инициализируется через буфер.
in vec3 aVertexPosition;
in vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 uLightPosition;

uniform int typeAttenuation;

out vec3 vLightWeighting;

out vec3 lightDirection;
out vec3 normal;
out vec3 viewVectorEye;
out float dist;


void main() {
    // установка позиции наблюдателя сцены
    vec4 vertexPositionEye4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vec3 vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;
    lightDirection = (uLightPosition - vertexPositionEye3);
   
    // получаем вектор направления света
    switch(typeAttenuation) {
        case 0:
            dist = length(lightDirection);
            break;
        case 1: 
            dist = length(lightDirection) * length(lightDirection);
            break;
    }

    // получаем нормаль
    normal = normalize(uNMatrix * aVertexNormal);

    viewVectorEye = -vertexPositionEye3;

    // Finally transform the geometry
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}
`;

// Исходный код фрагментного шейдера
const fsSourcePhong = `# version 300 es
// WebGl требует явно установить точность флоатов, так что ставим 32 бита
precision mediump float;

in vec3 lightDirection;

in vec3 normal;
in vec3 viewVectorEye;
in float dist;

uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;
uniform int lightingModel;

vec3 vLightWeighting;

uniform vec4 aVertexColor;
const float shininess = 16.0;

// Цвет, который будем отрисовывать
out lowp vec4 color; 
void main() {

    vec3 vLightDirection = normalize(lightDirection);
    vec3 vNormal = normalize(normal);

    switch(lightingModel) {
        case 0:
            // Ламберт 
            // получаем скалярное произведение векторов нормали и направления света
            float diffuseLightDot = max(dot(vNormal, vLightDirection), 0.0);
        
            // отраженный свет равен диффузному отражению света
            vLightWeighting = (uDiffuseLightColor * diffuseLightDot)/dist;

            color = vec4(vLightWeighting * aVertexColor.rgb, aVertexColor.a);
            break;
        case 1:
            // Фонг
            // получаем скалярное произведение векторов нормали и направления света
            diffuseLightDot = max(dot(vNormal, vLightDirection), 0.0);
                                                
            // получаем вектор отраженного луча и нормализуем его
            vec3 reflectionVector = normalize(reflect(-vLightDirection, vNormal));
            
            // установка вектора камеры
            vec3 vViewVectorEye = normalize(viewVectorEye);
            
            // зеркальное это максимум из вектора отраженного 
            float specularLightDot = max(dot(reflectionVector, vViewVectorEye), 0.0);
            
            float specularLightParam = pow(specularLightDot, shininess);
        
            // отраженный свет равен сумме фонового, диффузного и зеркального отражений света
            vLightWeighting = uAmbientLightColor + (uDiffuseLightColor * diffuseLightDot  +
                            uSpecularLightColor * specularLightParam) / dist;

            color = vec4(vLightWeighting * aVertexColor.rgb, aVertexColor.a);
            break;
        case 2:
            // Блинн-Фонг
            // получаем скалярное произведение векторов нормали и направления света
            diffuseLightDot = max(dot(vNormal, vLightDirection), 0.0);
                                                
            
            // установка вектора камеры
            vViewVectorEye = normalize(viewVectorEye);
            vec3 h = (vLightDirection + vViewVectorEye) / 2.0;
            specularLightDot = max(dot(h, vNormal), 0.0);
            
            specularLightParam = pow(specularLightDot, shininess);
        
            // отраженный свет равен сумме фонового, диффузного и зеркального отражений света
            vLightWeighting = uAmbientLightColor + (uDiffuseLightColor * diffuseLightDot +
                            uSpecularLightColor * specularLightParam)/dist;

            color = vec4(vLightWeighting * aVertexColor.rgb, aVertexColor.a);
            break;
        case 3:
            // Тун-Шейдинг
            diffuseLightDot = max(dot(vNormal, vLightDirection), 0.0);
            if (diffuseLightDot > 0.95) {
                vLightWeighting = aVertexColor.rgb;
            } else if (diffuseLightDot > 0.75) {
                vLightWeighting = aVertexColor.rgb * 0.7;
            } else if (diffuseLightDot > 0.55) {
                vLightWeighting = aVertexColor.rgb * 0.3;
            } else {
                vLightWeighting = aVertexColor.rgb * 0.1;
            }
            
            color = vec4(vLightWeighting/dist, aVertexColor.a);
            break;
    }
}
`;
var mult = 0; //Мой код
var mode = 1

var ambientLight = 0.1
var typeAttenuation = 0
var lightingModel = 0;
var shading = document.querySelector("#shading1").checked;

let shaderProgram;

function updatePosition(index) {
    return function(event, ui) {
        if (index == 0)
        ambientLight = ui.value / 10;
    };
  }

  function updateAtten(){
    const a = document.querySelector("#li1")
    if(a.checked)
        typeAttenuation = 0
        else typeAttenuation = 1
}

function lightMod(){
    const a = document.querySelector("#light1")
    const b = document.querySelector("#light2")
    const c = document.querySelector("#light3")

    if(a.checked)
    lightingModel = 0
    else if(b.checked)
    lightingModel = 1
    else if(c.checked)
    lightingModel = 2
    else
    lightingModel = 3
}

function updateShading() {
    const shading = document.querySelector("#shading1").checked;
    const canvas = document.querySelector("#gl_canvas");
    // Получаем контекст webgl2
    const gl = canvas.getContext("webgl2");
    if (shading) // гуро
    {
        shaderProgram = initShaderProgram(gl, vsSourceGuro, fsSourceGuro);
    }
    else // фонг
    {
        shaderProgram = initShaderProgram(gl, vsSourcePhong, fsSourcePhong);
    }
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

    webglLessonsUI.setupSlider("#x", {value: ambientLight * 10, slide: updatePosition(0), min: 0, max: 10, name: "Мощность фонового источника" });

    //Мой код
    document.addEventListener('keydown', handleKeyDown, true);

    // Устанавливаем размер вьюпорта  
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Включаем z-buffer
    gl.enable(gl.DEPTH_TEST);

    // let shaderProgram;

    // Создаём шейдерную программу
    if (shading)
        shaderProgram = initShaderProgram(gl, vsSourceGuro, fsSourceGuro);
    else
        shaderProgram = initShaderProgram(gl, vsSourcePhong, fsSourcePhong);  
     
    // Инициализируем буфер
    const buffers = initBuffers(gl)
    // Устанавливаем используемую программу
    
    var then = 0;

    function render(now) {
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;


        drawScene(gl, programInfo, buffers, deltaTime);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}



function setupLights(gl, programInfo) {
    //позиция источника света
    gl.uniform3fv(programInfo.uniformLocations.lightPosition, [lightPosition.x, 0.0, lightPosition.z]);
    gl.uniform3fv(programInfo.uniformLocations.ambientLightColor, [ambientLight, ambientLight, ambientLight]);
    gl.uniform3fv(programInfo.uniformLocations.diffuseLightColor, [0.7, 0.7, 0.7]);
    gl.uniform3fv(programInfo.uniformLocations.specularLightColor, [1.0, 1.0, 1.0]);
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
let programInfo;
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

    // Для удобства создадим объект с информацией о программе
    programInfo = {
        // Сама программа
        program: shaderProgram,
        // Расположение параметров-аттрибутов в шейдере
        
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
        },
		uniformLocations: {
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uMVMatrix'),
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uPMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNMatrix'),

            lightPosition: gl.getUniformLocation(shaderProgram, 'uLightPosition'),
            ambientLightColor: gl.getUniformLocation(shaderProgram, 'uAmbientLightColor'),
            diffuseLightColor: gl.getUniformLocation(shaderProgram, 'uDiffuseLightColor'),
            specularLightColor: gl.getUniformLocation(shaderProgram, 'uSpecularLightColor'),

            vertexColor: gl.getUniformLocation(shaderProgram, 'aVertexColor'),

            typeAttenuation: gl.getUniformLocation(shaderProgram, 'typeAttenuation'),
            lightingModel: gl.getUniformLocation(shaderProgram, 'lightingModel'),
            
        }
    };
    return shaderProgram;
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
      -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
       1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,
  
      // Back face
      -1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0, -1.0, -1.0,
  
      // Top face
      -1.0,  1.0, -1.0,
      -1.0,  1.0,  1.0,
       1.0,  1.0,  1.0,
       1.0,  1.0, -1.0,
  
      // Bottom face
      -1.0, -1.0, -1.0,
       1.0, -1.0, -1.0,
       1.0, -1.0,  1.0,
      -1.0, -1.0,  1.0,
  
      // Right face
       1.0, -1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0,  1.0,  1.0,
       1.0, -1.0,  1.0,
  
      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0,  1.0, -1.0,
    ];
  
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
    // Set up the normals for the vertices, so that we can compute lighting.
  
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  
    const vertexNormals = [
      // Front
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
  
      // Back
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
  
      // Top
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
  
      // Bottom
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
  
      // Right
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
  
      // Left
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0
    ];
  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
                  gl.STATIC_DRAW);
  
  
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
      20, 21, 22,     20, 22, 23,   // left
    ];
  
    // Now send the element array to GL
  
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);
  
    return {
      position: positionBuffer,
      normal: normalBuffer,
    //   color: colorBuffer,
      indices: indexBuffer,
    };
  }

function makeF32ArrayBuffer(gl, array) {
    // Создаём буфер
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Заполняем буффер массивом флоатов
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(array),
        gl.STATIC_DRAW
    );

    return buffer
}

var cube = {
    cubes: [
        {x:0, y:0, z:-2},    // по середине
        {x:0, y:0.4, z:-2},    // сверху
        {x:-0.4, y:0, z:0},    // леввый
        {x:0.4, y:0, z:0},    // правый

    ],

    translation: function(x, y, z) {
      return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1,
      ];
    },

    rotation: function(angle) {
        return [
            //Math.cos(angle * mult), 0, Math.sin(angle * mult), 0,
            //0, 1, 0, 0,
            //-Math.sin(angle * mult), 0, Math.cos(angle * mult), 0,
            //0, 0, 0, 1
			Math.cos(angle), 0, Math.sin(angle), 0,
            0, 1, 0, 0,
            -Math.sin(angle), 0, Math.cos(angle), 0,
            0, 0, 0, 1
        ]
    },
}

var mvMatrix = mat4.create(); // матрица вида модели
var pMatrix = mat4.create(); // матрица проекции
var nMatrix = mat3.create(); // матрица нормалей

function setupWebGL(gl) {
    gl.clearColor(0.0, 0.0, 0.1, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(pMatrix, 45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 100.0);
    
    // mat4.translate(mvMatrix, mvMatrix, [2.0, 0.0, 0.0]);
    // mat4.rotate(mvMatrix, mvMatrix, cubeRotation, [0, 1, 0]); 
    
}

// var pMatrix, mvMatrix;
function drawScene(gl, programInfo, buffers, time) {
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


    // Tell WebGL how to pull out the normals from
  // the normal buffer into the vertexNormal attribute.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexNormal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    gl.useProgram(programInfo.program);

    setupLights(gl, programInfo)

    gl.uniform1i (programInfo.uniformLocations.typeAttenuation, typeAttenuation)
    gl.uniform1i (programInfo.uniformLocations.lightingModel, lightingModel)

    const xShift = 2.0;
    // Левый
    createCub(gl, programInfo, [-xShift, 0, 0], [1, 1, 0, 1])
    // Правый
    createCub(gl, programInfo, [xShift, 0, 0], [0, 1, 1, 1])
    // Нижний
    createCub(gl, programInfo, [0, 0, 0], [0, 1, 0, 1])
    // Верхний 
    createCub(gl, programInfo, [0, xShift, 0], [1, 0, 1, 1])
    

}

function createCub(gl, programInfo, translation, color){

    const xShift = 0.0

    mat4.identity(mvMatrix);
    mat4.lookAt(mvMatrix, [0, 10, 19], [0,0,0], [0,1,0]);
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
    mat3.normalFromMat4(nMatrix, mvMatrix);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        pMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        mvMatrix);
    gl.uniformMatrix3fv(
        programInfo.uniformLocations.normalMatrix,
        false,
        nMatrix);

        gl.uniform4fv(programInfo.uniformLocations.vertexColor, color);

		
    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}
var lightPosition = {
    x: 0,
    y: 0,
    z: -18
}
/* Мой код */
function handleKeyDown(e){
    switch(e.keyCode)
    {
        // движение источника света 
        case 87: // s
            lightPosition.z += -1
            break
        case 83: // w
            lightPosition.z += 1
            break 
        case 65: // a
            lightPosition.x += -1
            break 
        case 68: // d
            lightPosition.x += 1
            break 
        case 69: // e 
            lightPosition.y += 100
            console.log(lightPosition)
        break

        case 81: // q
            lightPosition.y -= 100
            console.log(lightPosition)
        break



         // движение платформы   
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
        case 49:
        case 97:
            cubeRotation = 0
            mode = 1
            break;
        case 50:
        case 98:
            cubeRotation = 0
            mode = 2
            break;
        case 51:
        case 99:
            cubeRotation = 0
            mode = 3
            break;
    }
}