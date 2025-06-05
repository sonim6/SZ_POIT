let isSaving = false;

document.addEventListener("DOMContentLoaded", () => {
  const saveButton = document.getElementById("saveButton");
  const storageOption = document.getElementById("storageOption");

  saveButton.addEventListener("click", () => {
    isSaving = !isSaving;

    if (isSaving) {
      const selected = storageOption.value;
      console.log(`Ukladanie spustené do: ${selected}`);
      saveButton.textContent = "Zastaviť";
      saveButton.classList.remove("btn-primary");
      saveButton.classList.add("btn-warning");

      // TODO: Spustiť ukladanie (napr. volanie API)

    } else {
      console.log("Ukladanie zastavené");
      saveButton.textContent = "Ukladať";
      saveButton.classList.remove("btn-warning");
      saveButton.classList.add("btn-primary");

      // TODO: Zastaviť ukladanie
    }
  });
});