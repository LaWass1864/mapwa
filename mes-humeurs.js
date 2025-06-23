document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("datePicker");
  const moodSelect = document.getElementById("moodSelector");
  const saveBtn = document.getElementById("saveMood");
  const moodHistory = document.getElementById("moodHistory");

  saveBtn.addEventListener("click", () => {
    const date = dateInput.value;
    const mood = moodSelect.value;

    if (!date || !mood) {
      alert("Merci de sélectionner une date et une humeur.");
      return;
    }

    const li = document.createElement("li");
    li.textContent = `${date} – ${mood}`;
    moodHistory.appendChild(li);

    // reset
    dateInput.value = "";
    moodSelect.value = "";
  });
});
