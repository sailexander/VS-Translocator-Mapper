const canvas = document.getElementById("canvas");
const world = canvas.getContext("2d");
const coordsOverlay = document.getElementById("coords");
const tooltip = document.getElementById("tooltip");
const fileInput = document.getElementById("fileInput");

const gridSize = 500, mouseSelectionDistanceThreshhold = 20;
let canvasWidth, canvasHeight;
let scale = 0.05, offsetX = 0, offsetY = 0;

const Mode = {
    MOVE: "move",
    POINT: "point",
    LINE: "line"
};
let mode = Mode.MOVE;
let isDragging = false, dragStartX, dragStartY;
let tempLineStart = null;
let previewMouse = null;

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
let lines = [], points = [];
let selected = null;

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
        const position = worldToScreen(point.x, point.y);
        world.fillStyle = point.color;
        world.beginPath();
        world.arc(position.x, position.y, 6, 0, Math.PI * 2);
        world.fill();
        world.fillStyle = "black";
        world.fillText(point.name, position.x + 8, position.y);
    });

    if (mode === Mode.LINE && tempLineStart && previewMouse) {
        const start = worldToScreen(tempLineStart.x, tempLineStart.y);
        const end = worldToScreen(previewMouse.x, previewMouse.y);
        world.strokeStyle = "#888";
        world.setLineDash([5, 5]);
        world.beginPath();
        world.moveTo(start.x, start.y);
        world.lineTo(end.x, end.y);
        world.stroke();
        world.setLineDash([]);
    }
}

function importFile() { fileInput.click(); }

fileInput.addEventListener("change", event => {
    console.log("loading new file...");
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = load => {
        lines = [];
        points = [];
        load.target.result.split("\n").forEach(line => {
            const words = line.trim().split(/\s+/);
            if (words[0] === "LINE") {
                lines.push(new Line(
                    words.slice(6).join(" "), words[1], +words[2], +words[3], +words[4], +words[5]
                ));
            }
            if (words[0] === "POINT") {
                points.push(new Point(
                    words.slice(4).join(" "), words[1], +words[2], +words[3]
                ));
            }
        })
        updateSidebarLists();
        draw();
    }
    reader.readAsText(file);
});

function saveToFile() {
    let content = "";
    lines.forEach(line =>
        content += `LINE ${line.color} ${line.x1} ${line.y1} ${line.x2} ${line.y2} ${line.name}\n`
    );
    points.forEach(point =>
        content += `POINT ${point.color} ${point.x} ${point.y} ${point.name}\n`
    );
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "waypoints.txt";
    link.click();
}

function updateSidebarLists() {
    const lineList = document.getElementById("lineList");
    const pointList = document.getElementById("pointList");
    lineList.innerHTML = "";
    pointList.innerHTML = "";
    lines.forEach((line, index) => {
        const div = document.createElement("div");
        div.className = "item" + (selected?.type === "line" && selected.index === index ? " selected" : "");
        div.textContent = line.name;
        div.onclick = () => select({ type: "line", index: index });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete";
        deleteButton.textContent = "delete";
        deleteButton.onclick = event => {
            deleteLine(index);
            event.stopPropagation();
        }

        div.appendChild(deleteButton);
        lineList.appendChild(div);
    });
    points.forEach((point, index) => {
        const div = document.createElement("div");
        div.className = "item" + (selected?.type === "point" && selected.index === index ? " selected" : "");
        div.textContent = point.name;
        div.onclick = () => select({ type: "point", index: index });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete";
        deleteButton.textContent = "delete";
        deleteButton.onclick = event => {
            deletePoint(index);
            event.stopPropagation();
        }

        div.appendChild(deleteButton);
        pointList.appendChild(div);
    });
}

function select(targetObject) {
    selected = targetObject;
    console.log("selected " + selected.type + " " + selected.index);
    updateSidebarLists();
    updateSidebarEditor();
}

function updateSidebarEditor() {
    const editor = document.getElementById("editor");
    editor.innerHTML = "";
    if (!selected) return;

    const target = selected.type === "line" ? lines[selected.index] : points[selected.index];

    function field(labelText, value, callback, type = "text") {
        const label = document.createElement("label");
        label.textContent = labelText;

        const input = document.createElement("input");
        input.type = type;
        input.value = value;
        input.onclick = () => input.select();
        input.oninput = () => {
            callback(input.value);
            updateSidebarLists();
            draw();
        };

        label.appendChild(input);
        editor.appendChild(label);
    }
    console.log(target);
    if (selected.type === "line") {
        field("x1", target.x1, v => target.x1 = +v);
        field("y1", target.y1, v => target.y1 = +v);
        field("x2", target.x2, v => target.x2 = +v);
        field("y2", target.y2, v => target.y2 = +v);
    } else {
        field("x", target.x, v => target.x = +v);
        field("y", target.y, v => target.y = +v);
    }
    field("Name", target.name, v => target.name = v);
    field("Color", target.color, v => target.color = v, "color");
}

