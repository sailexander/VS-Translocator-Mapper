const canvas = document.getElementById("canvas");
const world = canvas.getContext("2d");
const coordsDiv = document.getElementById("coords");
const tooltip = document.getElementById("tooltip");
const fileInput = document.getElementById("fileInput");

let canvasWidth, canvasHeight, gridSize = 100;
let scale = 1, offsetX = 0, offsetY = 0;

function resize() {
    console.log("rezising...");
    canvasWidth = canvas.width = canvas.parentElement.clientWidth;
    canvasHeight = canvas.height = canvas.parentElement.clientHeight;
    draw();
}
window.addEventListener("resize", resize);
resize();

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
}