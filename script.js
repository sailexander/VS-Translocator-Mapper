const canvas = document.getElementById("canvas");
const world = canvas.getContext("2d");
const coordsOverlay = document.getElementById("coords");
const tooltip = document.getElementById("tooltip");
const fileInput = document.getElementById("fileInput");

let canvasWidth, canvasHeight, gridSize = 500;
let scale = 0.1, offsetX = 0, offsetY = 0;

const Mode = {
    MOVE: "move",
    POINT: "point",
    LINE: "line"
};
let mode = Mode.MOVE;
let isDragging = false, dragStartX, dragStartY;

let lines = [], points = [];
class Line {
    constructor(name, color, x1, y1, x2, y2) {
        this.name = name;
        this.color = color;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
}
class Point {
    constructor(name, color, x, y) {
        this.name = name;
        this.color = color;
        this.x = x;
        this.y = y;
    }
}

function resize() {
    console.log("rezising...");
    canvasWidth = canvas.width = canvas.parentElement.clientWidth;
    canvasHeight = canvas.height = canvas.parentElement.clientHeight;
    draw();
}

function worldToScreen(x, y) {
    return {
        x: canvasWidth / 2 + (x + offsetX) * scale,
        y: canvasHeight / 2 + (y + offsetY) * scale
    };
}

function screenToWorld(x, y) {
    return {
        x: (x - canvasWidth / 2) / scale - offsetX,
        y: (y - canvasHeight / 2) / scale - offsetY
    };
}

function drawAxes() {
    world.strokeStyle = "#000";
    world.lineWidth = 2;

    const origin = worldToScreen(0, 0);

    // x-axis
    world.beginPath();
    world.moveTo(0, origin.y);
    world.lineTo(canvasWidth, origin.y);
    world.stroke();

    // y-axis
    world.beginPath();
    world.moveTo(origin.x, 0);
    world.lineTo(origin.x, canvasHeight);
    world.stroke();
}

function drawGrid() {
    world.strokeStyle = '#acacac';
    world.lineWidth = 1;

    const minX = -(canvasWidth / 2) / scale - offsetX;
    const maxX = (canvasWidth / 2) / scale - offsetX;
    const minY = -(canvasHeight / 2) / scale - offsetY;
    const maxY = (canvasHeight / 2) / scale - offsetY;

    for (let x = Math.floor(minX / gridSize) * gridSize; x <= maxX; x += gridSize) {
        const position = worldToScreen(x, 0);
        world.beginPath();
        world.moveTo(position.x, 0);
        world.lineTo(position.x, canvasHeight);
        world.stroke();
    }

    for (let y = Math.floor(minY / gridSize) * gridSize; y <= maxY; y += gridSize) {
        const position = worldToScreen(0, y);
        world.beginPath();
        world.moveTo(0, position.y);
        world.lineTo(canvasWidth, position.y);
        world.stroke();
    }
}

function draw() {
    world.clearRect(0, 0, canvasWidth, canvasHeight);
    drawGrid();
    drawAxes();

    lines.forEach(line => {
        const start = worldToScreen(line.x1, line.y1);
        const end = worldToScreen(line.x2, line.y2);

        world.strokeStyle = line.color;
        world.lineWidth = 2;
        world.beginPath();
        world.moveTo(start.x, start.y);
        world.lineTo(end.x, end.y);
        world.stroke();
    });

    points.forEach(point => {
        console.log(point.name);
        const position = worldToScreen(point.x, point.y);
        console.log(position);
        world.fillStyle = point.color;
        world.beginPath();
        world.arc(position.x, position.y, 6, 0, Math.PI * 2);
        world.fill();
        world.fillStyle = "black";
        world.fillText(point.name, position.x + 8, position.y);
    });
}

function importFile() { fileInput.click(); }

fileInput.addEventListener("change", event => {
    console.log("loading new file...");
    const file = event.target.files[0];
    if (!file) return;

    console.log(file);
    const reader = new FileReader();
    reader.onload = load => {
        lines = [];
        points = [];
        load.target.result.split("\n").forEach(line => {
            console.log("line");
            const words = line.trim().split(/\s+/);
            if (words[0] === "LINE") {
                lines.push( new Line(
                    words.slice(6).join(" "), words[1], +words[2], +words[3], +words[4], +words[5]
                ));
            }
            if (words[0] === "POINT") {
                points.push (new Point(
                    words.slice(4).join(" "), words[1], +words[2], +words[3]
                ));
            }
        })
        draw();
    }
    reader.readAsText(file);
})

window.addEventListener("resize", resize);

canvas.addEventListener("mousedown", event => {
    if (mode === Mode.MOVE) {
        isDragging = true;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
    }
});

canvas.addEventListener("mouseup", () => isDragging = false);

canvas.addEventListener("mouseleave", () => isDragging = false);

canvas.addEventListener("mousemove", event => {
    const mousePosition = screenToWorld(event.offsetX, event.offsetY);
    coordsOverlay.textContent = `X:${mousePosition.x.toFixed(2)} Y:${mousePosition.y.toFixed(2)}`;

    if (mode === Mode.MOVE && isDragging) {
        offsetX += (event.clientX - dragStartX) / scale;
        offsetY += (event.clientY - dragStartY) / scale;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        
        draw();
    }
});

canvas.addEventListener("wheel", event => {
    event.preventDefault();
    scale *= event.deltaY < 0 ? 1.1 : 0.9;
    console.log("scaling to " + scale);
    draw();
})

resize();