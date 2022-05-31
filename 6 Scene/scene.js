
"use strict";

//________________________________________________________________________
//---------------TEXTURES-------------------------------------------------
var im1, im2, im3, im4, imt90, imhouse, imUaz, imgreen;
const _tx = new Uint8Array([0, 0, 255, 255]);

function loadtexture(src)
{
	const tx = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tx);
	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, 
		gl.RGBA, gl.UNSIGNED_BYTE, _tx);

	const im = new Image();
	im.crossOrigin="anonymous";
	im.onload = function potat(){
		gl.bindTexture(gl.TEXTURE_2D, tx);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	};
	im.src=src;
	return tx;
}
function textureinit()
{
	
	im2 = loadtexture("images/t1.jpg");
	im3 = loadtexture("images/m1.jpg");
	im4 = loadtexture("images/m2.jpg");
	imt90 = loadtexture("images/t90.png");
	imhouse = loadtexture("images/house.jpg");
	imUaz = loadtexture("images/uaz.png")
	imgreen = loadtexture("images/green.jpg")
	
}

//________________________________________________________________________
//---------------PROGRAMS-------------------------------------------------

function initProgram(vssrc, fssrc, name)
{
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
		vposloc: gl.getAttribLocation(prog, '_pos'),
		vnorloc: gl.getAttribLocation(prog, '_nor'),
		vtxyloc: gl.getAttribLocation(prog, '_txy'),
		
		m4ptloc: gl.getUniformLocation(prog, 'm4pt'),
		m3ntloc: gl.getUniformLocation(prog, 'm3nt'),
		projloc: gl.getUniformLocation(prog, 'proj'),

		colrloc: gl.getUniformLocation(prog, 'colr'),
		lsrcloc: gl.getUniformLocation(prog, 'lsrc'),
		ldirloc: gl.getUniformLocation(prog, 'ldir'),
		lpowloc: gl.getUniformLocation(prog, 'lpow'),
		
		ambiloc: gl.getUniformLocation(prog, 'ambi'),
		diffloc: gl.getUniformLocation(prog, 'diff'),
		specloc: gl.getUniformLocation(prog, 'spec'),

		_tx1loc: gl.getUniformLocation(prog, '_tx1'),
    };
}

var info_1p;
var vssrc_1p = 
`#version 300 es
	in vec4 _pos;
	in vec3 _nor;
	in vec2 _txy;

	uniform mat4 m4pt;
	uniform mat3 m3nt;
	uniform mat4 proj;

	out vec4 pos;
	out vec3 nor;
	out vec2 txy;

	void main() {
		vec4 p = m4pt * _pos;
		p/=p.w;
		gl_Position = proj * p;

		pos = p;
		nor = m3nt * _nor;
		txy = _txy;
	}
`;
var fssrc_1p = 
`#version 300 es
	precision mediump float;

	uniform vec4 lsrc[4];

	uniform float ambi;
	uniform float diff;
	uniform float spec;

	uniform vec3 ldir;
	uniform float lpow;

	uniform vec4 colr;
	uniform sampler2D _tx1;

	in vec4 pos;
	in vec3 nor;
	in vec2 txy;
	out vec4 _col;

	float phong(vec4 lsrc)
	{
		vec3 dpos = (lsrc-pos).xyz;
		vec3 ldir = normalize(dpos);
		vec3 vdir = normalize(pos.xyz);
		vec3 rdir = -reflect(nor, ldir);
		
		float _diff = max(0.0, dot(nor, ldir)) * diff;
		float _spec = pow(max(0.0, dot(rdir, vdir)), spec);
		return (_diff+_spec) * lsrc.w/length(dpos);
	}
	float phongdirective(vec4 lsrc, vec3 dir)
	{
		vec3 dpos = (lsrc-pos).xyz;
		vec3 ldir = normalize(dpos);

		float ldot=-dot(ldir, dir);
		ldir*=ldot<0.0f? 0.0f: pow(ldot, lpow);
		vec3 vdir = normalize(pos.xyz);
		vec3 rdir = -reflect(nor, ldir);
		
		float _diff = max(0.0, dot(nor, ldir)) * diff;
		float _spec = pow(max(0.0, dot(rdir, vdir)), spec);
		return (_diff+_spec) * lsrc.w*lpow/length(dpos);
	}

	void main() {
		float _l=ambi + phongdirective(lsrc[0], ldir);
		for(int i=1; i<4; i++)
			_l+=phong(lsrc[i]);

		float a=colr[3];
		vec4 t = texture(_tx1, txy)*(1.0f-a)+colr*a; 
		_col = vec4(t.r*_l, t.g*_l, t.b*_l, t.a);
	}
`;

