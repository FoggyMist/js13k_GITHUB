import { canvas, gl } from "./init.js";
import { stopDrop } from "./logic.js";
import { activeColorShades, disconnectedShade, generatorShade, connectedShade } from "./maps.js";
import { Cube } from "./cube.js";
import { Ray } from "./ray.js";
import { Skybox } from "./skybox.js";
import { GrabState, State } from "./state.js";
import { FloatMat4, FloatVec3, FloatVec4, Quaternion } from "./webgl.js";

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

export const projection = new FloatMat4();
const rotatedProjection = new FloatMat4();
const view = new FloatMat4();
const projectionView = new FloatMat4();
const offsetVec = new FloatVec3();
const offsetMat = new FloatMat4();
const lightDir = new FloatVec3(-5, 6, -2).normalize();
const lightColor = new FloatVec3(1, 1, 1).normalize();

const noRotation = new Quaternion(0, 0, 0, 1);
const rotateAxis = new FloatVec3(0, 1, 0);
const lookDown = new Quaternion().fromAxisAngle(new FloatVec3(1, 0, 0), Math.PI / 6);

Skybox.program.uniforms.get("projection")!.value = rotatedProjection;

const rayModel = new FloatMat4();
Ray.program.uniforms.get("model")!.value = rayModel;
const rayColor = new FloatVec4(0.8, 1, 0.9, 0.5)
Ray.program.uniforms.get("color")!.value = rayColor;
Ray.program.uniforms.get("projectionView")!.value = projectionView;

Cube.program.uniforms.get("projection")!.value = projection;
Cube.program.uniforms.get("view")!.value = view;
Cube.program.uniforms.get("lightDir")!.value = lightDir;
const cubeColor = new FloatVec3();
Cube.program.uniforms.get("color")!.value = cubeColor;
const cubeShade = new FloatVec3();
Cube.program.uniforms.get("shade")!.value = cubeShade;


const drawCubes = (cubes:Cube[] | Set<Cube>) => {
    const {program, indices} = Cube;
    program.uniforms.get("color")!.value = lightColor;
    const {location: modelViewLocation} = program.uniforms.get("model")!;
    const {location: colorLocation} = program.uniforms.get("color")!;
    const {location: shadeLocation} = program.uniforms.get("shade")!;

    program.bind();
    indices.bind();

    cubes.forEach(({modelView, position, rotation, scale, color, shade}) => {
        {
            modelView.compose(position, rotation, scale);
            modelView.bind(modelViewLocation);
            color.bind(colorLocation);
            cubeShade.x = cubeShade.y = cubeShade.z = shade;
            cubeShade.bind(shadeLocation);
        }
        
        indices.use(gl.TRIANGLES);
    });

    cubeShade.x = cubeShade.y = cubeShade.z = 1.5;
    cubeShade.bind(shadeLocation);
};

const drawBase = (mapSize: FloatVec3) => {
    const {program, indices} = Cube;
    program.uniforms.get("color")!.value = new FloatVec3(94 / 255, 90 / 255, 123 / 255);
    const mat = program.uniforms.get("model")!.value as FloatMat4;
    const scale = new FloatVec3().copy(mapSize).mulScalar(0.5);
    scale.x += 0.1;
    scale.z += 0.1;
    scale.y = 15;
    const pos = new FloatVec3().copy(mapSize).mulScalar(0.5);
    pos.x -= 0.5;
    pos.z -= 0.5;
    pos.y = -15.5;
    mat.compose(pos, noRotation, scale);
    program.bind();
    indices.bind();
    indices.use(gl.TRIANGLES);
};

const drawSkybox = () => {
    const {program, indices} = Skybox;
    program.bind();
    indices.bind();
    gl.disable(gl.DEPTH_TEST);    
    indices.use(gl.TRIANGLES);
    gl.enable(gl.DEPTH_TEST);
};

