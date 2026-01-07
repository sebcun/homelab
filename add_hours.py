import sqlite3

conn = sqlite3.connect('users.db')
c = conn.cursor()

try:
    c.execute('ALTER TABLE projects ADD COLUMN hours REAL DEFAULT 0')
    conn.commit()
    print("Successfully added hours column")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")
finally:
    conn.close()