var info_2p;
var vssrc_2p = 
`#version 300 es
	in vec4 _pos;
	uniform mat4 proj;

	void main() {
		vec4 p = proj * _pos;
		gl_Position = p;
		gl_PointSize=8.0f;
	}
`;
var fssrc_2p = 
`#version 300 es
	precision mediump float;

	uniform vec4 colr;

	out vec4 _col;

	void main() {
		_col = colr;
	}
`;


//_____________________________________________________________________
//---------------MAIN--------------------------------------------------

var gl;
var h1;
var canv
window.onload = function main() 
{
	h1 = document.querySelector("#oof");
    canv = document.querySelector("#canvas1");
	gl = canv.getContext("webgl2");

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
	

    info_1p = initProgram(vssrc_1p, fssrc_1p, "OOF");
    info_2p = initProgram(vssrc_2p, fssrc_2p, "OF");

	
	textureinit();
	spaceinit();

	update();
}

//_________________________________________________________________________
//---------------CONTROLS--------------------------------------------------
var ambi = 0.05;
var diff = 1.0;
var spec = 400.0;
var lsrc=[];
var ldir=[0, 0, 0];
var lpow=10;

var mov = null;
var dx = 0, dz = 0;
function direct()
{
	if(dz >0)	mov= dx>0? movru:	dx<0? movrd:null;
	if(dz <0)	mov= dx>0? movlu:	dx<0? movld:null;
	if(dz==0)	mov= dx>0? movu:	dx<0? movd:null;
}

window.onkeydown = function kot(e)
{
	if(e.code=="KeyQ") mat4.multiply(proj, proj, roty0);
	if(e.code=="KeyE") mat4.multiply(proj, proj, roty1);
	
	if(e.code=="Numpad2") figures[0].move(0, -0.2, 0);
	if(e.code=="Numpad8") figures[0].move(0, +0.2, 0);
	if(e.code=="Numpad4") figures[0].selfapply(roty0);
	if(e.code=="Numpad6") figures[0].selfapply(roty1);

	if(e.code=="Numpad5") 	lsrc[0][3]=1-lsrc[0][3];
	if(e.code=="KeyZ") 		lsrc[1][3]=1-lsrc[1][3];
	if(e.code=="KeyX") 		lsrc[2][3]=1-lsrc[2][3];
	if(e.code=="KeyC") 		lsrc[3][3]=1-lsrc[3][3];

	if(e.code=="Digit1") ambi*=1.1;
	if(e.code=="Digit2") ambi/=1.1;
	if(e.code=="Digit3") diff*=1.1;
	if(e.code=="Digit4") diff/=1.1;
	if(e.code=="Digit5") spec*=1.1;
	if(e.code=="Digit6") spec/=1.1;

	if(e.code=="Numpad1") lpow*=1.1;
	if(e.code=="Numpad3") lpow/=1.1;

	
	if(e.code=="ArrowRight")	dz=+1;
	if(e.code=="ArrowLeft")		dz=-1;
	if(e.code=="ArrowUp")		dx=+1;
	if(e.code=="ArrowDown")		dx=-1;
	
	direct();
}
window.onkeyup = function blini(e)
{
	if(e.code=="ArrowRight")	dz=0;
	if(e.code=="ArrowLeft")		dz=0;
	if(e.code=="ArrowUp")		dx=0;
	if(e.code=="ArrowDown")		dx=0;
	
	direct();
}

var scale = 1;
window.onwheel = function hotwheels(e) { proj[15] += e.deltaY<0? -0.2: 0.2; }

//_____________________________________________________________________
//-------AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-------------

