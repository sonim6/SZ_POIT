# json_handler.py
import json
import os

#Meno JSON suboru
JSON_FILE = "data_log.json"

#Ulozenie zaznamu dat do suboru
def save_session(data_list):
    with open(JSON_FILE, "a") as f:
        # Zapíšeme každý session ako jeden JSON objekt na riadok
        json.dump(data_list, f)
        f.write("\n")

#Ziskanie jednotlivych zaznamov suboru
def get_sessions():
    if not os.path.exists(JSON_FILE):
        return []
    try:
        with open(JSON_FILE, "r") as f:
            return [str(i) for i, _ in enumerate(f.readlines())]
    except Exception as e:
        print("CHYBA PRI NACITAVANI JSON SESSION:", e)
        return []

#Ziskanie dat z konkretneho zaznamu zo suboru
def get_data(index):
    with open(JSON_FILE, "r") as f:
        lines = f.readlines()
        if 0 <= int(index) < len(lines):
            return json.loads(lines[int(index)])
    return []