const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const canvasButtons = document.getElementById("canvasButtons");

const scale = 20; // Size of each pixel
const canvasSize = parseInt(canvas.dataset.size);
canvas.width = canvasSize * scale;
canvas.height = canvasSize * scale;

// Local array to store pixel colors
pixels = Array.from({ length: canvasSize }, () =>
    Array.from({ length: canvasSize }, () => "")
);
currentCanvas = null;
let lastHover = null;

function loadPixels(name) {
    fetch(`/get_pixels/${name}`)
        .then((res) => res.json())
        .then((pixels) => {
            for (let [x, y, color] of pixels) {
                drawPixel(x, y, color);
            }
        });
}

function drawPixel(x, y, color = null) {
    if (color) {
        pixels[y][x] = color;
        ctx.fillStyle = color;
    } else {
        ctx.fillStyle = pixels[y][x];
    }
    ctx.fillRect(x * scale, y * scale, scale, scale);
}

function updateHoverOutline(point) {
    if (lastHover) {
        // Draw over last hover pixel to remove the outline
        drawPixel(lastHover.x, lastHover.y);
    }
    lastHover = point;

    // Exit if no hover
    if (point == null) return;

    // Draw new hover outline
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(
        point.x * scale + 0.5,
        point.y * scale + 0.5,
        scale - 1,
        scale - 1
    );
}

function createCanvas() {
    const name = prompt("Canvas name?");
    if (!name) return;

    fetch("/create_canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    }).then(() => loadCanvasButtons());
}

function createCanvasButton(name) {
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.onclick = () => {
        currentCanvas = name;
        loadPixels(name);
    };
    canvasButtons.appendChild(btn);
}

function loadCanvasButtons() {
    fetch("/get_canvas_list")
        .then((res) => res.json())
        .then((data) => {
            canvasButtons.innerHTML = "";
            data.canvases.forEach((name) => createCanvasButton(name));
        });
}

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);

    if (
        (lastHover?.x == x && lastHover?.y == y) ||
        x >= canvasSize ||
        y >= canvasSize
    )
        return;

    updateHoverOutline({ x, y });
});

canvas.addEventListener("mouseleave", () => {
    updateHoverOutline(null);
});

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);
    // Set pixel color in db
    color = colorPicker.value;
    fetch("/set_pixel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentCanvas, x, y, color }),
    });
    drawPixel(x, y, color);
});

// Load the first canvas
fetch("/get_canvas_list")
    .then((res) => res.json())
    .then((data) => {
        currentCanvas = data.canvases[0];
        loadPixels(currentCanvas);
    });
loadCanvasButtons();