// я запрещаю смотреть это
function parseOBJ(text) {
	// because indices are base 1 let's just fill in the 0th data
	const objPositions = [[0, 0, 0]];
	const objTexcoords = [[0, 0]];
	const objNormals = [[0, 0, 0]];
  
	// same order as `f` indices
	const objVertexData = [
	  objPositions,
	  objTexcoords,
	  objNormals,
	];
  
	// same order as `f` indices
	let webglVertexData = [
	  [],   // positions
	  [],   // texcoords
	  [],   // normals
	];
  
	function newGeometry() {
	  // If there is an existing geometry and it's
	  // not empty then start a new one.
	  if (geometry && geometry.data.position.length) {
		geometry = undefined;
	  }
	  setGeometry();
	}
  
	function addVertex(vert) {
	  const ptn = vert.split('/');
	  ptn.forEach((objIndexStr, i) => {
		if (!objIndexStr) {
		  return;
		}
		const objIndex = parseInt(objIndexStr);
		const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
		webglVertexData[i].push(...objVertexData[i][index]);
	  });
	}
  
	const keywords = {
	  v(parts) {
		objPositions.push(parts.map(parseFloat));
	  },
	  vn(parts) {
		objNormals.push(parts.map(parseFloat));
	  },
	  vt(parts) {
		// should check for missing v and extra w?
		objTexcoords.push(parts.map(parseFloat));
	  },
	  f(parts) {
		const numTriangles = parts.length - 2;
		for (let tri = 0; tri < numTriangles; ++tri) {
		  addVertex(parts[0]);
		  addVertex(parts[tri + 1]);
		  addVertex(parts[tri + 2]);
		}
	  },
	};
  
	const keywordRE = /(\w*)(?: )*(.*)/;
	const lines = text.split('\n');
	for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
	  const line = lines[lineNo].trim();
	  if (line === '' || line.startsWith('#')) {
		continue;
	  }
	  const m = keywordRE.exec(line);
	  if (!m) {
		continue;
	  }
	  const [, keyword, unparsedArgs] = m;
	  const parts = line.split(/\s+/).slice(1);
	  const handler = keywords[keyword];
	  if (!handler) {
		//console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
		continue;
	  }
	  handler(parts, unparsedArgs);
	}
  
	return {
	  pos: webglVertexData[0],
	  txy: webglVertexData[1],
	  nor: webglVertexData[2],
	};
}
function bufferize(parsedobj)
{
	const size = parsedobj.pos.length;

	const posbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(parsedobj.pos), gl.STATIC_DRAW);
	const txybuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, txybuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(parsedobj.txy), gl.STATIC_DRAW);
	const norbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, norbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(parsedobj.nor), gl.STATIC_DRAW);

	return {
		size,
		pos: parsedobj.pos,
		posbuf,
		txybuf,
		norbuf,
	}
}

//_____________________________________________________________________
//---------------SPACE-------------------------------------------------
function m3det(m)
{
	// 0 1 2
	// 3 4 5 = 0(48-57)-1(38-56)+2(37-46)
	// 6 7 8
	return 	m[0]*(m[4]*m[8]-m[5]*m[7])-m[1]*(m[3]*m[8]-m[5]*m[6])+m[2]*(m[3]*m[7]-m[4]*m[6]);
}
function len(v)
{
	return Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
}

function transform(v, m)
{
	// 0  1  2  3
	// 4  5  6  7
	// 8  9  10 11
	// 12 13 14 15
	const t=1/m[15];
	const x=t*	(v[0]*m[0]	+v[1]*m[4]	+v[2]*m[8]	+v[3]*m[12]);
	const y=t*	(v[0]*m[1]	+v[1]*m[5]	+v[2]*m[9]	+v[3]*m[13]);
	const z=t*	(v[0]*m[2]	+v[1]*m[6]	+v[2]*m[10]	+v[3]*m[14]);
	return [x, y, z, 1];
}


function ttintersect(p1, p2, p3, t1, t2, t3)
{
	if(tlintersect(p1, p2, t1, t2, t3)) return true;
	if(tlintersect(p2, p3, t1, t2, t3)) return true;
	if(tlintersect(p3, p1, t1, t2, t3)) return true;
	return false;
}

