document.addEventListener('DOMContentLoaded', function() {
    //Elementy HTML tlacidla 
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton'); 

    
    startButton.addEventListener('click', () => {
      //Odoslanie poziadavky pre spustenie monitorovania 
        fetch('/status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 1 })
          }).then(response => {
            if (response.ok) {
              console.log('Monitorovanie spustene');
            }
          });
    });

    stopButton.addEventListener('click', () => {
      //Odoslanie poziadavky pre zastavenie monitorovania 
        fetch('/status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 0 })
          }).then(response => {
            if (response.ok) {
              console.log('Monitorovanie zastavene');
            }
          });
    });
});