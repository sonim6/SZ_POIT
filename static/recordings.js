document.addEventListener("DOMContentLoaded", () => {

  //Elementy HTML selecty
  const sourceSelect = document.getElementById('sourceSelect');
  const sessionSelect = document.getElementById('sessionSelect');
  //Element HTML graf
  const chartCtx = document.getElementById('mainChart').getContext('2d');
  //Element HTML zoznam 
  const dataList = document.getElementById('dataList');

  let chart;
  
  function updateChart(data) {
    const labels = data.map((d, index) => index + 1);
    const temps = data.map(d => d.temperature);
    const hums = data.map(d => d.humidity);

    if (chart) chart.destroy();
    chart = new Chart(chartCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Teplota (°C)',
            data: temps,
            borderColor: 'red',
            fill: false
          },
          {
            label: 'Vlhkosť (%)',
            data: hums,
            borderColor: 'blue',
            fill: false
          }
        ]
      }
    });
  }
  
  //Aktualizacia grafu a zoznamu pre vypisanie novych dat
  function updateDataList(data) {
    dataList.innerHTML = '';
    if (data.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'list-group-item';
      emptyItem.textContent = 'Pre tento záznam neboli nájdené žiadne dáta.';
      dataList.appendChild(emptyItem);
      return;
    }
    
    data.forEach((point, index) => {
      const listItem = document.createElement('li');
      listItem.className = 'list-group-item'; 
      listItem.innerHTML = `
        <strong>Meranie ${index + 1}:</strong> 
        Teplota: <span class="text-danger">${point.temperature.toFixed(1)} °C</span>, 
        Vlhkosť: <span class="text-primary">${point.humidity.toFixed(1)} %</span>
      `;
      dataList.appendChild(listItem);
    });
  }

  //Funkcia pre nacitanie zaznamov z databzy alebo suboru podla vyberu uzivatela
  async function loadSessions() {
    const source = sourceSelect.value;
    //Odoslanie poziadavky na server pre ziskanie vsetkych zaznamov z vybraneho uloziska
    const res = await fetch(`/sessions?source=${source}`);
    const sessions = await res.json();
    sessionSelect.innerHTML = '<option value="">-- Vyberte záznam --</option>';
    sessions.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = `Záznam #${s}`;
      sessionSelect.appendChild(opt);
    });
    if(chart) chart.destroy();
    updateDataList([]); 
  }

  //Funkcia pre nacitanie dat z vybraneho zaznamu
  async function loadData() {
    const source = sourceSelect.value;
    const session = sessionSelect.value;
    if (!session) {
        if(chart) chart.destroy();
        updateDataList([]);
        return;
    };
    //Odoslanie poziadavky na server pre ziskanie dat z vybraneho zoznamu
    const res = await fetch(`/data?source=${source}&session=${session}`);
    const data = await res.json();
    
    //Aktualizacia grafu a zoznamu
    updateChart(data);
    updateDataList(data);  
  }

  sourceSelect.addEventListener('change', loadSessions);
  sessionSelect.addEventListener('change', loadData);

  // Načítaj pri štarte
  loadSessions();
});