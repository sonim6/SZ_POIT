document.addEventListener('DOMContentLoaded', function()
{
    const socket = new WebSocket("ws://localhost:8000/ws");
    const temp = document.getElementById("tempValue");
    const humidity = document.getElementById("tempValue");

    socket.onmessage = function(event){
        const data = JSON.parse(event.data);
        temp.innerText = data.temperature;
        temp.innerText = data.humidity;
    };

    socket.onopen = function() {
        console.log("✅ Pripojené");
    };

    socket.onclose = function() {
        console.log("❌ Odpojené");
    };
})