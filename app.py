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
                x INTEGER,
                y INTEGER,
                color TEXT,
                PRIMARY KEY (x, y)
            ) STRICT;
            """
        )
        for x in range(CANVAS_SIZE):
            for y in range(CANVAS_SIZE):
                cursor.execute(
                    "INSERT OR IGNORE INTO pixels (x, y, color) VALUES (?, ?, ?)",
                    (x, y, "#FFFFFF"),
                )
        con.commit()


@app.route("/")
def index():
    return render_template("index.html", canvas_size=CANVAS_SIZE)


@app.route("/get_pixels")
def get_pixels():
    with sqlite3.connect(db_file) as conn:
        c = conn.cursor()
        pixels = c.execute("SELECT x, y, color FROM pixels").fetchall()
    return jsonify(pixels)


@app.route("/set_pixel", methods=["POST"])
def set_pixel():
    data = request.json
    x, y, color = data["x"], data["y"], data["color"]
    with sqlite3.connect(db_file) as conn:
        c = conn.cursor()
        c.execute("REPLACE INTO pixels (x, y, color) VALUES (?, ?, ?)", (x, y, color))
        conn.commit()
    return "", 204


if __name__ == "__main__":
    init_db(overwrite=True)
    app.run(debug=True)
