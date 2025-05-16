from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import arduino_reader
import time

app =  FastAPI()



@app.on_event("startup")
async def startup_event():
    print("APP: Spusta sa aplikacia, startujem citanie z arduina...")
    arduino_reader.start_arduino_reading()

@app.on_event("shutdown")
async def shutdown_event():
    print("APP: Vypina sa aplikacia, vypinam citanie z arduina...")
    arduino_reader.stop_arduino_reading()

@app.get("/")
async def get_data_from_arduino():
    #Reaching for global variables from arduino python part
    if arduino_reader.latest_humidity is not None and arduino_reader.latest_temperature is not None:
        return {
            "humidity": arduino_reader.latest_humidity,
            "temperature": arduino_reader.latest_temperature,
            "timestamp": time.time()
        }
    else:
        return{"message": "Zatial ziadne data z Arduina alebo chyba pri citani"}

