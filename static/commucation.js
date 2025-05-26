document.addEventListener('DOMContentLoaded', function() {
    const socket = new WebSocket("ws://localhost:8000/ws");

    // Správne získanie referencií na HTML elementy
    const tempValueElement = document.getElementById("tempValue"); // Lepší názov pre prehľadnosť
    const humValueElement = document.getElementById("humValue");   // Toto je KLÚČOVÁ OPRAVA! Pôvodne si mal opäť "tempValue"

    // Získaj kontexty pre plátna grafov
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    const humCtx = document.getElementById('humChart').getContext('2d');
    const tempGaugeCtx = document.getElementById('tempGauge').getContext('2d');
    const humGaugeCtx = document.getElementById('humGauge').getContext('2d');

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

    // Inicializácia Gauge
    // Musíme si uložiť referencie na inštancie Chart.js pre gauge, aby sme ich mohli neskôr aktualizovať
    let tempGaugeChart = createGauge(tempGaugeCtx, 0, 50, 'red'); // Predpokladaná max teplota 50
    let humGaugeChart = createGauge(humGaugeCtx, 0, 100, 'blue'); // Predpokladaná max vlhkosť 100

    // Funkcia pre vytváranie/aktualizáciu Gauge
    function createGauge(ctx, value, max, color) {
        // Zničí existujúci Chart na danom kontexte, ak existuje, predtým ako vytvoríme nový
        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy();
        }

        return new Chart(ctx, { // Vrátime inštanciu Chart, aby sme ju mohli uložiť
            type: 'doughnut',
            data: {
                labels: ['Hodnota', 'Zostatok'],
                datasets: [{
                    data: [value, max - value],
                    backgroundColor: [color, '#e9ecef'],
                    borderWidth: 0
                }]
            },
            options: {
                circumference: 180,
                rotation: 270,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }
    
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

        // 3. Aktualizácia Gauge
        // Znič starý gauge a vytvor nový s aktualizovanou hodnotou
        tempGaugeChart = createGauge(tempGaugeCtx, temperature, 50, 'red'); // Max hodnota pre teplotu
        humGaugeChart = createGauge(humGaugeCtx, humidity, 100, 'blue'); // Max hodnota pre vlhkosť

        };
});