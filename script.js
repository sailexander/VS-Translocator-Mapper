const canvas = document.getElementById("canvas");
const world = canvas.getContext("2d");
const coordsDiv = document.getElementById("coords");
const tooltip = document.getElementById("tooltip");
const fileInput = document.getElementById("fileInput");

let width, height;
let scale = 1, offsetX = 0, offsetY = 0;

function resize() {
    console.log("rezising...");
    width = canvas.width = canvas.parentElement.clientWidth;
    height = canvas.height = canvas.parentElement.clientHeight;
    draw();
}
window.addEventListener("resize", resize);
resize();

function worldToScreen(x, y) {
    return {
        x: width / 2 + (x + offsetX) * scale,
        y: height / 2 + (y + offsetY) * scale
    };
}
function screenToWorld(x, y) {
    return {
        x: (x - width / 2) / scale - offsetX,
        y: (y - height / 2) / scale - offsetY
    };
}

function drawAxes() {
    world.strokeStyle = "#000";
    world.lineWidth = 2;
    
    const origin = worldToScreen(0, 0);
    
    // x-axis
    world.beginPath();
    world.moveTo(0, origin.y);
    world.lineTo(width, origin.y);
    world.stroke();
    
    // y-axis
    world.beginPath();
    world.moveTo(origin.x, 0);
    world.lineTo(origin.x, height);
    world.stroke();
}

function draw() {
    world.clearRect(0, 0, width, height);
    drawAxes();
}