document.addEventListener('DOMContentLoaded', function() {
    const socket = new WebSocket("ws://localhost:8000/ws");

    //Elementy HTML text
    const tempValueElement = document.getElementById("tempValue"); 
    const humValueElement = document.getElementById("humValue");  
    
    //Elementy HTML grafy
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    const humCtx = document.getElementById('humChart').getContext('2d');

    //Cifernik pre teplotu
    const tempGauge = new JustGage({
        id: "tempGauge",
        value: 0,
        min: -10,
        max: 50,
        title: "°C",
        label: "Teplota",
        levelColors: ["#00ccff", "#f9c802", "#ff0000"]
    });
    //Cifernik pre vlhkost
    const humGauge = new JustGage({
        id: "humGauge",
        value: 0,
        min: 0,
        max: 100,
        title: "%",
        label: "Vlhkosť",
        levelColors: ["#d4f0ff", "#90caf9", "#2962ff"]
    });
    //Inicializacia grafu pre teplotu
    const tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
          labels: [], 
          datasets: [{
            label: 'Teplota (°C)',
            data: [], 
            borderColor: 'red',
            tension: 0.3
          }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'second' 
                    },
                    displayFormats: {
                        second: 'HH:mm:ss'
                    }
                }
            }
        }
      });
    //Inicializacia grafu pre vlhkost
    const humChart = new Chart(humCtx, {
        type: 'line',
        data: {
          labels: [], 
          datasets: [{
            label: 'Vlhkosť (%)',
            data: [], 
            borderColor: 'blue',
            tension: 0.3
          }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'second'
                    },
                    displayFormats: {
                        second: 'HH:mm:ss'
                    }
                }
            }
        }
      });

    
    
    //Websocket spracovanie, odosielanie a prijimanie dat
    socket.onmessage = function(event) {
        //Spracovanie dat
        const data = JSON.parse(event.data);
        const temperature = data.temperature; 
        const humidity = data.humidity;       
        
        //Aktualizácia textových hodnôt
        tempValueElement.innerText = temperature + "°C";
        humValueElement.innerText = humidity + "%";
        
        //Aktualizácia grafov
        const now = new Date(); 
        const maxDataPoints = 20; 
        if (tempChart.data.labels.length >= maxDataPoints) {
            tempChart.data.labels.shift();
            tempChart.data.datasets[0].data.shift();
        }
        tempChart.data.labels.push(now);
        tempChart.data.datasets[0].data.push(temperature);
        tempChart.update(); 
        if (humChart.data.labels.length >= maxDataPoints) {
            humChart.data.labels.shift();
            humChart.data.datasets[0].data.shift();
        }
        humChart.data.labels.push(now);
        humChart.data.datasets[0].data.push(humidity);
        humChart.update(); 

        //Aktualizacia cifernikov
        tempGauge.refresh(temperature);
        humGauge.refresh(humidity);
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            //Sprava serveru pre ukoncenie aplikacie
            const stopCommand = JSON.stringify({ action: 'stop_monitoring' });
            console.log('Posielam serveru príkaz na deaktiváciu:', stopCommand);
            socket.send(stopCommand);
            socket.close();
        });
    } else {
        console.warn('Tlačidlo na zatvorenie spojenia sa v dokumente nenašlo.');
    }
    
});