const rand = () => window.crypto.getRandomValues(new Uint32Array(1))[0] / (255 * 255 * 255 * 255);

class Particle {
    readonly modelView = new FloatMat4();

    readonly velocity = new FloatVec3();
    readonly scale = new FloatVec3(0.3 + rand(), 0.3 + rand(), 0.3 + rand()).mulScalar(0.15);
    readonly acceleration = new FloatVec3();
    rotationAxis = new FloatVec3();
    rotationAngle = rand();
    torque = 0;
    readonly position = new FloatVec3();


    step(delta: number) {
        this.rotationAngle += this.torque * delta;

        if (this.position.y < -80) {
            this.scale.x += rand() * 0.15 * delta;
            this.scale.y += rand() * 0.15 * delta;
            this.scale.z += rand() * 0.15 * delta;
        }

        this.velocity.add(new FloatVec3().copy(this.acceleration).mulScalar(delta));
        this.position.add(new FloatVec3().copy(this.velocity).mulScalar(delta));
    }

    updateAsteroid() {
        if (this.position.y > 30) {
            this.initAsteroid();
        }
        const rot = new Quaternion().fromAxisAngle(this.rotationAxis, this.rotationAngle);
        this.modelView.compose(this.position, rot, this.scale);
    }

    initAsteroid() {
        this.rotationAxis.x = rand() * 0.5 - 0.25;
        this.rotationAxis.y = rand() * 0.5 - 0.25;
        this.rotationAxis.z = rand() * 0.5 - 0.25;
        this.rotationAxis.normalize();
        this.torque = 0.1 + rand() * 0.8;
    
        const rot = new Quaternion().fromAxisAngle(new FloatVec3(0, 1, 0), rand() * 2 * Math.PI);
        this.position.x = 20 + rand() * 20;
        this.position.y = -90 - rand() * 10;
        this.position.applyQuat(rot);  
        
        this.acceleration.x = (rand() - 0.5) * 0.005;
        this.acceleration.y = 0.03 + rand() * 0.22;
        this.acceleration.z = (rand() - 0.5) * 0.01;
        this.acceleration.applyQuat(rot);  

        this.velocity.copy(this.acceleration).mulScalar(50);

        this.scale.mulScalar(0);

        return this;
    }
}



const asteroids: Particle[] = [];
for (let a = 0; a < 100; a++) {
    const asteroid = new Particle().initAsteroid();
    asteroids.push(asteroid);
}

const drawParticles = (particles: Particle[]) => {
    const {program, indices} = Cube;
    program.uniforms.get("color")!.value = lightColor;
    cubeShade.x = cubeShade.y = cubeShade.z = 1;

    program.bind();
    indices.bind();

    particles.forEach((x) => {
        x.updateAsteroid();
        const {location} = program.uniforms.get("model")!;
        x.modelView.bind(location);
        indices.use(gl.TRIANGLES);
    });
}

const drawArm = (state: State) => {
    const {armPos, armRadius} = state;
    const {program, indices} = Ray;
    const scale = new FloatVec3(armRadius, 20, armRadius);
    rayModel.compose(armPos, noRotation, scale);
    program.bind();
    indices.bind();
    gl.enable(gl.BLEND);
    gl.cullFace(gl.FRONT);
    indices.use(gl.TRIANGLES);
    gl.disable(gl.BLEND);
    gl.cullFace(gl.BACK);
};

const draw = (
    state: State,
) => {
    const {camPos, camRot, mapSize, cubes, generators, armPos} = state;
    const rot = new Quaternion().fromAxisAngle(rotateAxis, camRot).preMul(lookDown);

    offsetVec.x = armPos.x;
    offsetVec.z = armPos.z;
    offsetMat.compose(offsetVec.mulScalar(-1), noRotation);
    view.compose(camPos, rot).mul(offsetMat);
    projectionView.copy(view).preMul(projection);
    rotatedProjection.compose(new FloatVec3(), rot).preMul(projection);

    canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	gl.viewport(0, 0, canvas.width, canvas.height);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawSkybox();
	gl.clear(gl.DEPTH_BUFFER_BIT);
    if (mapSize.x) {
        drawBase(mapSize);
        drawCubes(cubes);
        drawCubes(generators);
    }
    drawParticles(asteroids);
    drawArm(state);
};

