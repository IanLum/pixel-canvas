import sqlite3

con = sqlite3.connect("test.db")
cursor = con.cursor()

# cursor.execute("""DROP TABLE IF EXISTS pixels""")

# cursor.execute(
#     """CREATE TABLE pixels (
#             x INTEGER,
#             y INTEGER,
#             color TEXT,
#             PRIMARY KEY (x, y)
#         ) STRICT;"""
# )

# cursor.execute("""INSERT INTO pixels VALUES (0,0, "#000000")""")
# cursor.execute("""INSERT INTO pixels VALUES (0,1, "#000000")""")
# cursor.execute("""INSERT INTO pixels VALUES ("1",0, "#000000")""")

# con.commit()

data = cursor.execute("""SELECT color FROM pixels WHERE x = 0""")
print(data.fetchall())
