document.addEventListener('DOMContentLoaded', function() {
  //Elementy HTML tlacidlo a sprava pre nacitanie
  const startButton = document.getElementById('startButton');
  const loadingMessage = document.getElementById('loadingMessage');
  
  //Spracovanie poziadavky pre inicializaciu systemu a nasledne presmerovanie
  startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    loadingMessage.style.display = 'block';

    //Odoslanie poziadavky na server na inicializaciu systemu
    fetch('/start_monitoring', {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'ok' || data.status === 'already_started') {
        console.log(data.message);
        //Po uspesnom vykonani presmerujeme uzivatela na domovsku stranku
        window.location.href = '/home';
      } else {
        alert('Chyba pri inicializácii: ' + data.message);
        startButton.style.display = 'block';
        loadingMessage.style.display = 'none';
      }
    })
    .catch(error => {
      console.error('Fetch chyba:', error);
      alert('Nepodarilo sa spojiť so serverom.');
      startButton.style.display = 'block';
      loadingMessage.style.display = 'none';
    });
  });
});