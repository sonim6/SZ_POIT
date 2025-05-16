import serial as pyserial_module # <<< ZMENA: Importujeme 'serial' ako 'pyserial_module'
import time
import threading

# --- Diagnostika ---
print(f"DEBUG (arduino_reader.py - top level): Typ importovaného aliasu 'pyserial_module': {type(pyserial_module)}")
try:
    if hasattr(pyserial_module, 'Serial'):
        print(f"DEBUG (arduino_reader.py - top level): 'pyserial_module.Serial' existuje, typ: {type(pyserial_module.Serial)}")
    else:
        print(f"DEBUG (arduino_reader.py - top level): modul cez alias 'pyserial_module' NEMÁ atribút 'Serial'!")
except Exception as e_debug_top:
    print(f"DEBUG (arduino_reader.py - top level): Chyba pri zisťovaní atribútov 'pyserial_module': {e_debug_top}")
# --- Koniec diagnostiky ---


# --- Nastavenia ---
SERIAL_PORT = '/dev/ttyACM0'  # <<<---- ZMEŇ PODĽA SVOJHO PORTU!
BAUD_RATE = 9600

latest_humidity = None
latest_temperature = None
stop_reading_flag = threading.Event()
serial_thread = None

def parse_arduino_data(line):
    global latest_humidity, latest_temperature
    try:
        parts = line.split('|')
        if len(parts) == 2:
            humidity_str = parts[0].strip()
            temperature_str = parts[1].strip()
            latest_humidity = float(humidity_str)
            latest_temperature = float(temperature_str)
            return True
    except ValueError:
        pass
    except Exception:
        pass
    return False

def _continuous_read_loop():
    global latest_humidity, latest_temperature
    ser_connection = None

    print("ARDUINO_READER: Spúšťa sa slučka na čítanie dát z Arduina...")

    while not stop_reading_flag.is_set():
        try:
            # --- Diagnostika pred použitím pyserial_module.Serial ---
            print(f"DEBUG (v _continuous_read_loop pred .Serial): Typ 'pyserial_module': {type(pyserial_module)}")
            if hasattr(pyserial_module, 'Serial'):
                print(f"DEBUG (v _continuous_read_loop pred .Serial): 'pyserial_module.Serial' existuje.")
            else:
                print(f"DEBUG (v _continuous_read_loop pred .Serial): 'pyserial_module' NEMÁ atribút 'Serial'!")
            # --- Koniec diagnostiky ---

            # Použijeme alias 'pyserial_module'
            ser_connection = pyserial_module.Serial(SERIAL_PORT, BAUD_RATE, timeout=1) # <<< ZMENA: Používame alias
            
            # Bezpečnejší prístup k ser_connection.name
            port_name = SERIAL_PORT 
            if ser_connection and ser_connection.is_open and hasattr(ser_connection, 'name') and ser_connection.name:
                port_name = ser_connection.name
            print(f"ARDUINO_READER: Pripojené k {port_name}.")
            time.sleep(2)

            while not stop_reading_flag.is_set():
                if ser_connection and ser_connection.is_open and ser_connection.in_waiting > 0:
                    try:
                        line = ser_connection.readline().decode('utf-8').rstrip()
                        if line:
                            parse_arduino_data(line)
                    except UnicodeDecodeError:
                        pass # Ignoruj chyby dekódovania
                    except Exception: # Chyba pri čítaní z už otvoreného portu
                        break # Preruší vnútornú slučku, vonkajšia sa pokúsi znova pripojiť
                elif ser_connection and not ser_connection.is_open: # Ak sa port medzitým zatvoril
                    break # Preruší vnútornú slučku
                else: # Žiadne dáta alebo port nie je pripravený
                    time.sleep(0.1)

        except pyserial_module.SerialException as se: # <<< ZMENA: Používame alias pre typ výnimky
            print(f"ARDUINO_READER: Chyba sériového portu: {se}. Skúsim znova o 5s.")
            if ser_connection and ser_connection.is_open:
                ser_connection.close()
            ser_connection = None 
            time.sleep(5)
        except Exception as e_general: 
            print(f"ARDUINO_READER: Neočakávaná chyba v hlavnej čítacej slučke: {e_general}") 
            print(f"ARDUINO_READER: Typ chyby: {type(e_general)}") 
            print("ARDUINO_READER: Skúsim znova o 5s.")
            if ser_connection and ser_connection.is_open:
                ser_connection.close()
            ser_connection = None
            time.sleep(5)

    if ser_connection and ser_connection.is_open:
        print(f"ARDUINO_READER: Definitívne zatváram port {ser_connection.name if hasattr(ser_connection, 'name') and ser_connection.name else SERIAL_PORT}.")
        ser_connection.close()
    print("ARDUINO_READER: Slučka na čítanie dát z Arduina bola ukončená.")


def start_arduino_reading():
    global serial_thread
    if serial_thread is None or not serial_thread.is_alive():
        stop_reading_flag.clear() 
        serial_thread = threading.Thread(target=_continuous_read_loop, daemon=True)
        serial_thread.start()
        print("ARDUINO_READER: Vlákno na čítanie z Arduina bolo spustené.")
    else:
        print("ARDUINO_READER: Vlákno na čítanie už beží.")

def stop_arduino_reading():
    global serial_thread
    print("ARDUINO_READER: Prijatá požiadavka na zastavenie čítania z Arduina.")
    stop_reading_flag.set() 
    if serial_thread and serial_thread.is_alive():
        serial_thread.join(timeout=5) 
        if serial_thread.is_alive():
            print("ARDUINO_READER: Vlákno sa neukončilo v časovom limite.")
        else:
            print("ARDUINO_READER: Vlákno bolo úspešne ukončené.")
    else:
        print("ARDUINO_READER: Žiadne bežiace vlákno na ukončenie.")
    serial_thread = None