function tlintersect(p1, p2, t1, t2, t3)
{
	const x=p2[0], y=p2[1], z=p2[2];
	const x1=t1[0]-x, y1=t1[1]-y, z1=t1[2]-z;
	const x2=t2[0]-x, y2=t2[1]-y, z2=t2[2]-z;
	const x3=t3[0]-x, y3=t3[1]-y, z3=t3[2]-z;

	const x4=p1[0]-x, y4=p1[1]-y, z4=p1[2]-z;
	var a=-m3det([
		x2, x3, x4,
		y2, y3, y4,
		z2, z3, z4
	]);
	var b=m3det([
		x1, x3, x4,
		y1, y3, y4,
		z1, z3, z4
	]);
	var c=-m3det([
		x1, x2, x4,
		y1, y2, y4,
		z1, z2, z4
	]);
	var d=m3det([
		x1, x2, x3,
		y1, y2, y3,
		z1, z2, z3
	]);
	
	const n=a+b+c+d;
	return n>=0? (a>0 && b>0 && c>0 && d<0): (a<0 && b<0 && c<0 && d>0);
}

const ix=12, iy=13, iz=14;
class figure
{
	constructor(size, posbuf, txybuf, norbuf, tx)
	{
		this.size=size;
		this.posbuf=posbuf;
		this.txybuf=txybuf;
		this.norbuf=norbuf;
		this.tx=tx;

		this.m4pt=mat4.create();
		this.m3nt=mat3.create();
		this.m4tm=mat4.create();

		this.pos=[0, 0, 0, 1];
		this.p123=[];
		this.p123t=[];

		this.col=[0, 0, 0, 0];
	}

	//--------main----------
	render()
	{
		const info = info_1p;
		//----------------attributes--------------
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posbuf);
		gl.vertexAttribPointer(info.vposloc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(info.vposloc);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.norbuf);
		gl.vertexAttribPointer(info.vnorloc, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(info.vnorloc);
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.txybuf);
		gl.vertexAttribPointer(info.vtxyloc, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(info.vtxyloc);
	
	
		//----------------uniforms--------------
		gl.useProgram(info.prog);
		gl.uniformMatrix4fv(info.m4ptloc, false, this.m4pt);
		gl.uniformMatrix3fv(info.m3ntloc, false, this.m3nt);
		gl.uniformMatrix4fv(info.projloc, false, proj);
		
		gl.uniform4fv(info.colrloc, this.col);

		gl.uniform4fv(info.lsrcloc, lsrc.flat(2));
		gl.uniform3fv(info.ldirloc, ldir);
		gl.uniform1f(info.lpowloc, lpow);

		gl.uniform1f(info.ambiloc, ambi);
		gl.uniform1f(info.diffloc, diff);
		gl.uniform1f(info.specloc, spec);
	
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.tx);
		gl.uniform1i(info._tx1loc, 0);
	
