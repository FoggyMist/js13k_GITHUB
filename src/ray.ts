import { gl } from "./init.js";
import { Program, Shader } from "./webgl.js";
import { Skybox } from "./skybox.js";


const vs = new Shader(gl.VERTEX_SHADER, [
	{type: "vec4", name: "aPosition"},
], [
	{type: "mat4", name: "projectionView"},
	{type: "mat4", name: "model"},
], `

void main() {
	gl_Position = projectionView * model * aPosition;
}
`);

const fs = new Shader(gl.FRAGMENT_SHADER, [], [
	{type: "vec4", name: "color"},
], `

void main() {
	gl_FragColor = color;
}
`);

export class Ray {
	static readonly program = new Program([vs, fs]);
	static readonly indices = Skybox.indices;
}

Ray.program.attributes.get('aPosition')!.value = Skybox.positions;
