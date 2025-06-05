document.addEventListener('DOMContentLoaded', function() {
    const socket = new WebSocket("ws://localhost:8000/ws");

    //Správne získanie referencií na HTML elementy
    const tempValueElement = document.getElementById("tempValue"); // Lepší názov pre prehľadnosť
    const humValueElement = document.getElementById("humValue");   // Toto je KLÚČOVÁ OPRAVA! Pôvodne si mal opäť "tempValue"

    //Ziskanie elementov pre umiestnenie grafov
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    const humCtx = document.getElementById('humChart').getContext('2d');
    
    //Vytvorenie cifernika pre teplotu
    const tempGauge = new JustGage({
        id: "tempGauge",
        value: 0,
        min: -20,
        max: 50,
        title: "°C",
        label: "Teplota",
        levelColors: ["#00ccff", "#f9c802", "#ff0000"]
    });

    const humGauge = new JustGage({
        id: "humGauge",
        value: 0,
        min: 0,
        max: 100,
        title: "%",
        label: "Vlhkosť",
        levelColors: ["#d4f0ff", "#90caf9", "#2962ff"]
    });
    // --- Inicializácia Grafov Chart.js ---
    const tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
          labels: [], // Začni s prázdnymi lablami, budú sa plniť dynamicky
          datasets: [{
            label: 'Teplota (°C)',
            data: [], // Začni s prázdnymi dátami
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
                        unit: 'second' // Alebo 'minute' pre dlhšie intervaly
                    },
                    displayFormats: {
                        second: 'HH:mm:ss'
                    }
                }
            }
        }
      });

    const humChart = new Chart(humCtx, {
        type: 'line',
        data: {
          labels: [], // Začni s prázdnymi lablami
          datasets: [{
            label: 'Vlhkosť (%)',
            data: [], // Začni s prázdnymi dátami
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

    
    
    // Spracovanie prijatých dát z WebSockety
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        const temperature = data.temperature; // Ulož do lokálnej premennej pre ľahšie použitie
        const humidity = data.humidity;       // Ulož do lokálnej premennej pre ľahšie použitie
        
        // 1. Aktualizácia textových hodnôt
        tempValueElement.innerText = temperature + "°C";
        humValueElement.innerText = humidity + "%";
        
        // 2. Aktualizácia grafov
        const now = new Date(); // Získaj aktuálny čas pre label osi X
        const maxDataPoints = 20; // Limit pre počet dátových bodov v grafe

        // Teplotný graf
        if (tempChart.data.labels.length >= maxDataPoints) {
            tempChart.data.labels.shift();
            tempChart.data.datasets[0].data.shift();
        }
        tempChart.data.labels.push(now);
        tempChart.data.datasets[0].data.push(temperature);
        tempChart.update(); // Prekresli graf

        // Vlhkostný graf
        if (humChart.data.labels.length >= maxDataPoints) {
            humChart.data.labels.shift();
            humChart.data.datasets[0].data.shift();
        }
        humChart.data.labels.push(now);
        humChart.data.datasets[0].data.push(humidity);
        humChart.update(); // Prekresli graf

        tempGauge.refresh(temperature);
        humGauge.refresh(humidity);
    }
});