import { immovableColor, maps } from "./maps.js";
import { GrabState, State } from "./state.js";
import { FloatVec3, Quaternion } from "./webgl.js";

const rand = () => window.crypto.getRandomValues(new Uint32Array(1))[0] / (255 * 255 * 255 * 255);

const cameraMoveSpeed = 1.0;
const cameraRotSpeed = Math.PI / 6;

const clamp = (min: number, val: number, max: number) => {
    return Math.max(min, Math.min(val, max));
};

const startGrab = (state: State) => {
    const {x, z} = state.armPos;
    state.groundLevel = state.firstNonempty(x, z);
    if (state.groundLevel == -1) {
        return;
    }
    const cubeFound = state.cubesOnMap[x][state.groundLevel][z]!;
    if (state.generators.has(cubeFound) || cubeFound.color == immovableColor) {
        return;
    }

    state.neighbourLevel = state.groundLevel;
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
        for (let offsetZ = -1; offsetZ <= 1; offsetZ++) {
            const neighbourX = x + offsetX;
            const neighbourZ = z + offsetZ;
            state.neighbourLevel = Math.max(
                state.neighbourLevel, state.firstNonempty(neighbourX, neighbourZ)
            );
        } 
    } 
    state.neighbourLevel += 1; 

    state.grabRotAxis.x = Math.sin(rand() * Math.PI * 2);
    state.grabRotAxis.y = Math.sin(rand() * Math.PI * 2);
    state.grabRotAxis.z = Math.sin(rand() * Math.PI * 2);
    state.grabRotAxis.normalize();
    
    state.cubesOnMap[x][state.groundLevel][z] = null;
    state.grabbedCube = cubeFound;
    state.grabState = GrabState.Grabbing;
    updateConnectivity(state);
};

const startDrop = (state: State) => {
    const {x, z} = state.armPos;
    const firstNonempty = state.firstNonempty(x, z);
    const tooHigh = firstNonempty == state.mapSize.y - 1;
    if (tooHigh) {
        return;
    }
    state.groundLevel = firstNonempty + 1;

    state.neighbourLevel = state.groundLevel;
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
        for (let offsetZ = -1; offsetZ <= 1; offsetZ++) {
            const neighbourX = x + offsetX;
            const neighbourZ = z + offsetZ;
            state.neighbourLevel = Math.max(
                state.neighbourLevel, state.firstNonempty(neighbourX, neighbourZ)
            );
        } 
    }
    state.neighbourLevel += 1; 

    const currentRotation = state.grabbedCube!.rotation;
    const tmpRot = new Quaternion().copy(currentRotation);
    const quat = (face: FloatVec3) => {
        const begin = new FloatVec3().copy(face);
        begin.applyQuat(tmpRot);
        let maxAxis: 'x' | 'y' | 'z' = (Math.abs(begin.x) > Math.abs(begin.y)) ? 'x' : 'y';
        maxAxis = (Math.abs(begin[maxAxis]) > Math.abs(begin.z)) ? maxAxis : 'z';
        const end = new FloatVec3();
        end[maxAxis] = Math.sign(begin[maxAxis]);
        const angle = Math.acos(begin.dot(end));
        const axis = begin.cross(end).normalize();
        return new Quaternion().fromAxisAngle(axis, angle);
    };

    state.droppingRot1 = new Quaternion().copy(currentRotation);
    const q1 = quat(new FloatVec3(1, 0, 0));
    tmpRot.preMul(q1);
    const q2 = quat(new FloatVec3(0, 1, 0));
    state.droppingRot2 = new Quaternion().copy(currentRotation).preMul(q1.preMul(q2));

    state.grabState = GrabState.Dropping;
};

export const stopDrop = (state: State) => {
    state.cubesOnMap[state.armPos.x][state.groundLevel][state.armPos.z] = state.grabbedCube;
    state.grabbedCube = null;
    state.grabState = GrabState.Drop;
    updateConnectivity(state);
};

const flood = (pos: FloatVec3, state: State) => {
    const {cubesOnMap} = state;
    const begin = cubesOnMap[pos.x][pos.y][pos.z];
    if (!begin) {
        throw null;
    }
    const current = [begin];
    const visited = new Set(current);
    const color = begin?.color;

    const addNeighbour = (x: number, y: number, z: number) => {
        const neighbour = cubesOnMap[x] && cubesOnMap[x][y] && cubesOnMap[x][y][z];
        if (neighbour && !visited.has(neighbour)) {
            current.push(neighbour);
        }
    };

    while (current.length > 0) {
        const cube = current.pop()!;
        if (cube.color === color) {
            visited.add(cube);
            const {x, y, z} = cube.position;
            addNeighbour(x + 1, y, z);
            addNeighbour(x - 1, y, z);
            addNeighbour(x, y + 1, z);
            addNeighbour(x, y - 1, z);
            addNeighbour(x, y, z + 1);
            addNeighbour(x, y, z - 1);
        }
    }
    return visited;
};

