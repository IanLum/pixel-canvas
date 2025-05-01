const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");

const scale = 24; // Size of each pixel
const canvasSize = 32; // Number of pixels in each dimension
canvas.width = canvasSize * scale;
canvas.height = canvasSize * scale;

const pixels = Array.from({ length: canvasSize }, () =>
    Array.from({ length: canvasSize }, () => "#ffffff")
);

let lastHover = null;

function drawPixel(x, y) {
    ctx.fillStyle = pixels[y][x];
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

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);

    if (lastHover?.x == x && lastHover?.y == y) return;

    updateHoverOutline({ x, y });
});

canvas.addEventListener("mouseleave", () => {
    updateHoverOutline(null);
});

canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);
    pixels[y][x] = colorPicker.value;
    drawPixel(x, y);
});
