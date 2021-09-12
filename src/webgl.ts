import { gl } from "./init.js";

export interface ShaderInputDesc {
	type: string,
	name: string,
}

export class Shader {
	readonly source: string;
	constructor(
		readonly type: number,
		readonly attributes: ShaderInputDesc[],
		readonly uniforms: ShaderInputDesc[],
		source: string,
	) {
		uniforms.forEach(({type, name}) => {
			source = `uniform ${type} ${name};\n` + source;
		});
		attributes.forEach(({type, name}) => {
			source = `attribute ${type} ${name};\n` + source;
		});
		source = "precision highp float;\n" + source;
		console.log(source);
		this.source = source;
	}
}

export interface Uniform {
	value: UniformData;
	location: WebGLUniformLocation;
}

export interface UniformData {
	bind(location: WebGLUniformLocation): void;
}

export class FloatVec3 implements UniformData {
	constructor(
		public x = 0,
		public y = 0,
		public z = 0,
	) { }

	add(v: FloatVec3) {
		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		return this;
	}

	dot(v: FloatVec3) {
		return this.x * v.x + this.y * v.y + this.z * v.z;
	}

	cross(v: FloatVec3) {
		const ax = this.x;
		const ay = this.y;
		const az = this.z;
		const bx = v.x;
		const by = v.y;
		const bz = v.z;
		this.x = ay * bz - az * by;
		this.y = az * bx - ax * bz;
		this.z = ax * by - ay * bx;
		return this;
	}

	length2() {
		return this.dot(this);
	}

	length() {
		return Math.sqrt(this.length2());
	}

	mulScalar(s: number) {
		this.x *= s;
		this.y *= s;
		this.z *= s;
		return this;
	}

	normalize() {
		return this.mulScalar(1 / this.length());
	}

	applyQuat(q: Quaternion) {
		const x = this.x, y = this.y, z = this.z;
		const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
		const ix = qw * x + qy * z - qz * y;
		const iy = qw * y + qz * x - qx * z;
		const iz = qw * z + qx * y - qy * x;
		const iw = - qx * x - qy * y - qz * z;
		this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
		this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
		this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;
		return this;
	}

	bind(location: WebGLUniformLocation): void {
		gl.uniform3f(location, this.x, this.y, this.z);
	}

	copy(other: FloatVec3) {
		this.x = other.x;
		this.y = other.y;
		this.z = other.z;
		return this;
	}
}

export class FloatVec4 implements UniformData {
	constructor(
		public x = 0,
		public y = 0,
		public z = 0,
		public w = 0,
	) { }

	bind(location: WebGLUniformLocation): void {
		gl.uniform4f(location, this.x, this.y, this.z, this.w);
	}

	copy(other: FloatVec4) {
		this.x = other.x;
		this.y = other.y;
		this.z = other.z;
		this.w = other.w;
		return this;
	}

	length() {
		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );
	}
}

export class Quaternion extends FloatVec4 {
	fromAxisAngle(axis: FloatVec3, angle: number) {
		const half = angle / 2;
		const sin = Math.sin(half);
		this.x = axis.x * sin;
		this.y = axis.y * sin;
		this.z = axis.z * sin;
		this.w = Math.cos(half);
		return this;
	}

	mul(other: Quaternion) {
		return this.multiply(this, other);
	}

	preMul(other: Quaternion) {
		return this.multiply(other, this);
	}

	private multiply(a: Quaternion, b: Quaternion) {
		const ax = a.x;
		const ay = a.y;
		const az = a.z;
		const aw = a.w;
		const bx = b.x;
		const by = b.y;
		const bz = b.z;
		const bw = b.w;

		this.x = ax * bw + aw * bx + ay * bz - az * by;
		this.y = ay * bw + aw * by + az * bx - ax * bz;
		this.z = az * bw + aw * bz + ax * by - ay * bx;
		this.w = aw * bw - ax * bx - ay * by - az * bz;

		return this;
	}

