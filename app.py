from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import asyncio
import json
import os     
import signal  
import arduino_reader
from json_handler import save_session as save_json_session, get_sessions as get_json_sessions, get_data as get_json_data
from database_handler import init_db, insert_session, get_sessions as get_db_sessions, get_data as get_db_data


#Inicializacia fastapi app
app =  FastAPI()
#Inicializacia static folderu 
app.mount("/static", StaticFiles(directory="static"), name="static")

#Inicializacia JINJA 
templates = Jinja2Templates(directory="templates")

#Globalne premenne: 
#status - kontrola spustania monitorovania
STATUS = 0
#saving - kontrola spustania zapisovania dat
SAVING = False
#session_data - pomocny array pre ukladanie dat 
SESSION_DATA = []
#monnitoring_started - kontrola inicializacie systemu
MONITORING_STARTED = False

#ENDPOINTY:

#Incializacia spojenia, databazy
@app.post("/start_monitoring")
async def start_monitoring_endpoint():
    global MONITORING_STARTED
    if not MONITORING_STARTED:
        try:
            print("APP: Prijatá požiadavka na štart monitoringu...")
            init_db()
            arduino_reader.start_arduino_reading()
            MONITORING_STARTED = True
            print("APP: Monitoring úspešne spustený.")
            return JSONResponse(content={"status": "ok", "message": "Monitoring bol úspešne spustený."})
        except Exception as e:
            print(f"APP: Chyba pri inicializácii: {e}")
            return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
    else:
        print("APP: Monitoring už beží, presmerovávam.")
        return JSONResponse(content={"status": "already_started", "message": "Monitoring už bol spustený."})

#Poistka pri neocakavanom odpojeni
@app.on_event("shutdown")
async def shutting_down():
    print("APP: Vypina sa aplikacia, vypinam citanie z arduina...")
    arduino_reader.stop_arduino_reading()

#Zmena stavu monitorovania
@app.post("/status")
async def update_status(request: Request):
    global STATUS
    data = await request.json()
    STATUS = data.get("status", 0)

#Zmena stavu ukladania dat (spustenie)
@app.post("/start_saving")
async def saving_data():
    global SAVING, SESSION_DATA
    SAVING = True
    SESSION_DATA = []
    return{"message": "Ukladanie spustene"}

#Zmena stavu ukladania dat (ukoncenie)
@app.post("/stop_saving")
async def stop_saving(request: Request):
    global SAVING, SESSION_DATA
    SAVING = False
    data = await request.json()
    storage_type = data.get("storage", "db")
    print(storage_type)

    if SESSION_DATA:
        if storage_type == "db":
            insert_session(SESSION_DATA)
        elif storage_type == "json":
            save_json_session(SESSION_DATA)
    print(f"Ukladanie zastavene do {storage_type}")

#Ziskanie zaznamov z databazy alebo suboru
@app.get("/sessions")
async def get_sessions(source: str):
    if source == "db":
        return JSONResponse(content=get_db_sessions())
    elif source == "json":
        return JSONResponse(content=get_json_sessions())
    else:
        return JSONResponse(content=[], status_code=400)

#Ziskanie dat zo zaznamu z databazy alebo suboru
@app.get("/data")
async def get_session_data(source: str, session: str):
    if source == "db":
        data = get_db_data(session)
    elif source == "json":
        data = get_json_data(session)
    else:
        data = []
    return JSONResponse(content=data)  

#Spustacia stranka
@app.get("/")
async def start_page(request: Request):
    return templates.TemplateResponse("start.html", {"request": request})

#Domovska stranka
@app.get("/home")
async def home_endpoint(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})

#Vizualizacna stranka (vizualizacia zaznamenanych(ulozenych) dat)
@app.get("/recordings")
async def load_data(request:Request):
    return templates.TemplateResponse("recordings.html",{"request": request})

#Websocket komunikacia 
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WEBSOCKET: KLIENT PRIPOJENY")
    #Odosielanie dat na uzivatelsku cast
    async def sender_task():
        try: 
            while True:
                if MONITORING_STARTED and STATUS == 1:
                    temperature = arduino_reader.latest_temperature or 0
                    humidity = arduino_reader.latest_humidity or 0
                    data_point = {"temperature": temperature, "humidity": humidity}
            
                    if arduino_reader.latest_temperature is None and arduino_reader.latest_humidity is None:
                        print("WEBSOCKET: Arduino 0")
                        await websocket.send_json({
                            "temperature": 0,
                            "humidity": 0 
                        })
                    else:
                        print("WEBSOCKET: Arduino 1")

                        #Ukladanie dat
                        if SAVING:
                            SESSION_DATA.append(data_point) 
                    
                        await websocket.send_json({
                            "temperature": arduino_reader.latest_temperature,
                            "humidity":  arduino_reader.latest_humidity
                        })
                    await asyncio.sleep(1)
                else:
                    print("WEBSOCKET: PRENOS DAT POZASTAVENY!")
                    await asyncio.sleep(1)
        except:
            print("WEBSOCKET: Klient sa odpojil.")
            await websocket.close()
      
    #Prijimanie dat od uzivatela (Pripad: ukoncenie aplikacie)
    async def receiver_task():
        global MONITORING_STARTED, STATUS, SAVING, SESSION_DATA
        try:
            async for message in websocket.iter_text():
                data = json.loads(message)

                if data.get("action") == "stop_monitoring":
                    print("WEBSOCKET: Prijatý príkaz na deaktiváciu systému.")
                    if MONITORING_STARTED:
                        #Deaktivujeme systém a vynulujeme premenne
                        arduino_reader.stop_arduino_reading()
                        MONITORING_STARTED = False
                        STATUS = 0
                        SAVING = False
                        SESSION_DATA = []

                    #Ukoncenie aplikacie
                    print("WEBSOCKET: Posielam signál na ukončenie servera...")
                    os.kill(os.getpid(), signal.SIGINT)
                    break 
        except WebSocketDisconnect:
            pass
    
    #Spustenie prijimania a odosielania
    sender = asyncio.create_task(sender_task())
    receiver = asyncio.create_task(receiver_task())

    #Kontrola ukoncenia tasku
    done, pending = await asyncio.wait(
        [sender, receiver],
        return_when=asyncio.FIRST_COMPLETED,
    )
    #Ukoncenie druheho tasku
    for task in pending:
        task.cancel()
    
    print("WEBSOCKET: Spojenie sa bezpečne uzatvára.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload = True)

