from flask import Flask, render_template, jsonify, request
import sqlite3

app = Flask(__name__)
db_file = "test.db"
CANVAS_SIZE = 32
MAX_CANVASES = 10


def init_db(overwrite=False):
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
    with sqlite3.connect(db_file) as con:
        cur = con.cursor()
        canvases = cur.execute("SELECT DISTINCT canvas FROM pixels").fetchall()
    return [canvas[0] for canvas in canvases]


@app.route("/")
def index():
    return render_template(
        "index.html", canvas_size=CANVAS_SIZE, max_canvases=MAX_CANVASES
    )


@app.route("/create_canvas", methods=["POST"])
def create_canvas():
    name = request.json["name"]
    add_canvas_to_db(name)
    return "", 204


@app.route("/delete_canvas/<canvas_name>", methods=["DELETE"])
def delete_canvas(canvas_name):
    with sqlite3.connect(db_file) as con:
        cur = con.cursor()
        cur.execute("DELETE FROM pixels WHERE canvas = ?", (canvas_name,))
        con.commit()
    return "", 204


@app.route("/get_canvas_list")
def get_canvas_list():
    return jsonify({"canvases": get_canvas_names()})


@app.route("/get_pixels/<canvas_name>")
def get_pixels(canvas_name):
    with sqlite3.connect(db_file) as con:
        cur = con.cursor()
        pixels = cur.execute(
            "SELECT x, y, color FROM pixels WHERE canvas = ?", (canvas_name,)
        ).fetchall()
    return jsonify(pixels)


@app.route("/set_pixel", methods=["POST"])
def set_pixel():
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
    app.run(debug=True)
