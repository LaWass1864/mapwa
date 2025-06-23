document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("datePicker");
  const moodSelect = document.getElementById("moodSelector");
  const saveBtn = document.getElementById("saveMood");
  const moodHistory = document.getElementById("moodHistory");

  // Charger les humeurs depuis localStorage
  let moods = JSON.parse(localStorage.getItem("moods")) || [];

  const renderMoods = () => {
    moodHistory.innerHTML = "";
    moods.forEach(entry => {
      const li = document.createElement("li");
      li.textContent = `${entry.date} – ${entry.mood}`;
      moodHistory.appendChild(li);
    });
  };

  saveBtn.addEventListener("click", () => {
    const date = dateInput.value;
    const mood = moodSelect.value;

    if (!date || !mood) {
      alert("Merci de remplir les deux champs.");
      return;
    }

    const entry = { date, mood };
    moods.push(entry);
    localStorage.setItem("moods", JSON.stringify(moods));

    renderMoods();
    dateInput.value = "";
    moodSelect.value = "";
  });

  renderMoods(); // Affichage au chargement
});