	normalize() {
		let l = this.length();
		if ( l === 0 ) {
			this.x = 0;
			this.y = 0;
			this.z = 0;
			this.w = 1;
		} else {
			l = 1 / l;
			this.x = this.x * l;
			this.y = this.y * l;
			this.z = this.z * l;
			this.w = this.w * l;
		}
		return this;
	}

	static nlerp(q1: Quaternion, q2: Quaternion, t: number, q3: Quaternion) {
		q3.x = (1 - t) * q1.x + t * q2.x;
		q3.y = (1 - t) * q1.y + t * q2.y;
		q3.z = (1 - t) * q1.z + t * q2.z;
		q3.w = (1 - t) * q1.w + t * q2.w;
		return q3.normalize();
	}
}

const defaultScale = new FloatVec3(1, 1, 1);

export class FloatMat4 implements UniformData {
	constructor(
		public arr: number[] = [],
	) {}

	perspective(fov: number, aspect: number, near: number, far: number) {
		const top = near * Math.tan(0.5 * fov );
		const height = 2 * top;
		const width = aspect * height;
		const left = - 0.5 * width;
		const right = left + width;
		const bottom = top - height;

		const x = 2 * near / ( right - left );
		const y = 2 * near / ( top - bottom );

		const a = ( right + left ) / ( right - left );
		const b = ( top + bottom ) / ( top - bottom );
		const c = - ( far + near ) / ( far - near );
		const d = - 2 * far * near / ( far - near );

		const arr = this.arr;
		arr[ 0 ] = x;	arr[ 4 ] = 0;	arr[ 8 ] = a;	arr[ 12 ] = 0;
		arr[ 1 ] = 0;	arr[ 5 ] = y;	arr[ 9 ] = b;	arr[ 13 ] = 0;
		arr[ 2 ] = 0;	arr[ 6 ] = 0;	arr[ 10 ] = c;	arr[ 14 ] = d;
		arr[ 3 ] = 0;	arr[ 7 ] = 0;	arr[ 11 ] = - 1;arr[ 15 ] = 0;
		return this;
	}

	mul(other: FloatMat4) {
		return this.multiply(this, other);
	}

	preMul(other: FloatMat4) {
		return this.multiply(other, this);
	}