const exitMap = () => {
    const overlay = document.getElementById("overlay")!.classList;
    if (overlay.contains("game")) {
        overlay.remove("game");
        overlay.add("level");
        document.exitPointerLock();
    }
};

export const updateConnectivity = (state: State) => {
    const {connectedCubes, fullyConnectedCubes, generators, generatorCount} = state;
    connectedCubes.clear();
    fullyConnectedCubes.clear();


    const fullyConnectedColors = new Set<FloatVec3>();
    generators.forEach(({position, color}) => {
        let connectedGenerators = 0;
        const visited = flood(position, state);
        generators.forEach((generator) => {
            if (visited.has(generator)) {
                connectedGenerators += 1;
            }
        });
        if (connectedGenerators == generatorCount.get(color)) {
            fullyConnectedColors.add(color);
            visited.forEach((cube) => {
                fullyConnectedCubes.add(cube);
            });
        } else {
            visited.forEach((cube) => {
                if (!generators.has(cube)) {
                    connectedCubes.add(cube);
                }
            });
        }
    });
    if (fullyConnectedColors.size === generatorCount.size) {
        document.getElementById("level-" + maps.currentId)!.classList.add("done");
        exitMap();
    }
};

export const handleActions = (
    state: State,
    codes: Iterable<string>,
) => {
    const movement = [
        () => state.targetArmPos.z = clamp(0, state.targetArmPos.z - 1, state.mapSize.z - 1),
        () => state.targetArmPos.x = clamp(0, state.targetArmPos.x - 1, state.mapSize.x - 1),
        () => state.targetArmPos.z = clamp(0, state.targetArmPos.z + 1, state.mapSize.z - 1),
        () => state.targetArmPos.x = clamp(0, state.targetArmPos.x + 1, state.mapSize.x - 1),
    ];

    const rotate = (x: number) => ((x % 4 ) + 4 ) % 4;
    const angleStep = Math.round(state.camRot / cameraRotSpeed / 3);

    for (const code of codes) {
        switch (code) {
            case "Escape":
            case "Backspace": {
                exitMap();
            } break;
            case 'KeyW': {
                state.targetCamPos.y -= cameraMoveSpeed;
            } break;
            case 'KeyS': {
                state.targetCamPos.y += cameraMoveSpeed;
            } break;
            case 'KeyA': {
                state.targetCamRot = state.targetCamRot + cameraRotSpeed;
            } break;
            case 'KeyD': {
                state.targetCamRot = state.targetCamRot - cameraRotSpeed;
            } break;
            case 'Space': {
                state.armPos.x = state.targetArmPos.x;
                state.armPos.z = state.targetArmPos.z;
                switch (state.grabState) {
                    case GrabState.Drop: {
                        startGrab(state);
                    } break;
                    case GrabState.Grabbing: {
                        state.grabState = GrabState.Dropping;
                    } break;
                    case GrabState.Grab: {
                        startDrop(state);
                    } break;
                    case GrabState.Dropping: {
                        state.grabState = GrabState.Grabbing;
                    } break;
                }
            } break;
        }
        let hasMovedArm = false;
        switch (code) {
            case "ArrowRight":
            case "KeyL": {
                movement[rotate(3 - angleStep)]();
                hasMovedArm = true;
            } break;
            case "ArrowLeft":
            case "KeyJ": {
                movement[rotate(1 - angleStep)]();
                hasMovedArm = true;
            } break;
            case "ArrowDown":
            case "KeyK": {
                movement[rotate(2 - angleStep)]();
                hasMovedArm = true;
            } break;
            case "ArrowUp":
            case "KeyI": {
                movement[rotate(0 - angleStep)]();
                hasMovedArm = true;
            } break;
        }
        if (hasMovedArm && state.grabbedCube) {
            if (state.grabState == GrabState.Dropping) {
                state.grabbedCube.position.y = state.groundLevel;
            }
            if (state.grabState == GrabState.Grabbing) {
                state.grabbedCube.position.y = state.grabHeight;
            }
        }
    }
    if (state.targetCamRot > Math.PI) {
        state.targetCamRot -= 2 * Math.PI;
        state.camRot -= 2 * Math.PI;
    }
    if (state.targetCamRot < -Math.PI) {
        state.targetCamRot += 2 * Math.PI;
        state.camRot += 2 * Math.PI;
    }
    state.targetCamPos.y = clamp(-state.mapSize.y, state.targetCamPos.y, 0);
};