function addLine() {
    lines.push(new Line("Line " + (lines.length + 1), "ff0000", 0, 0, 0, 0));
    updateSidebarLists();
    draw();
}

function addPoint() {
    points.push(new Point("Point " + (points.length + 1), "ff0000", 0, 0));
    updateSidebarLists();
    draw();
}

function deleteLine(index) {
    if (selected && selected.type === "line" && selected.index === index) selected = null;
    lines.splice(index, 1);
    updateSidebarLists();
    updateSidebarEditor();
    draw();
}

function deletePoint(index) {
    if (selected && selected.type === "point" && selected.index === index) selected = null;
    points.splice(index, 1);
    updateSidebarLists();
    updateSidebarEditor();
    draw();
}

function clearModes() {
    console.log("clear");
    mode = Mode.MOVE;
    tempLineStart = null;
    document.getElementById("lineMode").classList.remove("activeMode");
    document.getElementById("pointMode").classList.remove("activeMode");
}

function enablePlacePoint() {
    if (mode === Mode.POINT) {
        clearModes();
    } else {
        console.log("point");
        clearModes();
        mode = Mode.POINT;
        document.getElementById("pointMode").classList.add("activeMode");
    }
}

function enablePlaceLine() {
    if (mode === Mode.LINE) {
        clearModes();
    } else {
        console.log("line");
        clearModes();
        mode = Mode.LINE;
        document.getElementById("lineMode").classList.add("activeMode");
    }
}

/**
 * @param {Line} line
 */
function isPointCloseToLine(line, pointX, pointY) {
    const start = worldToScreen(line.x1, line.y1);
    const end = worldToScreen(line.x2, line.y2);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) return;
    const scalar = ((pointX - start.x) * dx + (pointY - start.y) * dy) / lengthSquared;
    const scalarClamped = Math.max(0, Math.min(1, scalar));

    const projectedX = start.x + scalarClamped * dx;
    const projectedY = start.y + scalarClamped * dy;
    return Math.hypot(pointX - projectedX, pointY - projectedY) < mouseSelectionDistanceThreshhold;
}

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
    coordsOverlay.textContent = `X:${mousePosition.x.toFixed(0)} Y:${mousePosition.y.toFixed(0)}`;
    previewMouse = mousePosition;

    let found = false;
    lines.forEach((line, index) => {
        if (isPointCloseToLine(line, event.offsetX, event.offsetY)) {
            tooltip.style.display = "block";
            tooltip.style.left = event.offsetX + 10 + "px";
            tooltip.style.top = event.offsetY + 10 + "px";
            tooltip.textContent = line.name;
            found = true;
        }
    });
    if (!found) tooltip.style.display = "none";

    if (mode === Mode.MOVE && isDragging) {
        offsetX += (event.clientX - dragStartX) / scale;
        offsetY += (event.clientY - dragStartY) / scale;
        dragStartX = event.clientX;
        dragStartY = event.clientY;

        draw();
    } else {
        draw();
    }
});

canvas.addEventListener("wheel", event => {
    event.preventDefault();
    scale *= event.deltaY < 0 ? 1.1 : 0.9;
    console.log("scaling to " + scale);
    draw();
});

canvas.addEventListener("click", mouseEvent => {
    const clickPosition = screenToWorld(mouseEvent.offsetX, mouseEvent.offsetY);
    let newSelectedObject = null;

    points.forEach((point, index) => {
        const position = worldToScreen(point.x, point.y);
        if (Math.hypot(mouseEvent.offsetX - position.x, mouseEvent.offsetY - position.y) < mouseSelectionDistanceThreshhold) {
            console.log("selecting " + point.name);
            newSelectedObject = { type: "point", index: index };
        }
    });

    if (!newSelectedObject) lines.forEach((line, index) => {
        if (isPointCloseToLine(line, mouseEvent.offsetX, mouseEvent.offsetY)) {
            console.log("selecting " + line.name);
            newSelectedObject = { type: "line", index: index };
        }
    });

    if (newSelectedObject) {
        select(newSelectedObject);
        return;
    }

    if (mode === Mode.POINT) {
        points.push(new Point("Point " + (points.length + 1), "ff0000", clickPosition.x, clickPosition.y));
        updateSidebarLists();
        draw();
        clearModes();
    }

    if (mode === Mode.LINE) {
        if (!tempLineStart) {
            tempLineStart = clickPosition;
        } else {
            lines.push(new Line("Line " + (lines.length + 1), "ff0000", tempLineStart.x, tempLineStart.y, clickPosition.x, clickPosition.y));
            updateSidebarLists();
            draw();
            clearModes();
        }
    }
})

resize();