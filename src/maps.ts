import { updateConnectivity } from "./logic.js";
import { Cube } from "./cube.js";
import { State } from "./state.js";
import { FloatVec3 } from "./webgl.js";

const redColor = new FloatVec3(247 / 255, 57 / 255, 76 / 255);
const blueColor = new FloatVec3(86 / 255, 128 / 255, 235 / 255);
const greenColor = new FloatVec3(103 / 255, 189 / 255, 89 / 255);
const yellowColor = new FloatVec3(242 / 255, 226 / 255, 81 / 255);
const c1 = redColor;
const c2 = blueColor;
const c3 = greenColor;
const c4 = yellowColor;
const neutralColor = new FloatVec3(0.6, 0.6, 0.6);
export const immovableColor = new FloatVec3(0.1, 0.1, 0.1);
export const disconnectedShade = 0.55;
export const generatorShade = 1.2;
export const connectedShade = 1.4;

export const activeColorShades = new Map([
	[c1, 1.0],
	[c2, 1.0],
	[c3, 1.0],
	[c4, 1.0],
]);

const emptyMap = new State(new FloatVec3(0, 0, 0), [], new Set());

export const maps = {
	current: emptyMap,
	currentId: -1,
	list: ([
		// tutorials
		[
			[2, 1, 3],
			[
				[[1, 0, 1], c1],
			],
			[
				[[0, 0, 0], c1],
				[[0, 0, 2], c1],
			],
		],
		[
			[3, 2, 1],
			[
				[[0, 1, 0], c1],
				[[1, 0, 0], neutralColor],
			],
			[
				[[0, 0, 0], c1],
				[[2, 0, 0], c1],
			],
		],
		[
			[3, 3, 1],
			[
				[[0, 2, 0], c1],
				[[0, 1, 0], c1],
				[[2, 2, 0], c1],
				[[2, 1, 0], neutralColor],
				[[1, 0, 0], immovableColor],
			],
			[
				[[0, 0, 0], c1],
				[[2, 0, 0], c1],
			],
		],
		[
			[2, 2, 3],
			[
				[[1, 0, 1], c1],
				[[0, 0, 1], c2],
			],
			[
				[[0, 0, 0], c1],
				[[0, 0, 2], c1],
				[[1, 0, 0], c2],
				[[1, 0, 2], c2],
			],
		],
		[
			[5, 2, 1],
			[
				[[0, 1, 0], c3],
				[[4, 1, 0], c3],
			],
			[
				[[0, 0, 0], c3],
				[[2, 0, 0], c3],
				[[4, 0, 0], c3],
			],
		],
		// MJ
		[
			[4, 3, 4],
			[
				[[0, 0, 3], neutralColor],
				[[3, 0, 0], immovableColor],
				[[3, 2, 3], c2],
				[[0, 1, 0], c1],
				[[0, 1, 3], c1],
				[[3, 1, 0], c1],
				[[3, 2, 0], c1],
				[[3, 1, 3], c1],
			],
			[
				[[0, 0, 0], c1],
				[[3, 0, 3], c1],
				[[1, 0, 1], c2],
				[[2, 0, 2], c2],
			],
		],
		[
			[5, 3, 5],
			[
				[[0, 0, 0], c2],
				[[0, 1, 0], c2],
				[[4, 1, 4], c2],
				[[4, 0, 4], c4],
				[[4, 0, 0], c4],
				[[4, 1, 0], c4],
				[[0, 0, 4], c4],
				[[0, 1, 4], c4],
			],
			[
				[[0, 0, 2], c2],
				[[4, 0, 2], c2],
				[[2, 0, 0], c4],
				[[2, 0, 4], c4],
			],
		],
		// AK
		[
			[3, 3, 3],
			[
	            [[0, 0, 0], c1],
	            [[0, 1, 0], neutralColor],
	            [[2, 0, 0], c1],
	            [[2, 1, 0], c1],
	            [[2, 0, 2], c1],
	            [[0, 0, 1], immovableColor],
	            [[1, 0, 2], immovableColor],
	            [[1, 0, 0], immovableColor],
	            [[1, 1, 0], immovableColor],
			],
			[
	            [[0, 0, 2], c1],
	            [[1, 2, 0], c1],
			],
		],
		[
			[3, 3, 3],
			[
	            [[1, 0, 1], neutralColor],
            
	            [[2, 1, 0], c1],
	            [[2, 1, 1], c1],
	            [[2, 2, 0], c1],
	            [[2, 2, 1], c2],
	            [[2, 1, 2], c2],
	            [[2, 0, 1], c2],
	            [[1, 0, 0], c2],
	            [[1, 0, 2], c2],
			],
			[
	            [[2, 0, 2], c2],
	            [[0, 0, 0], c2],
	        
	            [[2, 0, 0], c1],
	            [[0, 0, 2], c1],
			],
		],
		[
			[5, 2, 5],
			[
	            [[4, 0, 0], c3],
	            [[4, 1, 0], c2],
	            [[3, 0, 0], c2],
	            [[0, 0, 1], c1],
	            [[2, 0, 1], c1],
	            [[4, 0, 1], c1], 
	            [[0, 0, 3], c2],
	            [[1, 0, 1], c2],
	            [[1, 0, 2], neutralColor],
	            [[3, 0, 3], c3],
	            [[3, 0, 4], immovableColor],
			],
			[
	            [[0, 0, 0], c1],
	            [[2, 0, 2], c1],
	        
	            [[1, 0, 0], c2],
	            [[1, 0, 3], c2],
	            [[2, 0, 3], c3],
	            [[4, 0, 4], c3],
			],
		],
		[
			[3, 3, 3],
			[
				[[0, 0, 1], immovableColor],


				[[2, 1, 0], c3],
				[[1, 1, 0], c3],
				[[1, 1, 1], c3],
	
	
				[[1, 0, 0], c1],
				[[1, 0, 1], c1],
				[[1, 0, 2], c1],
	
				
				[[2, 0, 1], c1],
				[[2, 1, 1], c1],
			],
			[
				[[0, 0, 0], c1],
				[[0, 0, 2], c1],
	
				[[2, 0, 0], c3],
				[[2, 0, 2], c3],
				[[0, 1, 1], c3],
			],
		],
		[
			[5, 3, 5],
			[
				[[0, 0, 0], immovableColor],
				[[0, 1, 0], immovableColor],
	
				[[1, 0, 0], immovableColor],
	
				[[2, 0, 0], immovableColor],
				[[2, 1, 0], immovableColor],
	
				[[3, 0, 0], immovableColor],
				[[3, 1, 0], immovableColor],
	
				[[4, 0, 0], immovableColor],
				[[4, 1, 0], immovableColor],
				[[4, 2, 0], immovableColor],
				
				[[2, 0, 2], immovableColor],
				
				[[1, 0, 2], c3],
				[[1, 0, 3], c3],
	
				[[1, 1, 1], c2],
				[[1, 2, 1], c2],
				[[1, 2, 0], c2],
				[[2, 2, 0], c2],
	
				[[4, 0, 3], c1],
				[[4, 1, 3], c1],
			],
			[
				[[1, 1, 0], c1],
				[[2, 1, 2], c1],
				
				[[3, 2, 0], c2],
				[[1, 0, 1], c2],
	
				[[0, 0, 2], c3],
				[[0, 0, 4], c3],
				[[2, 0, 3], c3],
			],
		],
		// RS
		[
			[4, 4, 4],
			[
				[[3, 0, 0], c2],
				[[3, 1, 0], c2],
				[[3, 2, 0], c2],
				[[3, 3, 0], c2],
				[[2, 0, 2], c2],
				[[0, 0, 3], c1],
				[[0, 1, 3], c1],
				[[0, 2, 3], c1],
				[[0, 3, 3], c1],
				[[1, 0, 1], c1],
			],
			[
				[[0, 0, 0], c1],
				[[1, 0, 2], c1],
				[[3, 0, 2], c1],
				[[2, 0, 1], c2],
				[[3, 0, 3], c2],
				[[0, 0, 1], c2],
			],
		],
		[
			[4, 4, 1], 
			[
				[[1, 0, 0], neutralColor],
				[[2, 0, 0], neutralColor],
				[[0, 1, 0], neutralColor],
				[[1, 1, 0], neutralColor],
				[[2, 1, 0], neutralColor],
				[[3, 1, 0], neutralColor],
				[[1, 2, 0], neutralColor],
				[[2, 2, 0], neutralColor],
				[[1, 3, 0], c1],
				[[2, 3, 0], c1],
			],
			[
				[[0, 0, 0], c1],
				[[3, 0, 0], c1],
			],
		],
		[
			[4, 4, 4],
			[
				[[1, 0, 1], c2],
				[[1, 1, 1], c2],
				[[1, 2, 1], c2],
				[[1, 3, 1], c2],
				[[2, 0, 2], c2],
				[[2, 1, 2], c2],
				[[2, 2, 2], c2],
				[[2, 3, 2], c2],
				[[1, 0, 2], c1],
				[[1, 1, 2], c1],
				[[1, 2, 2], c1],
				[[1, 3, 2], c1],
				[[2, 0, 1], c1],
				[[2, 1, 1], c1],
				[[2, 2, 1], c1],
				[[2, 3, 1], c1],
			],
			[
				[[0, 0, 0], c1],
				[[3, 3, 3], c1],
				[[3, 0, 0], c2],
				[[0, 3, 3], c2],
			],
		],
		[
			[4, 4, 2], 
			[
				[[0, 0, 0], c2],
				[[0, 1, 0], c2],
				[[0, 2, 0], c2],
				[[0, 0, 1], c2],
				[[0, 1, 1], c2],
				[[0, 2, 1], c2],
				[[1, 1, 0], c2],
				[[1, 2, 0], c2],
				[[1, 1, 1], c2],
				[[1, 2, 1], c2],
				[[2, 1, 0], c1],
				[[2, 2, 0], c1],
				[[2, 1, 1], c1],
				[[2, 2, 1], c1],
				[[3, 0, 0], c1],
				[[3, 1, 0], c1],
				[[3, 2, 0], c1],
				[[3, 0, 1], c1],
				[[3, 1, 1], c1],
				[[3, 2, 1], c1],
			],
			[
				[[1, 0, 0], c1],
				[[2, 0, 1], c1],
				[[1, 0, 1], c2],
				[[2, 0, 0], c2],
			],
		],
		[
			[4, 4, 4], 
			[
				[[0, 0, 1], c1],
				[[0, 1, 1], c1],
				[[0, 2, 1], c1],
				[[0, 0, 2], c1],
				[[0, 1, 2], c1],
				[[0, 2, 2], c1],
				[[0, 3, 2], c1],
			
				[[1, 0, 0], c3],
				[[1, 1, 0], c3],
				[[1, 2, 0], c3],
				[[1, 3, 0], c3],
				[[2, 0, 0], c3],
				[[2, 1, 0], c3],
				[[2, 2, 0], c3],
			
				[[3, 0, 1], c4],
				[[3, 1, 1], c4],
				[[3, 2, 1], c4],
				[[3, 3, 1], c4],
				[[3, 0, 2], c4],
				[[3, 1, 2], c4],
				[[3, 2, 2], c4],
			
				[[1, 0, 3], c2],
				[[1, 1, 3], c2],
				[[1, 2, 3], c2],
				[[2, 0, 3], c2],
				[[2, 1, 3], c2],
				[[2, 2, 3], c2],
				[[2, 3, 3], c2],
			],
			[
				[[0, 0, 0], c1],
				[[0, 0, 3], c2],
				[[3, 0, 0], c3],
				[[3, 0, 3], c4],
				[[2, 2, 2], c1],
				[[2, 2, 1], c2],
				[[1, 2, 2], c3],
				[[1, 2, 1], c4],
			],
		],
		[
			[4, 4, 4], 
			[
				[[0, 0, 0], immovableColor],
				[[0, 1, 0], immovableColor],
				[[0, 2, 0], immovableColor],
				[[0, 3, 0], immovableColor],
				[[0, 0, 3], immovableColor],
				[[0, 1, 3], immovableColor],
				[[0, 2, 3], immovableColor],
				[[0, 3, 3], immovableColor],
				[[3, 0, 0], immovableColor],
				[[3, 1, 0], immovableColor],
				[[3, 2, 0], immovableColor],
				[[3, 3, 0], immovableColor],
				[[3, 0, 3], immovableColor],
				[[3, 1, 3], immovableColor],
				[[3, 2, 3], immovableColor],
				[[3, 3, 3], immovableColor],
			
				[[1, 0, 1], c4],
				[[1, 1, 1], c2],
				[[1, 2, 1], neutralColor],
				[[1, 3, 1], neutralColor],
				[[1, 0, 2], c1],
				[[1, 1, 2], c3],
				[[1, 2, 2], neutralColor],
				[[1, 3, 2], neutralColor],
				[[2, 0, 1], c2],
				[[2, 1, 1], neutralColor],
				[[2, 2, 1], neutralColor],
				[[2, 3, 1], c1],
				[[2, 0, 2], c3],
				[[2, 1, 2], neutralColor],
				[[2, 2, 2], neutralColor],
				[[2, 3, 2], c4],
			],
			[
				[[1, 0, 0], c1],
				[[1, 0, 3], c1],
				[[0, 1, 2], c2],
				[[3, 1, 2], c2],
				[[2, 2, 0], c3],
				[[2, 2, 3], c3],
				[[0, 3, 1], c4],
				[[3, 3, 1], c4],
			],
		],
	] as [number[], [number[], FloatVec3][], [number[], FloatVec3][]][]).map(([[x, y, z], cubes, generators], id) => {
		const s = new FloatVec3(x, y, z);
		const c = cubes.map(([[x, y, z], color]) => new Cube(
			new FloatVec3(x, y, z), color
		));
		const g = new Set(generators.map(([[x, y, z], color]) => new Cube(
				new FloatVec3(x, y, z), color
		)));
		return () => new State(s, c, g);
	}),
};

export const changeMap = (id: number) => {
	maps.currentId = id;
	maps.current = maps.list[id]();
	if (maps.current != emptyMap) {
		updateConnectivity(maps.current);
	}
};
