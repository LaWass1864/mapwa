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

// Fonction pour sauvegarder l'humeur dans localStorage
function saveMood() {
  const date = document.getElementById("datePicker").value;
  const mood = document.getElementById("moodSelector").value;

  if (!date || !mood) {
    alert("Merci de remplir les deux champs !");
    return;
  }

  // Récupération du tableau actuel ou initialisation
  const savedMoods = JSON.parse(localStorage.getItem("moodHistory")) || [];

  // Ajout de la nouvelle entrée
  savedMoods.push({ date, mood });

  // Sauvegarde dans le localStorage
  localStorage.setItem("moodHistory", JSON.stringify(savedMoods));

  // Mise à jour de l'affichage
  displayMoodHistory();
}

// Fonction pour afficher l'historique
function displayMoodHistory() {
  const moodList = document.getElementById("moodHistory");
  moodList.innerHTML = "";

  const savedMoods = JSON.parse(localStorage.getItem("moodHistory")) || [];

  savedMoods.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.date} : ${entry.mood}`;
    moodList.appendChild(li);
  });
}

// Event listener sur le bouton
document.getElementById("saveMood").addEventListener("click", saveMood);

// Charger l'historique au démarrage
document.addEventListener("DOMContentLoaded", displayMoodHistory);
