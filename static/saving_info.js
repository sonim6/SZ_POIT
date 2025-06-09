let isSaving = false;
document.addEventListener("DOMContentLoaded", () => {
  //Elementy HTML tlacidla
  const saveButton = document.getElementById("saveButton");
  const storageOption = document.getElementById("storageOption");
  
  //Spracovanie HTTP poziadaviek pre zapis dat do databazy alebo suboru
  saveButton.addEventListener("click", () => {
    isSaving = !isSaving;
    if (isSaving) {
      const selected = storageOption.value;
      console.log(`Ukladanie spustené do: ${selected}`);
      //Odoslanie poziadavky na server pre zapis
      fetch('/start_saving', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }).then(response => {
        if (response.ok) {
          console.log('Ukladanie spustene');
        }
      });
      //Zmena stavu tlacidla
      saveButton.textContent = "Zastaviť";
      saveButton.classList.remove("btn-primary");
      saveButton.classList.add("btn-warning");

    } else {
      const selected = storageOption.value;
      console.log(`Ukladanie ukoncene do: ${selected}`);
      //Odoslanie poziadavky na server pre ulozenie
      fetch('/stop_saving', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({storage: selected})
      }).then(response => {
        if (response.ok) {
          console.log('Data ulozene');
        }
      });
      //Zmena stavu tlacidla
      saveButton.textContent = "Ukladať";
      saveButton.classList.remove("btn-warning");
      saveButton.classList.add("btn-primary");
    }
  });
});