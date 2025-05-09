const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const canvasButtons = document.getElementById("canvasButtons");
const deleteButton = document.getElementById("deleteButton");
const addButton = document.getElementById("addButton");

const scale = 20; // Size of each pixel
const canvasSize = parseInt(canvas.dataset.size);
const maxCanvases = parseInt(canvas.dataset.maxCanvases);
canvas.width = canvasSize * scale;
canvas.height = canvasSize * scale;

// Local array to store canvas names
canvases = [];
// Local array to store pixel colors
pixels = Array.from({ length: canvasSize }, () =>
    Array.from({ length: canvasSize }, () => "")
);
currentCanvas = null;
lastHover = null;

// region: Canvases

/**
 * Fetch canvas names, load pixels of the first canvas, creates canvas buttons
 */
function initCanvases() {
    fetch("/get_canvas_list")
        .then((res) => res.json())
        .then((data) => {
            canvases = data.canvases;
            currentCanvas = canvases[0];
            canvases.forEach((name) => createCanvasButton(name));
            // Activate the first canvas
            canvasButtons.querySelector("button").click();
            setButtonGreyed(deleteButton, canvases.length <= 1);
            setButtonGreyed(addButton, canvases.length >= maxCanvases);
        });
}

/**
 * Called when the "Add Canvas" button is clicked. Prompts the user for a
 * canvas name, initializes a new canvas in the database, and creates a
 * button for it. If the maximum number of canvases is reached, alerts the user.
 */
function createCanvas() {
    if (canvases.length >= maxCanvases) {
        alert(`Maximum number of canvases (${maxCanvases}) reached.`);
        return;
    }
    let name = null;
    // Keep prompting until a unique name is entered or the user cancels
    while (true) {
        name = prompt("Canvas name?");
        if (!name) return;
        if (!canvases.includes(name)) {
            break;
        }
        alert(`A canvas with the name "${name}" already exists.`);
    }

    fetch("/create_canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    }).then(() => {
        let button = createCanvasButton(name);
        canvases.push(name);

        // Activate the new canvas
        button.click();

        // Ungrey delete button
        setButtonGreyed(deleteButton, false);

        // Check to grey out add button
        if (canvases.length >= maxCanvases) setButtonGreyed(addButton, true);
    });
}

/**
 * Called when the "Delete Canvas" button is clicked. Prompts the user for
 * confirmation, deletes the canvas from the database, and removes the button.
 * If only one canvas remains, alerts the user that it cannot be deleted.
 */
function deleteCanvas() {
    if (canvases.length === 1) {
        alert("Cannot delete the last canvas.");
        return;
    }
    if (confirm(`Delete canvas "${currentCanvas}"?`)) {
        fetch(`/delete_canvas/${currentCanvas}`, { method: "DELETE" }).then(
            () => {
                // Get active button
                const activeButton = [...canvasButtons.children].find(
                    (b) => b.textContent === currentCanvas
                );
                // Active the previous canvas button if it exists, otherwise the next one
                const nextButton =
                    activeButton.previousElementSibling ??
                    activeButton.nextElementSibling;

                // Remove active button
                activeButton.remove();
                canvases = canvases.filter((c) => c !== currentCanvas);

                // Active next button
                nextButton.click();

                // Ungrey add button
                setButtonGreyed(addButton, false);

                // Check to grey out delete button
                if (canvases.length === 1) setButtonGreyed(deleteButton, true);
            }
        );
    }
}

/**
 * Grey or ungrey a given button
 * @param {HTMLButtonElement} button The button to grey or ungrey
 * @param {boolean} greyed Whether to grey the button or not
 */
function setButtonGreyed(button, greyed) {
    if (greyed) {
        button.style.backgroundColor = "grey";
    } else {
        button.style.backgroundColor = "";
    }
}

// region: Canvas Buttons

/**
 * Create a new canvas button and add it to the canvas buttons container.
 * @param {string} name The name of the canvas to create a button for
 */
function createCanvasButton(name) {
    const button = document.createElement("button");
    button.textContent = name;
    button.onclick = () => {
        currentCanvas = name;
        loadPixels(name);
        highlightButton(button);
    };
    button.ondblclick = () => {
        const newName = prompt("Rename canvas:", name);
        if (!newName) return;
        if (canvases.includes(newName)) return alert("Invalid name.");

        fetch("/rename_canvas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ current_name: name, new_name: newName }),
        }).then(() => {
            button.textContent = newName;
            canvases[canvases.indexOf(name)] = newName;
            if (currentCanvas === name) currentCanvas = newName;
            name = newName;
        });
    };
    canvasButtons.appendChild(button);
    return button;
}

/**
 * Unhighlight all buttons and highlight the selected button
 * @param {HTMLButtonElement} button The button to highlight
 */
function highlightButton(button) {
    // Unhighlight all buttons
    canvasButtons.querySelectorAll("button").forEach((b) => {
        b.style.backgroundColor = "";
        b.style.fontWeight = "normal";
    });

    // Highlight the selected button
    button.style.backgroundColor = "lightblue";
    button.style.fontWeight = "bold";
}

// region: Drawing

/**
 * Fetch pixels for a given canvas and draw them on the canvas
 * @param {string} name The name of the canvas to load pixels from
 */
function loadPixels(name) {
    fetch(`/get_pixels/${name}`)
        .then((res) => res.json())
        .then((loadPixels) => {
            for (let [x, y, color] of loadPixels) {
                drawPixel(x, y, color);
            }
        });
}

/**
 * Draw pixel at given coordinates. Use color if specified, otherwise use the
 * color from the pixels array. Color is unspecified when drawing over the
 * hover outline.
 * @param {number} x X coordinate of the pixel
 * @param {number} y Y coordinate of the pixel
 * @param {string} color Color of the pixel (optional)
 */
function drawPixel(x, y, color = null) {
    if (color) {
        pixels[y][x] = color;
        ctx.fillStyle = color;
    } else {
        ctx.fillStyle = pixels[y][x];
    }
    ctx.fillRect(x * scale, y * scale, scale, scale);
}

/**
 * Update the hover outline on the canvas. Draw over the last hover pixel to
 * remove the outline, then draw a new outline at the given point.
 * @param {{x: number, y: number} | null} point The point to draw the hover
 * outline at or null to remove the outline
 */
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

// region: Event Listeners

/**
 * Event listener for when mouse is moved within canvas. Updates the hover
 * outline to the pixel under the mouse cursor. Only updates if the mouse is
 * over a different pixel than the last hover pixel.
 */
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);

    // Only update hover outline if the mouse is over a different pixel
    // and the pixel is within the canvas bounds
    if (
        (lastHover?.x == x && lastHover?.y == y) ||
        x < 0 ||
        y < 0 ||
        x >= canvasSize ||
        y >= canvasSize
    )
        return;

    updateHoverOutline({ x, y });
});

/**
 * Event listener for when the mouse leaves the canvas. Removes the hover
 * outline.
 */
canvas.addEventListener("mouseleave", () => {
    updateHoverOutline(null);
});

/**
 * Event listener for when the mouse is clicked on the canvas. Sets the
 * pixel color in the database and draws the pixel on the canvas.
 */
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

// region: Executed Code

initCanvases();
