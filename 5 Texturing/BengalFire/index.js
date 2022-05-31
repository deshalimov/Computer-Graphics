class Spark {
    constructor(){
        // время создания искры
        this.timeFromCreation = performance.now();

        // задаём направление полёта искры в градусах, от 0 до 360
        let angle = Math.random() * 360;
        // радиус - это расстояние, которое пролетит искра
        let radius = Math.random();
        // отмеряем точки на окружности - максимальные координаты искры
        this.xMax = Math.cos(angle) * radius;
        this.yMax = Math.sin(angle) * radius;

        // dx и dy - приращение искры за вызов отрисовки, то есть её скорость,
        // у каждой искры своя скорость. multiplier подобран экспериментально
        let multiplier = 125 + Math.random() * 125;
        this.dx = this.xMax / multiplier;
        this.dy = this.yMax / multiplier;

        // Для того, чтобы не все искры начинали движение из начала координат,
        // делаем каждой искре свой отступ, но не более максимальных значений.
        this.x = (this.dx * 1000) % this.xMax;
        this.y = (this.dy * 1000) % this.yMax;
    }

    move(time) {
        // находим разницу между вызовами отрисовки, чтобы анимация работала
        // одинаково на компьютерах разной мощности
        let timeShift = time - this.timeFromCreation;
        this.timeFromCreation = time;

        // приращение зависит от времени между отрисовками
        let speed = timeShift;
        this.x += this.dx * speed;
        this.y += this.dy * speed;

        // если искра достигла конечной точки, запускаем её заново из начала координат
        return (Math.abs(this.x) > Math.abs(this.xMax) || Math.abs(this.y) > Math.abs(this.yMax));
    }
}

const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl");

if (!gl) {
    throw new Error("No gl");
}

const mvMatrix = mat4.create();
const pMatrix = mat4.create();
let spark1 = new Object();
const sparksCount = 200;
let sparks = [];

function start(){
    // gl.SRC_ALPHA - рисуемая искра умножается на прозрачный канал, чтобы убрать фон
    // изображения. gl.ONE - уже нарисованные искры остаются без изменений
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    initGL();
    initShadersSpark();
    initShadersTrack();

    for (let i = 0; i < sparksCount; i++)
        sparks.push(new Spark());

    initBuffers(spark1);
}

function initGL(){
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
}

function initShadersSpark() {
    let vertex = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex, document.getElementById('vertex_spark').innerHTML);
    gl.compileShader(vertex);
    if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS))
        alert(gl.getShaderInfoLog(vertex));

    let fragment = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragment, document.getElementById('fragment_spark').innerHTML);
    gl.compileShader(fragment);
    if (!gl.getShaderParameter(fragment, gl.COMPILE_STATUS))
        alert(gl.getShaderInfoLog(fragment));

    gl.programSpark = gl.createProgram();
    gl.attachShader(gl.programSpark, vertex);
    gl.attachShader(gl.programSpark, fragment);
    gl.linkProgram(gl.programSpark);
    gl.validateProgram(gl.programSpark);

    if (!gl.getProgramParameter(gl.programSpark, gl.LINK_STATUS))
        alert("Could not initialise shaders");

    gl.useProgram(gl.programSpark);
    gl.programSpark.pMatrixUniform = gl.getUniformLocation(gl.programSpark, "uPMatrix");
    gl.programSpark.mvMatrixUniform = gl.getUniformLocation(gl.programSpark, "uMVMatrix");

    gl.programSpark.uTexture = gl.getUniformLocation(gl.programSpark, "uTexture");
}

function initShadersTrack() {
    let vertex = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex, document.getElementById('vertex_track').innerHTML);
    gl.compileShader(vertex);
    if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS))
        alert(gl.getShaderInfoLog(vertex));

    let fragment = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragment, document.getElementById('fragment_track').innerHTML);
    gl.compileShader(fragment);
    if (!gl.getShaderParameter(fragment, gl.COMPILE_STATUS))
        alert(gl.getShaderInfoLog(fragment));

    gl.programTrack = gl.createProgram();
    gl.attachShader(gl.programTrack, vertex);
    gl.attachShader(gl.programTrack, fragment);
    gl.linkProgram(gl.programTrack);
    gl.validateProgram(gl.programTrack);

    if (!gl.getProgramParameter(gl.programTrack, gl.LINK_STATUS))
        alert("Could not initialise shaders");

    gl.useProgram(gl.programTrack);
    gl.programTrack.pMatrixUniform = gl.getUniformLocation(gl.programTrack, "uPMatrix");
    gl.programTrack.mvMatrixUniform = gl.getUniformLocation(gl.programTrack, "uMVMatrix");
}

function initBuffers(spark) {
    vertexPositionAttributeSpark = gl.getAttribLocation(gl.programSpark, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttributeSpark);

    vertexPositionAttributeTrack = gl.getAttribLocation(gl.programTrack, "aPosition");
    gl.enableVertexAttribArray(vertexPositionAttributeTrack);
    vertexColorAttributeTrack = gl.getAttribLocation(gl.programTrack, "aColor");
    gl.enableVertexAttribArray(vertexColorAttributeTrack);

    spark.texture = gl.createTexture();
    spark.image = new Image(32, 32);
    spark.image.crossOrigin = "anonymous";
    spark.image.src = "spark.png";
    spark.image.addEventListener('load', function() {
        gl.bindTexture(gl.TEXTURE_2D, spark.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spark.image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);

        requestAnimationFrame(drawScene);
    });//*/
}

function drawScene(now) {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    gl.clearColor(0.0, .0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.DEPTH_TEST);


    mat4.perspective(pMatrix, 45, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [0, 0, -3.5]);

    let positions = [];
    sparks.forEach(spark => {
        if (spark.move(now))
            spark = new Spark();
        positions.push(spark.x);
        positions.push(spark.y);
        positions.push(0);
    })

    drawTracks(positions);
    drawOneSpark(spark1, positions);

    requestAnimationFrame(drawScene);
}

function drawOneSpark(spark, positions) {
    gl.useProgram(gl.programSpark);

    gl.uniformMatrix4fv(gl.programSpark.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(gl.programSpark.mvMatrixUniform, false, mvMatrix);

    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, spark.texture);
    gl.uniform1i(gl.programSpark.uTexture, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(vertexPositionAttributeSpark, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionAttributeSpark);

    gl.drawArrays(gl.POINTS, 0, positions.length / 3);
}

function drawTracks(positions) {
    let colors = [];
    let positionsFromCenter = [];
    for (let i = 0; i < positions.length; i += 3) {
        // для каждой координаты добавляем точку начала координат, чтобы получить след искры
        positionsFromCenter.push(0, 0, 0);
        positionsFromCenter.push(positions[i], positions[i + 1], positions[i + 2]);

        // цвет в начале координат будет белый (горячий), а дальше будет приближаться к оранжевому
        colors.push(1, 1, 1, 0.47, 0.31, 0.24);
    }

    gl.useProgram(gl.programTrack);

    gl.uniformMatrix4fv(gl.programTrack.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(gl.programTrack.mvMatrixUniform, false, mvMatrix);

    let positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsFromCenter), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vertexPositionAttributeTrack, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionAttributeTrack);

    let colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vertexColorAttributeTrack, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexColorAttributeTrack);

    gl.drawArrays(gl.LINES, 0, positionsFromCenter.length / 3);

}

start();
