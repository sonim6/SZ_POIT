from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import arduino_reader
import time



app =  FastAPI()
#inicialization of static
app.mount("/static", StaticFiles(directory="static"), name="static")
#inicialization of Jinja2 (HTML templates)
templates = Jinja2Templates(directory="templates")

"""@app.on_event("startup")
async def startup_event():
    print("APP: Spusta sa aplikacia, startujem citanie z arduina...")
    arduino_reader.start_arduino_reading()"""

"""@app.on_event("shutdown")
async def shutdown_event():
    print("APP: Vypina sa aplikacia, vypinam citanie z arduina...")
    arduino_reader.stop_arduino_reading()"""

@app.get("/")
@app.get("/home")
async def home_endpoint(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    if arduino_reader.latest_humidity is not None and arduino_reader.latest_temperature is not None:
        try:
            while True:
                await websocket.send_json({
                    "temperature": arduino_reader.latest_temperature,
                    "humidity": arduino_reader.latest_humidity 
                })
        except:
            await websocket.close()
"""@app.get("/")
async def get_data_from_arduino():
    #Reaching for global variables from arduino python part
    if arduino_reader.latest_humidity is not None and arduino_reader.latest_temperature is not None:
        return {
            "humidity": arduino_reader.latest_humidity,
            "temperature": arduino_reader.latest_temperature,
            "timestamp": time.time()
        }
    else:
        return{"message": "Zatial ziadne data z Arduina alebo chyba pri citani"}"""
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)

