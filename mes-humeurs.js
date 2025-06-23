
const datePicker = document.getElementById("datePicker");
const moodSelector = document.getElementById("moodSelector");
const saveMood = document.getElementById("saveMood");
const moodHistory = document.getElementById("moodHistory");

let moods = JSON.parse(localStorage.getItem("moods")) || {};

saveMood.addEventListener("click", () => {
  const date = datePicker.value;
  const mood = moodSelector.value;

  if (!date || !mood) return alert("Complète la date et l’humeur");

  moods[date] = mood;
  localStorage.setItem("moods", JSON.stringify(moods));
  renderHistory();
});

function renderHistory() {
  moodHistory.innerHTML = "";
  Object.keys(moods).sort().forEach(date => {
    const li = document.createElement("li");
    li.textContent = `${date} : ${moods[date]}`;
    moodHistory.appendChild(li);
  });
}

renderHistory();