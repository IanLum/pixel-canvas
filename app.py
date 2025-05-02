from flask import Flask, render_template, jsonify, request
import sqlite3

app = Flask(__name__)
db_file = "test.db"
CANVAS_SIZE = 32


def init_db(overwrite=False):
    with sqlite3.connect(db_file) as con:
        cursor = con.cursor()

        if overwrite:
            cursor.execute("""DROP TABLE IF EXISTS pixels""")

        cursor.execute(
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
        add_canvas_to_db("Canvas1")
        con.commit()


def add_canvas_to_db(name):
    with sqlite3.connect(db_file) as conn:
        c = conn.cursor()
        for x in range(CANVAS_SIZE):
            for y in range(CANVAS_SIZE):
                c.execute(
                    "INSERT INTO pixels (canvas, x, y, color) VALUES (?, ?, ?, ?)",
                    (name, x, y, "#FFFFFF"),
                )
        conn.commit()


def get_canvas_names():
    with sqlite3.connect(db_file) as conn:
        c = conn.cursor()
        canvases = c.execute("SELECT DISTINCT canvas FROM pixels").fetchall()
    return [canvas[0] for canvas in canvases]


@app.route("/create_canvas", methods=["POST"])
def create_canvas():
    name = request.json["name"]
    add_canvas_to_db(name)
    return "", 204


@app.route("/get_canvas_list")
def get_canvas_list():
    return jsonify({"canvases": get_canvas_names()})


@app.route("/")
def index():
    return render_template("index.html", canvas_size=CANVAS_SIZE)


@app.route("/get_pixels/<canvas_name>")
def get_pixels(canvas_name):
    with sqlite3.connect(db_file) as conn:
        c = conn.cursor()
        pixels = c.execute(
            "SELECT x, y, color FROM pixels WHERE canvas = ?", (canvas_name,)
        ).fetchall()
    return jsonify(pixels)


@app.route("/set_pixel", methods=["POST"])
def set_pixel():
    data = request.json
    canvas, x, y, color = data["currentCanvas"], data["x"], data["y"], data["color"]
    with sqlite3.connect(db_file) as conn:
        c = conn.cursor()
        c.execute(
            "REPLACE INTO pixels (canvas, x, y, color) VALUES (?, ?, ?, ?)",
            (canvas, x, y, color),
        )
        conn.commit()
    return "", 204


if __name__ == "__main__":
    init_db(overwrite=True)
    app.run(debug=True)
