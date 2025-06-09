# database_handler.py
import sqlite3
import json

#Meno SQLITE databazy
DB_NAME = "data_sessions.db"

#Inicializacia databazy
def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            data TEXT
        )
    """)
    conn.commit()
    conn.close()

#Ulozenie zaznamu dat do databazy
def insert_session(data_list):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    json_data = json.dumps(data_list)  # zoznam meraní ako JSON string
    c.execute("INSERT INTO sessions (data) VALUES (?)", (json_data,))
    conn.commit()
    conn.close()

#Ziskanie jednotlivych zaznamov databazy
def get_sessions():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT id FROM sessions")
    ids = [str(row[0]) for row in c.fetchall()]
    conn.close()
    return ids

#Ziskanie dat z konkretneho zaznamu z databazy
def get_data(session_id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT data FROM sessions WHERE id = ?", (session_id,))
    row = c.fetchone()
    conn.close()
    if row:
        return json.loads(row[0])
    return []