	private multiply(
		{arr: a}: FloatMat4,
		{arr: b}: FloatMat4,
	) {
		const a11 = a[ 0 ], a12 = a[ 4 ], a13 = a[ 8 ], a14 = a[ 12 ];
		const a21 = a[ 1 ], a22 = a[ 5 ], a23 = a[ 9 ], a24 = a[ 13 ];
		const a31 = a[ 2 ], a32 = a[ 6 ], a33 = a[ 10 ], a34 = a[ 14 ];
		const a41 = a[ 3 ], a42 = a[ 7 ], a43 = a[ 11 ], a44 = a[ 15 ];

		const b11 = b[ 0 ], b12 = b[ 4 ], b13 = b[ 8 ], b14 = b[ 12 ];
		const b21 = b[ 1 ], b22 = b[ 5 ], b23 = b[ 9 ], b24 = b[ 13 ];
		const b31 = b[ 2 ], b32 = b[ 6 ], b33 = b[ 10 ], b34 = b[ 14 ];
		const b41 = b[ 3 ], b42 = b[ 7 ], b43 = b[ 11 ], b44 = b[ 15 ];

		const t = this.arr

		t[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
		t[ 4 ] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
		t[ 8 ] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
		t[ 12 ] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

		t[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
		t[ 5 ] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
		t[ 9 ] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
		t[ 13 ] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

		t[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
		t[ 6 ] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
		t[ 10 ] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
		t[ 14 ] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

		t[ 3 ] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
		t[ 7 ] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
		t[ 11 ] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
		t[ 15 ] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

		return this;
	}

	compose(
		position: FloatVec3,
		quaternion: FloatVec4,
		scale = defaultScale,
	) {
		const arr = this.arr;

		const {x, y, z, w} = quaternion;
		const x2 = x + x;
		const y2 = y + y;
		const z2 = z + z;
		const xx = x * x2, xy = x * y2, xz = x * z2;
		const yy = y * y2, yz = y * z2, zz = z * z2;
		const wx = w * x2, wy = w * y2, wz = w * z2;

		const sx = scale.x;
		const sy = scale.y;
		const sz = scale.z;

		arr[ 0 ] = ( 1 - ( yy + zz ) ) * sx;
		arr[ 1 ] = ( xy + wz ) * sx;
		arr[ 2 ] = ( xz - wy ) * sx;
		arr[ 3 ] = 0;

		arr[ 4 ] = ( xy - wz ) * sy;
		arr[ 5 ] = ( 1 - ( xx + zz ) ) * sy;
		arr[ 6 ] = ( yz + wx ) * sy;
		arr[ 7 ] = 0;

		arr[ 8 ] = ( xz + wy ) * sz;
		arr[ 9 ] = ( yz - wx ) * sz;
		arr[ 10 ] = ( 1 - ( xx + yy ) ) * sz;
		arr[ 11 ] = 0;

		arr[ 12 ] = position.x;
		arr[ 13 ] = position.y;
		arr[ 14 ] = position.z;
		arr[ 15 ] = 1;

		return this;
	}

	bind(location: WebGLUniformLocation): void {
		gl.uniformMatrix4fv(location, false, this.arr);
	}

	copy(other: FloatMat4) {
		for (let a = 0; a < other.arr.length; a++) {
			this.arr[a] = other.arr[a];
		}
		return this;
	}
}


export interface Attribute {
	value: AttributeData;
	index: number;
}

export interface AttributeData {
	bind(index: number): void;
}


export class GLArrayBuffer implements AttributeData {
	private buffer: WebGLBuffer;
	constructor(
		readonly data: ArrayBuffer,
		readonly size: number,
		readonly type: number,
		usage = gl.STATIC_DRAW
	) {
		const buffer = gl.createBuffer();
		if (buffer === null) {
			console.trace('buffer === null');
			throw 1;
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, usage);

		this.buffer = buffer;
	}

	bind(index: number): void {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.enableVertexAttribArray(index);
		gl.vertexAttribPointer(index, this.size, this.type, false, 0, 0);
	}
}

export class ElementBuffer {
	private buffer: WebGLBuffer;
	constructor(
		readonly data: Uint16Array,
	) {
		const buffer = gl.createBuffer();
		if (buffer === null) {
			console.trace('buffer === null');
			throw 1;
		}
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
		this.buffer = buffer
	}

	bind() {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
	}

	use(mode: number) {
		gl.drawElements(mode, this.data.length, gl.UNSIGNED_SHORT, 0);
	}
}

export class Program {
	private readonly program: WebGLProgram;
	readonly uniforms: Map<string, Uniform> = new Map();
	readonly attributes: Map<string, Attribute> = new Map();
	constructor(
		shaders: Shader[],
	) {
		const compiledShaders = shaders.map(({source, type}) => this.compileShader(source, type));
		const program = gl.createProgram() as WebGLProgram;
		compiledShaders.forEach((shader) => gl.attachShader(program, shader));
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw new Error(gl.getProgramInfoLog(program) || "compileProgram() error");
		};
		compiledShaders.forEach((shader) => {
			gl.detachShader(program, shader);
			gl.deleteShader(shader);
		});
		shaders.forEach(({uniforms, attributes}) => {
			uniforms.forEach(({name}) => {
				const location = gl.getUniformLocation(program, name);
				if (location === null) {
					console.trace("location === null");
					throw 1;
				}
				this.uniforms.set(name, {value: null as any, location});
			});
			attributes.forEach(({name}) => {
				const index = gl.getAttribLocation(program, name);
				if (index === null) {
					console.trace("index === null");
					throw 1;
				}
				this.attributes.set(name, {value: null as any, index});
			});
		});
		this.program = program;
	}

	private compileShader(source: string, type: number) {
		const shader = gl.createShader(type) as WebGLShader;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error(gl.getShaderInfoLog(shader) || "compileShader() error");
		};
		return shader;
	};

	bind() {
		gl.useProgram(this.program);

		this.attributes.forEach(({value, index}) => {
			value.bind(index);
		});
		this.uniforms.forEach(({value, location}) => {
			value.bind(location);
		});
	}
}

