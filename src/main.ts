import { canvas, gl } from "./init.js";
import { handleActions } from "./logic.js";
import { changeMap, maps } from "./maps.js";
import { animate, projection } from "./render.js";

const overlay = document.getElementById("overlay") as HTMLElement;
overlay.addEventListener("click", () => {
	document.documentElement.requestFullscreen();
	if (overlay.classList.contains("game")) {
		overlay.requestPointerLock();
	}
});
{
	const menus = ["info", "level", "credits"];
	menus.forEach((name) => {
		const elem = document.getElementById(name)!;
		elem.classList.add("button");
		elem.addEventListener("click", () => {
			overlay.classList.add(name);
		});
	});
	menus.push("game");
	const back = document.getElementById("back")!;
	back.classList.add("button");
	back.addEventListener("click", () => {
		menus.forEach((name) => {
			overlay.classList.remove(name);
		});
	});
}
const levelsList = document.getElementById("level-contents")!;
maps.list.forEach((constructor, id) => {
	const elem = document.createElement("div");
	elem.id = "level-"+id;
	elem.classList.add("button");
	elem.innerHTML = ((id + 1).toString() as any).padStart(2, (id < 5) ? "T" : "0");
	elem.addEventListener("click", () => {
		changeMap(id);
		elem.classList.add("visited");
		overlay.requestPointerLock();
		overlay.classList.add("game");
		overlay.classList.remove("level");
	});
	levelsList.appendChild(elem);
});

const resizeCanvas = () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	gl.viewport(0, 0, canvas.width, canvas.height);
	projection.perspective(
        Math.PI / 3,
		canvas.width / canvas.height,
		0.1,
		1000,
    );
};
resizeCanvas();
window.addEventListener("resize", resizeCanvas);


const currentActions = new Set<string>();
window.addEventListener("keydown", ({code}) => {
    if (code !== undefined) {
        currentActions.add(code);
    }
});
window.addEventListener("keyup", ({code}) => {
    if (code !== undefined) {
        currentActions.delete(code);
    }
});

let prevTime = performance.now();
function renderLoop(currTime: number) {
    const diffTime = (currTime - prevTime) / 1000;
	
    handleActions(maps.current, currentActions.values());
	currentActions.clear();
	animate(diffTime, currTime, maps.current);
	
    prevTime = currTime;
	requestAnimationFrame(renderLoop);
};
requestAnimationFrame(renderLoop);
