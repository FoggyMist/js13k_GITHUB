import { gl } from "./init.js";
import { ElementBuffer, FloatMat4, FloatVec3, GLArrayBuffer, Program, Quaternion, Shader } from "./webgl.js";


const vs = new Shader(gl.VERTEX_SHADER, [
	{type: "vec4", name: "aPosition"},
	{type: "vec3", name: "aNormal"},
], [
	{type: "mat4", name: "projection"},
	{type: "mat4", name: "view"},
	{type: "mat4", name: "model"},
], `
varying vec3 normal;
varying vec3 pos;
varying vec3 viewPos;

void main() {
	gl_Position = projection * view * model * aPosition;
	pos = aPosition.xyz;
	viewPos = (model * aPosition).xyz;
	normal = mat3(model) * aNormal;
}
`);

const fs = new Shader(gl.FRAGMENT_SHADER, [], [
	{type: "mat4", name: "view"},
	{type: "vec3", name: "lightDir"},
	{type: "vec3", name: "color"},
	{type: "vec3", name: "shade"},
], `
varying vec3 normal;
varying vec3 pos;
varying vec3 viewPos;

void main() {
	vec3 norm = normalize(normal);
	float diffuse = dot(norm, lightDir) * 0.5;
	float ambient = 0.5;
	float light = ambient + diffuse;
	float p = 4.0;
	vec3 one = vec3(1.0, 1.0, 1.0);
	vec3 pVec = p * one;
	vec3 a = pow(abs(pos), pVec);
	float sum = dot(a, one);
	float pNorm = pow(sum, 1.0 / p);

	vec3 c = color * shade * (1.0 - 0.15 * pow(pNorm, 4.0));
	gl_FragColor = vec4(c * light, 1.0);
}
`);

const normals = new GLArrayBuffer(new Float32Array([
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
]), 3, gl.FLOAT);


export class Cube {
	static readonly positions = new GLArrayBuffer(new Float32Array([
		1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1,
	]), 3, gl.FLOAT);
	static readonly program = new Program([vs, fs]);
	static readonly indices = new ElementBuffer(new Uint16Array([
		0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
	]));
	
	readonly modelView = new FloatMat4();

	constructor(
		readonly position: FloatVec3,
		readonly color = new FloatVec3(1.0, 1.0, 1.0),
		public shade = 1,
		readonly rotation = new Quaternion(0, 0, 0, 1),
		readonly scale = new FloatVec3(0.5, 0.5, 0.5),
	) {

	}
}

Cube.program.attributes.get('aPosition')!.value = Cube.positions;
Cube.program.attributes.get('aNormal')!.value = normals;

Cube.program.uniforms.get('model')!.value = new FloatMat4();