		gl.drawArrays(gl.TRIANGLES, 0, this.size);
	}
	update()
	{
		var p=[0, 0, 0, 1];
		p=transform(p, this.m4pt);
		p[1]+=0.2;
		this.pos[0]=p[0];
		this.pos[1]=p[1];
		this.pos[2]=p[2];
	}

	//--------colliding----------

	update_collider()
	{
		const p123=this.p123;
		for(var i=0; i<p123.length; i++)
			this.p123t[i]=transform(p123[i], this.m4pt);
	}
	setcollider(p123)
	{
		const p=[], pt=[];
		for(var i=0; i<p123.length;)
		{
			const xyzw=[
				p123[i++], 
				p123[i++], 
				p123[i++],
				1
			];
			p.push(xyzw);
			pt.push(xyzw);
		}
		this.p123=p;
		this.p123t=pt;
	}
	optimize_collider()
	{
		var x0=this.p123[0][0], x1=x0;
		var y0=this.p123[0][1], y1=y0;
		var z0=this.p123[0][2], z1=z0;
		for(var i=1; i<this.p123.length; i++)
		{
			const t=this.p123[i];
			const x=t[0], y=t[1], z=t[2];
			x0=x0<x?x0:x; x1=x1>x?x1:x;
			y0=y0<y?y0:y; y1=y1>y?y1:y;
			z0=z0<z?z0:z; z1=z1>z?z1:z;
		}
		const p000=[x0, y0, z0, 1], p001=[x0, y0, z1, 1];
		const p010=[x0, y1, z0, 1], p011=[x0, y1, z1, 1];
		const p100=[x1, y0, z0, 1], p101=[x1, y0, z1, 1];
		const p110=[x1, y1, z0, 1], p111=[x1, y1, z1, 1];
		const p=[];
		//	  010----011
		//	  /|     /|	
		//	110+---111|	
		//	 |000---+001
		//	 |/     |/
		//	100----101
		p.push(p000, p001, p010, p001, p010, p011);	// x0
		p.push(p100, p101, p110, p101, p110, p111);	// x1
		p.push(p000, p001, p100, p001, p100, p101); // y0
		p.push(p010, p011, p110, p011, p110, p111); // y1
		p.push(p000, p100, p010, p100, p010, p110); // z0
		p.push(p001, p101, p011, p101, p011, p111); // z1
		this.p123=p;
		this.p123t=p.slice();
		this.update_collider();
	}

	collide(fig)
	{
		const p123t=fig.p123t;
		for(var i=0; i<p123t.length;)
		{
			const t1=p123t[i++];
			const t2=p123t[i++];
			const t3=p123t[i++];
			if(this.cross(t1, t2, t3))
				return true;
		}
		return false;
	}
	cross(t1, t2, t3)
	{
		const p123t=this.p123t;
		for(var i=0; i<p123t.length;)
		{
			const p1=p123t[i++];
			const p2=p123t[i++];
			const p3=p123t[i++];
			if(ttintersect(p1, p2, p3, t1, t2, t3))
				return true;
		}
		return false;
	}
	
	debug(col)
	{
		drawPoints(this.p123t, col);
	}

	//--------transform----------

	back()
	{
		mat4.copy(this.m4pt, this.m4tm);
		this.update_collider();
	}

	apply(mat)
	{
		mat4.copy(this.m4tm, this.m4pt);
		mat4.multiply(this.m4pt, this.m4pt, mat);
		mat3.normalFromMat4(this.m3nt, this.m4pt);
		this.update_collider();
	}
	selfapply(mat)
	{
		const m=this.m4pt;
		mat4.copy(this.m4tm, m);
		const x=m[ix], y=m[iy], z=m[iz];
		m[ix]-=x; m[iy]-=y; m[iz]-=z;
		mat4.multiply(m, m, mat);
		mat3.normalFromMat4(this.m3nt, m);
		m[ix]+=x; m[iy]+=y; m[iz]+=z;
		this.update_collider();
	}

	rotatey(rot)
	{
		mat4.copy(this.m4tm, this.m4pt);
		mat4.rotateY(this.m4pt, this.m4pt, rot);
		mat3.normalFromMat4(this.m3nt, this.m4pt);
		this.update_collider();
	}
	scale(val)
	{
		mat4.copy(this.m4tm, this.m4pt);
		this.m4pt[15]*=val;
		mat3.normalFromMat4(this.m3nt, this.m4pt);
		this.update_collider();
	}
	move(dx, dy, dz)
	{
		mat4.copy(this.m4tm, this.m4pt);
		this.m4pt[ix]+=dx;
		this.m4pt[iy]+=dy;
		this.m4pt[iz]+=dz;
		this.update_collider();
	}
	moveto(x, y, z)
	{
		mat4.copy(this.m4tm, this.m4pt);
		this.m4pt[ix]=x;
		this.m4pt[iy]=y;
		this.m4pt[iz]=z;
		this.update_collider();
	}
}

