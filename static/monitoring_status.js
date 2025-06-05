document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton'); 

    startButton.addEventListener('click', () => {
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