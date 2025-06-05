from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import arduino_reader
import asyncio


app =  FastAPI()
#inicialization of static
app.mount("/static", StaticFiles(directory="static"), name="static")
#inicialization of Jinja2 (HTML templates)
templates = Jinja2Templates(directory="templates")

#status of monitoring inicialization
status = 0

@app.on_event("startup")
async def startup_event():
    print("APP: Spusta sa aplikacia, startujem citanie z arduina...")
    arduino_reader.start_arduino_reading()

@app.on_event("shutdown")
async def shutdown_event():
    print("APP: Vypina sa aplikacia, vypinam citanie z arduina...")
    arduino_reader.stop_arduino_reading()

@app.post("/status")
async def update_status(request: Request):
    global status
    data = await request.json()
    status = data.get("status", 0)

@app.get("/")
@app.get("/home")
async def home_endpoint(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WEBSOCKET: AKTIVNY")
    try: 
          while True:
            if status == 1:
                if arduino_reader.latest_temperature is None and arduino_reader.latest_humidity is None:
                    print("WEBSOCKET: SNIMAC 0")
                    await websocket.send_json({
                        "temperature": 0,
                        "humidity": 0 
                    })
                else:
                    print("WEBSOCKET: SNIMAC 1")
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

   
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)