class terrain extends figure
{
	constructor(tx)
	{
		const p00 = [-1, 0, -1], p01 = [-1, 0, 1];
		const p10 = [1, 0, -1], p11 = [1, 0, 1];
		const pos=[
			p00, p01, p10,
			p01, p10, p11
		].flat(2);
		const n = [0, 1, 0];
		const nor=[
			n, n, n,
			n, n, n
		].flat(2);
		const t00=[0, 0], t01=[0, 1];
		const t10=[1, 0], t11=[1, 1];
		const txy=[
			t00, t01, t10,
			t01, t10, t11
		].flat(2);
		
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
function update()
{
	if(mov!=null) figures[0].selfapply(mov);
	figures.forEach((f)=>{f.update()})

	const f0=figures[0];
	for(var i=1; i<figures.length; i++)
	{
		const f=figures[i];
		if(f0.collide(f))
		{
			f.col=[1, 0, 0, 0.5];
			f0.back();
		}
		else 
		{
			f.col=[0, 0, 0, 0];
		}
	}
	var p0=[0, 2, 0, 1];
	var p1=[0, 2, 1, 1];
	if(f0!=null)
	{
		p0=transform(p0, f0.m4pt);
		p1=transform(p1, f0.m4pt);
		ldir[0]=p1[0]-p0[0];
		ldir[1]=p1[1]-p0[1];
		ldir[2]=p1[2]-p0[2];
		const l=len(ldir);
		ldir[0]/=l;
		ldir[1]/=l;
		ldir[2]/=l;
	}

	drawScene();
	drawPoints([p0, p1], [1, 0, 1, 1]);
	requestAnimationFrame(update);
}

const movu = mat4.create(), movd = mat4.create();
const movlu = mat4.create(), movld = mat4.create();
const movru = mat4.create(), movrd = mat4.create();

const proj = mat4.create(), cam = mat4.create();
const roty0 = mat4.create(), roty1 = mat4.create();
function basisinit()
{
	mat4.rotateY(proj, proj, 0.2);
	mat4.rotateX(proj, proj, -0.5);

	const scale=640;
	proj[0]=scale/canv.width;
	proj[5]=scale/canv.height;

	const rot = 0.02;
	mat4.rotateY(roty0, roty0, -rot);
	mat4.rotateY(roty1, roty1, +rot);


	const spd = 0.1;
	mat4.translate(movu, movu, [0, 0, +spd]);
	mat4.translate(movd, movd, [0, 0, -spd]);
	

	mat4.multiply(movlu, movu, roty0);
	mat4.multiply(movru, movu, roty1);
	mat4.multiply(movld, movd, roty1);
	mat4.multiply(movrd, movd, roty0);
}


async function loadfigure(src, im)
{
	const r1 = await fetch(src);  
	const t1 = await r1.text();
	const a1 = parseOBJ(t1);
	const d1 = bufferize(a1);
	const f = new figure(d1.size, d1.posbuf, d1.txybuf, d1.norbuf, im);
	f.setcollider(d1.pos);
	return f;
}
async function spaceinit()
{
	basisinit();
	const src1 = "objects/t90.obj";
	const src2 = "objects/car2.obj";
	const houseObj = "objects/house.obj"
	const autoObj = "objects/uaz.obj"
	const greenObj = "objects/green.obj"
	
	//--------------primary--objects-----------
	const f0 = await loadfigure(autoObj, imUaz);
	figures.push(f0); f0.optimize_collider();
	f0.moveto(-10, 0, 10); f0.scale(16);
	f0.pos[3]=0;
	lsrc.push(f0.pos);
	f0.selfapply(movu);

	
	const f1 = new terrain(im2);
	figures.push(f1);
	f1.moveto(0, 0, 0); f1.scale(1);

	//--------------secondaty--objects-----------
	const f2 = await loadfigure(houseObj, imhouse);
	figures.push(f2); f2.optimize_collider();
	f2.rotatey(0)
	f2.moveto(70, 0, 60); f2.scale(84);
	lsrc.push(f2.pos); f2.pos[3]=0;

	const f3 = await loadfigure(greenObj, im1);
	figures.push(f3); f3.optimize_collider();
	f3.moveto(-5, 10, 0); f3.scale(16);
	lsrc.push(f3.pos); f3.pos[3]=1;
	
	// house
	const f4 = await loadfigure(houseObj, imhouse);
	figures.push(f4); f4.optimize_collider();
	f4.moveto(-70, 0, 70); f4.scale(80);
	lsrc.push(f4.pos); f4.pos[3]=0;
}

//_______________________________________________________________________
//---------------RENDER--------------------------------------------------
function drawPoints(pts, col)
{
	if(pts[0]==null) return;

	const info = info_2p;
	const dep=4;
	const len=pts.length;
	const arr=pts.flat(2);

	//----------------attributes--------------
	const buf=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);

    gl.vertexAttribPointer(info.vposloc, dep, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(info.vposloc);
	

	//----------------uniforms--------------
	gl.useProgram(info.prog);
		
	gl.uniformMatrix4fv(info.projloc, false, proj);
	gl.uniform4fv(info.colrloc, col);
	
	gl.drawArrays(gl.POINTS, 0, len);
}


function drawScene() 
{
    gl.clearColor(0.0, 1.0, 1.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	figures.forEach((f)=>{f.render()});

	drawPoints(lsrc, [1, 0, 0, 1]);
	
	figures[0]?.debug([1, 1, 0, 1]);
	figures[3]?.debug([0, 1, 1, 1]);

}