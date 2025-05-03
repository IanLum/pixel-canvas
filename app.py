from flask import Flask, render_template, jsonify, request
import sqlite3
import os

app = Flask(__name__)
db_file = "pixels.db"
CANVAS_SIZE = 32
MAX_CANVASES = 10


def init_db(overwrite=False):
    """
    Initializes the database by creating a table for pixels if it doesn't exist
    and populating it with a default canvas if the table is empty.

    Args:
        overwrite (bool): If True, drops the existing table before creating a
            new one.
    """
    with sqlite3.connect(db_file) as con:
        cur = con.cursor()

        if overwrite:
            cur.execute("""DROP TABLE IF EXISTS pixels""")

        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS pixels (
                canvas TEXT,
                x INTEGER,
                y INTEGER,
                color TEXT,
                PRIMARY KEY (canvas, x, y)
            ) STRICT;
            """
        )

        # If table empty, add a default canvas
        cur.execute("""SELECT COUNT(*) FROM pixels""")
        if cur.fetchone()[0] == 0:
            add_canvas_to_db("Canvas1")

        con.commit()


def add_canvas_to_db(name):
    """
    Adds a new canvas to the database with the specified name. Initializes rows
    for all pixels, set to white.

    Args:
        name (str): The name of the canvas to be added.
    """
    with sqlite3.connect(db_file) as con:
        cur = con.cursor()
        for x in range(CANVAS_SIZE):
            for y in range(CANVAS_SIZE):
                cur.execute(
                    "INSERT OR IGNORE INTO pixels (canvas, x, y, color) VALUES (?, ?, ?, ?)",
                    (name, x, y, "#FFFFFF"),
                )
        con.commit()


def get_canvas_names():
    """
    Queries the database for the names of all canvases.

    Returns:
        list[str]: A list of canvas names.
    """
    with sqlite3.connect(db_file) as con:
        cur = con.cursor()
        canvases = cur.execute("SELECT DISTINCT canvas FROM pixels").fetchall()
    return [canvas[0] for canvas in canvases]


@app.route("/")
def index():
    """
    Renders the main page
    """
    return render_template(
        "index.html", canvas_size=CANVAS_SIZE, max_canvases=MAX_CANVASES
    )


@app.route("/create_canvas", methods=["POST"])
def create_canvas():
    """
    Endpoint to create a new canvas

    Returns:
        204 no content response
    """
    name = request.json["name"]
    add_canvas_to_db(name)
    return "", 204


@app.route("/delete_canvas/<canvas_name>", methods=["DELETE"])
def delete_canvas(canvas_name):
    """
    Endpoint to delete a canvas by its name. Arg passed in URL.

    Args:
        canvas_name (str): The name of the canvas to be deleted.

    Returns:
        204 no content response
    """
    with sqlite3.connect(db_file) as con:
        cur = con.cursor()
        cur.execute("DELETE FROM pixels WHERE canvas = ?", (canvas_name,))
        con.commit()
    return "", 204


@app.route("/rename_canvas", methods=["POST"])
def rename_canvas():
    """
    Endpoint to rename a canvas.

    Expects a JSON with:
        current_name (str): The name of the canvas to be renamed.
        new_name (str): The new name for the canvas.

    Returns:
        204 no content response
    """
    data = request.json
    current_name = data["current_name"]
    new_name = data["new_name"]
    with sqlite3.connect(db_file) as con:
        cur = con.cursor()
        cur.execute(
            "UPDATE pixels SET canvas = ? WHERE canvas = ?", (new_name, current_name)
        )
        con.commit()
    return "", 204


@app.route("/get_canvas_list")
def get_canvas_list():
    """
    Endpoint to get a list of all canvas names.

    Returns:
        JSON response with a list of canvas names.
    """
    return jsonify({"canvases": get_canvas_names()})


@app.route("/get_pixels/<canvas_name>")
def get_pixels(canvas_name):
    """
    Endpoint to get all pixels for a specific canvas. Args passed in URL.

    Args:
        canvas_name (str): The name of the canvas to get pixels for.

    Returns:
        JSON response with a list of pixels, each represented as a tuple of
        (x, y, color).
    """
    with sqlite3.connect(db_file) as con:
        cur = con.cursor()
        pixels = cur.execute(
            "SELECT x, y, color FROM pixels WHERE canvas = ?", (canvas_name,)
        ).fetchall()
    return jsonify(pixels)


@app.route("/set_pixel", methods=["POST"])
def set_pixel():
    """
    Endpoint to set a pixel's color in the database.

    Expects a JSON with:
        currentCanvas (str): The name of the canvas.
        x (int): The x-coordinate of the pixel.
        y (int): The y-coordinate of the pixel.
        color (str): The hexcode color to set the pixel to.
    """
    data = request.json
    canvas, x, y, color = data["currentCanvas"], data["x"], data["y"], data["color"]
    with sqlite3.connect(db_file) as con:
        cur = con.cursor()
        cur.execute(
            "REPLACE INTO pixels (canvas, x, y, color) VALUES (?, ?, ?, ?)",
            (canvas, x, y, color),
        )
        con.commit()
    return "", 204


if __name__ == "__main__":
    init_db(overwrite=False)
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
