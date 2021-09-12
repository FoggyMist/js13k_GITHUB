import { gl } from "./init.js";
import { ElementBuffer, FloatVec3, GLArrayBuffer, Program, Shader } from "./webgl.js";

const vs = new Shader(gl.VERTEX_SHADER, [
	{type: "vec4", name: "aPosition"},
	{type: "vec3", name: "aColor"},
], [
	{type: "mat4", name: "projection"},
], `
varying vec3 color;

void main() {
	gl_Position = projection * aPosition;
	color = aColor;
}
`);

const fs = new Shader(gl.FRAGMENT_SHADER, [], [], `
varying vec3 color;

void main() {
	gl_FragColor = vec4(color, 1.0);
}
`);

const width = 40;
const height = 25;
const vertsData: number[] = [];
const angleStep = (1 / width) * Math.PI * 2;
let angle = 0;
let heightStep: number;
{
	const a = new FloatVec3(Math.sin(angle), 0, Math.cos(angle))
	const b = new FloatVec3(Math.sin(angle + angleStep), 0, Math.cos(angle + angleStep)).mulScalar(-1);
	heightStep = a.add(b).length2() * 3;
}
for (let x = 0; x < width; x++) {
	for (let y = 0; y < height; y++) {
		vertsData.push(
			Math.sin(angle + (y % 2) * angleStep / 2), 
			-heightStep * y,
			Math.cos(angle + (y % 2) * angleStep / 2), 
		);
	}
	angle += angleStep;
}

const indicesData: number[] = [];
for (let x = 0; x < width; x += 1) {
	for (let y = 1; y < height; y += 2) {
		indicesData.push(
			x * height + y - 1,
			((x + 1) % width) * height + y - 1,
			x * height + y,
			
			((x + 1) % width) * height + y - 1,
			((x + 1) % width) * height + y,
			x * height + y,

			x * height + y,
			((x + 1) % width) * height + y + 1,
			x * height + y + 1,
			
			((x + 1) % width) * height + y + 1,
			x * height + y,
			((x + 1) % width) * height + y,
		);
	}
}

const rand = () => window.crypto.getRandomValues(new Uint32Array(1))[0] / (255 * 255 * 255 * 255);

const getColor = (t: number) => {
	const cut = 0.66;
	if (t < cut) {
		t = t / cut;
		t = t * t;
		const base = [16, 16, 29];
		const target = [66, 46, 83];
		return base.map((b, i) => (b + t * (target[i] - b)) / 255);
	} else {
		t = (t - cut) / (1 - cut);
		t = t * t;
		const base = [66, 46, 83];
		const target = [144, 46, 84];
		return base.map((b, i) => (b + t * (target[i] - b)) / 255);
	}
}

const colorData: number[] = [];
for (let x = 0; x < width; x++) {
	const w = Math.sin((x / width) * 2 * Math.PI + Math.PI / 6) * 6;
	for (let y = 0; y < height; y++) {
		colorData.push(
			...getColor(1 - ((y + w) / height + rand() * 0.03) - 0.1),
		);
	}
}

export class Skybox {
	static readonly program = new Program([vs, fs]);
	static readonly indices = new ElementBuffer(new Uint16Array(indicesData));

	static readonly positions = new GLArrayBuffer(new Float32Array(vertsData), 3, gl.FLOAT);
	static readonly colors = new GLArrayBuffer(new Float32Array(colorData), 3, gl.FLOAT);

	static getColor = getColor;
}

Skybox.program.attributes.get('aPosition')!.value = Skybox.positions;
Skybox.program.attributes.get('aColor')!.value = Skybox.colors;
