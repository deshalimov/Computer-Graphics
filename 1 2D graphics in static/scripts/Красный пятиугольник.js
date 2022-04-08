// Рисует зелёный треугольник

"use strict";

// Исходный код вершинного шейдера
const vsSource = `#version 300 es

// Координаты вершины. Атрибут, инициализируется через буфер.
in vec2 vertexPosition;
void main() {
    gl_Position = vec4(vertexPosition, 0.0, 1.0);
}
`;

// Исходный код фрагментного шейдера
const fsSource = `#version 300 es
// WebGl требует явно установить точность флоатов, так что ставим 32 бита
precision mediump float;

out vec4 color;
void main() {
    color = vec4(1, 0, 0, 1); // задаем цвет и прозрачность
}
`;

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
    // Устанавливаем размер вьюпорта  
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Создаём шейдерную программу
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    // Для удобства создадим объект с информацией о программе
    const programInfo = {
        // Сама программа
        program: shaderProgram,
        // Расположение параметров-аттрибутов в шейдере
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'vertexPosition'),
        },
    };

    // Инициализируем буфер
    const buffers = initBuffer(gl)

    drawScene(gl, programInfo, buffers);
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

// Инициализируем и заполняем буфер вершин кубика
function initBuffer(gl) {

    // пятиугольник 
    //let p000 = [0, 0] // центр
    let p001 = [-0.45, 0.55] // лево верх
    let p010 = [0.45, 0.55] // право верх
    let p011 = [-0.7, -0.3] // лево 
    let p100 = [0.7, -0.3] // право
    let p101 = [0, -0.7] // вершина
    

    // пятиугольник
    const positions = [  //m0
    p001, p011, p101, p100, p010,
    
    ].flat(2)

    const positionBuffer = makeF32ArrayBuffer(gl, positions);

    return {
        positionBuffer,
        bufferLength: positions.length,
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

function drawScene(gl, programInfo, buffers) {
    // Чистим экран
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Подключаем VBO
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
    // Указываем формат данных, содержащихся в буфере
    gl.vertexAttribPointer(
        // Позиция параметра в шейдере, которую вы сохранили заранее
        programInfo.attribLocations.vertexPosition,
        // Количество компонент. У нас 2, потому что мы передаём только координаты x, y.
        2,
        // Тип элемента. У нас 32-битный флоат.
        gl.FLOAT,
        // Нормализация нужна только для целочисленных параметров
        false,
        // Расстояние между компонентами нулевое
        0,
        // Сдвиг от начала не нужен
        0
    );
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition
    );

    // Устанавливаем используемую программу
    gl.useProgram(programInfo.program);

    gl.drawArrays(
        // Рисуем по треугольникам
        gl.TRIANGLE_FAN,
        // Сдвиг от начала не нужен 
        0,
        // Количество вершин в буфере
        buffers.bufferLength
    );
}