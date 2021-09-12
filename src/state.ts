import { Cube } from "./cube.js";
import { FloatVec3, Quaternion } from "./webgl.js";

const fillMap = ({mapSize, cubes, generators}: State) => {
    const cubesOnMap: (Cube | null)[][][] = [];
    for (let x = 0; x < mapSize.x; x++) {
        cubesOnMap.push([]);
        for (let y = 0; y < mapSize.y; y++) {
            cubesOnMap[x].push([]);
            for (let z = 0; z < mapSize.z; z++) {
                cubesOnMap[x][y].push(null);
            }
        }
    }
    const quat = new Quaternion(0, 0, 0, 1);
    const scale = new FloatVec3(0.5, 0.5, 0.5);
    const add = (cube: Cube) => {
        const {position, modelView} = cube;
        const {x, y, z} = position
        cubesOnMap[x][y][z] = cube;
        modelView.compose(position, quat, scale);
    };
    cubes.forEach(add);
    generators.forEach(add);
    return cubesOnMap;
}

export enum GrabState {
    Drop,
    Grabbing,
    Grab,
    Dropping,
}

const countGeneratorsByColor = (state: State) => {
    const count = new Map<FloatVec3, number>();
    state.generators.forEach(({color}) => {
        const c = count.get(color);
        count.set(color, (c === undefined) ? 1 : c + 1);
    });
    return count;
};

export class State {
    camRot = 0;
    targetCamRot = 0;
    readonly connectedCubes = new Set<Cube>();
    readonly fullyConnectedCubes = new Set<Cube>();
    readonly generatorCount;
    readonly camPos;
    readonly targetCamPos;

    readonly armPos;
    armRadius = 0.05;
    readonly targetArmPos: FloatVec3;

    grabbedCube: Cube | null = null;
    readonly grabRotAxis = new FloatVec3();

    grabState = GrabState.Drop;
    readonly grabHeight = this.mapSize.y + 0.5;

    droppingRot1 = new Quaternion();
    droppingRot2 = new Quaternion();

    groundLevel = 0;
    neighbourLevel = 0;

    readonly cubesOnMap;

    firstNonempty(x: number, z: number) {
        for (let y = this.mapSize.y - 1; y >= 0; y--) {
            if (this.cubesOnMap[x] && this.cubesOnMap[x][y] && this.cubesOnMap[x][y][z]) {
                return y;
            }
        }
        return -1;
    }

    constructor(
        readonly mapSize: FloatVec3,
        readonly cubes: Cube[],
        readonly generators: Set<Cube>,
    ) {
        this.generatorCount = countGeneratorsByColor(this);
        this.camPos = new FloatVec3(0, -0.5 * this.mapSize.y, -2 * Math.max(this.mapSize.x, this.mapSize.z));
        this.targetCamPos = new FloatVec3().copy(this.camPos);
        this.armPos = new FloatVec3(
            Math.round((this.mapSize.x - 1) / 2), 
            10,
            Math.round((this.mapSize.z - 1) / 2),
        );
        this.targetArmPos = Object.assign({}, this.armPos);
        this.cubesOnMap = fillMap(this);
    }
}