const interpolate = (source: number, target: number) => {
    const delta = target - source;
    return (Math.abs(delta) < 0.05) ? target : source + 0.5 * delta;
}

export const animate = (
    delta: number,
    time: number,
    state: State,
) => {
    asteroids.forEach((x) => x.step(delta));
    const {cubes, generators, connectedCubes, fullyConnectedCubes, targetArmPos, camPos, targetCamPos, camRot, targetCamRot, droppingRot2, droppingRot1, grabbedCube, neighbourLevel, groundLevel, grabState, armPos, grabHeight, grabRotAxis} = state;

    if (grabbedCube) {
        const rotSpeed = 2;
        const grabTime = 1 / 0.2;
        const oldT = (grabbedCube.position.y - groundLevel) / (grabHeight - groundLevel);
        const deltaT = (grabState == GrabState.Dropping) ? -grabTime * delta : grabTime * delta;
        const newT = Math.max(0, Math.min(1, oldT + deltaT));
    
        { // animate arm/ray radius
            const grabRadius = 0.5;
            const dropRadius = 0.05;
            const diffRadius = grabRadius - dropRadius;
            state.armRadius = dropRadius + newT * diffRadius;
        }
    
        { // animate cube position
            const heighDiff = grabHeight - groundLevel;
            grabbedCube.position.y = groundLevel + newT * heighDiff;
        }

        // animate cube rotation
        if (grabState == GrabState.Dropping) {
            // remove rotation
            Quaternion.nlerp(
                droppingRot2, 
                droppingRot1, 
                Math.max(0, (grabbedCube.position.y - neighbourLevel) / (grabHeight - neighbourLevel)), 
                grabbedCube.rotation
            );
        } else if (grabbedCube.position.y >= neighbourLevel) {
            // add rotation
            grabbedCube.rotation.preMul(new Quaternion().fromAxisAngle(grabRotAxis, rotSpeed * delta));
        }

        if (newT == 0) {
            state.grabState = GrabState.Drop;
            grabbedCube.position.x = armPos.x;
            grabbedCube.position.z = armPos.z;    
            stopDrop(state);
        } else if (newT == 1) {
            state.grabState = GrabState.Grab;
        }
    }

    armPos.x = interpolate(armPos.x, targetArmPos.x);
    armPos.z = interpolate(armPos.z, targetArmPos.z);    
    state.camRot = interpolate(camRot, targetCamRot);
    camPos.x = interpolate(camPos.x, targetCamPos.x);
    camPos.y = interpolate(camPos.y, targetCamPos.y);
    camPos.z = interpolate(camPos.z, targetCamPos.z);

    if (state.grabbedCube) {
        const {grabbedCube, armPos} = state;
        grabbedCube.position.x = armPos.x;
        grabbedCube.position.z = armPos.z;
    }

    {
        let id = 1;
        activeColorShades.forEach((_, key) => {
            activeColorShades.set(key, 1.0 + 0.2 * Math.cos(id / 8 + time * (1 + id / 100) / 200));
            id += 1;
        });
    }

    const updateShade = (cube: Cube) => {
        const col = activeColorShades.get(cube.color);
        if (col !== undefined) {
            cube.shade = col;
        }
    };

    cubes.forEach((cube) => {
        cube.shade = disconnectedShade;
    });
    generators.forEach((cube) => {
        cube.shade = generatorShade;
    });
    connectedCubes.forEach((cube) => {
        updateShade(cube);
    });
    fullyConnectedCubes.forEach((cube) => {
        cube.shade = connectedShade;
    });

    draw(state);
}