main();

function main() {
    var canvas = document.getElementById("particles");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // gl.SRC_ALPHA - рисуемая искра умножается на прозрачный канал, чтобы убрать фон
    // изображения. gl.ONE - уже нарисованные искры остаются без изменений
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    var programTrack = webglUtils.createProgramFromScripts(gl, ["vertex-shader-track", "fragment-shader-track"]);

    var positionAttributeLocationTrack = gl.getAttribLocation(programTrack, "a_position");
    var colorAttributeLocationTrack = gl.getAttribLocation(programTrack, "a_color");
    var pMatrixUniformLocationTrack = gl.getUniformLocation(programTrack, "u_pMatrix");
    var mvMatrixUniformLocationTrack = gl.getUniformLocation(programTrack, "u_mvMatrix");

    var programSpark = webglUtils.createProgramFromScripts(gl, ["vertex-shader-spark", "fragment-shader-spark"]);

    var positionAttributeLocationSpark = gl.getAttribLocation(programSpark, "a_position");
    var textureLocationSpark = gl.getUniformLocation(programSpark, "u_texture");
    var pMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_pMatrix");
    var mvMatrixUniformLocationSpark = gl.getUniformLocation(programSpark, "u_mvMatrix");

    var texture = gl.createTexture();
    var image = new Image();
    image.src = ".png";
    image.addEventListener('load', function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);

        requestAnimationFrame(drawScene);
    });
    

    var mvMatrix = mat4.create();
    var pMatrix = mat4.create();

    function drawTracks(positions) {
        var colors = [];
        var positionsFromCenter = [];
        for (var i = 0; i < positions.length; i += 3) {
            // для каждой координаты добавляем точку начала координат, чтобы получить след искры
            positionsFromCenter.push(0, 0, 0);
            positionsFromCenter.push(positions[i], positions[i + 1], positions[i + 2]);

            // цвет в начале координат будет белый (горячий), а дальше будет приближаться к оранжевому
            colors.push(1, 1, 1, 0.47, 0.31, 0.24);
        }

        gl.useProgram(programTrack);

        gl.uniformMatrix4fv(pMatrixUniformLocationTrack, false, pMatrix);
        gl.uniformMatrix4fv(mvMatrixUniformLocationTrack, false, mvMatrix);

        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsFromCenter), gl.STATIC_DRAW);

        gl.vertexAttribPointer(positionAttributeLocationTrack, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionAttributeLocationTrack);

        var colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        gl.vertexAttribPointer(colorAttributeLocationTrack, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorAttributeLocationTrack);

        gl.drawArrays(gl.LINES, 0, positionsFromCenter.length / 3);
    }

    function drawSparks(positions) {
        gl.useProgram(programSpark);

        gl.uniformMatrix4fv(pMatrixUniformLocationSpark, false, pMatrix);
        gl.uniformMatrix4fv(mvMatrixUniformLocationSpark, false, mvMatrix);

        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureLocationSpark, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        gl.vertexAttribPointer(positionAttributeLocationSpark, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(positionAttributeLocationSpark);

        gl.drawArrays(gl.POINTS, 0, positions.length / 3);
    }

    var sparks = [];
    for (var i = 0; i < Spark.sparksCount; i++) {
        sparks.push(new Spark());
    }

    function drawScene(now) {
        // обновляем размер canvas на случай, если он растянулся или сжался вслед за страницей
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(pMatrix, 45, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, mvMatrix, [0, 0, -3.5]);

        for (var i = 0; i < sparks.length; i++) {
            sparks[i].move(now);
        }

        var positions = [];
        sparks.forEach(function(item, i, arr) {
            positions.push(item.x);
            positions.push(item.y);
            positions.push(0);
        });

        drawTracks(positions);
        drawSparks(positions);

        requestAnimationFrame(drawScene);
    }
}

//#region Spark
function Spark() {
    this.init();
};

// количество искр
Spark.sparksCount = 200;

Spark.prototype.init = function() {
    // время создания искры
    this.timeFromCreation = performance.now();

    // задаём направление полёта искры в градусах, от 0 до 360
    var angle = Math.random() * 360;
    // радиус - это расстояние, которое пролетит искра
    var radius = Math.random();
    // отмеряем точки на окружности - максимальные координаты искры
    this.xMax = Math.cos(angle) * radius;
    this.yMax = Math.sin(angle) * radius;

    // dx и dy - приращение искры за вызов отрисовки, то есть её скорость,
    // у каждой искры своя скорость. multiplier подобран экспериментально
    var multiplier = 125 + Math.random() * 125;
    this.dx = this.xMax / multiplier;
    this.dy = this.yMax / multiplier;

    // Для того, чтобы не все искры начинали движение из начала координат,
    // делаем каждой искре свой отступ, но не более максимальных значений.
    this.x = (this.dx * 1000) % this.xMax;
    this.y = (this.dy * 1000) % this.yMax;
};

Spark.prototype.move = function(time) {
    // находим разницу между вызовами отрисовки, чтобы анимация работала
    // одинаково на компьютерах разной мощности
    var timeShift = time - this.timeFromCreation;
    this.timeFromCreation = time;

    // приращение зависит от времени между отрисовками
    var speed = timeShift;
    this.x += this.dx * speed;
    this.y += this.dy * speed;

    // если искра достигла конечной точки, запускаем её заново из начала координат
    if (Math.abs(this.x) > Math.abs(this.xMax) || Math.abs(this.y) > Math.abs(this.yMax)) {
        this.init();
        return;
    }
};

//#endregion