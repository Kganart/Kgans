/*******************************************************
 * ps2.js
 * Using #swipeCardContainer and .swipe-card
 *******************************************************/

// 1) References to HTML elements
const regionSelectContainer = document.getElementById("regionSelectContainer");
const regionRadios = document.querySelectorAll('input[name="region"]');
const startButton = document.getElementById("startButton");

const titleText = document.getElementById("titleText");

const swipeCardContainer = document.getElementById("swipeCardContainer");
const dismissButton = document.getElementById("dismissButton");
const acceptButton = document.getElementById("acceptButton");

const finalListContainer = document.getElementById("finalListContainer");
const finalList = document.getElementById("finalList");

// Export buttons
const exportJsonButton = document.getElementById("exportJsonButton");
const exportCsvButton = document.getElementById("exportCsvButton");
const copyClipboardButton = document.getElementById("copyClipboardButton");

// 2) Global state
let allGames = [];      
let games = [];         // filtered subset
let acceptedGames = [];
let currentIndex = 0;
let chosenRegion = null; // We store which region user picked

// For swipe
let startX = 0;
let currentX = 0;
let isDragging = false;
const SWIPE_THRESHOLD = 100; // px to consider a swipe

// =====================================================
// 3) Load the JSON data
// =====================================================
async function loadData() {
  try {
    const response = await fetch("assets/js/ps2list.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    allGames = await response.json();
    console.log("Loaded JSON:", allGames.length, "games total");

    // After data is loaded, check if user has a saved state in localStorage
    checkForSavedState();
  } catch (err) {
    console.error("Error loading ps2list.json:", err);
  }
}

// =====================================================
// 4) Check for saved state in localStorage
//    Ask user to Resume or Start Over
// =====================================================
function checkForSavedState() {
  const saved = localStorage.getItem("ps2State");
  if (saved) {
    if (confirm("HEY YOU!\nThere is saved progress.\n\nResume from where you left off?")) {
      const state = JSON.parse(saved);

      // Restore variables
      currentIndex = state.currentIndex || 0;
      acceptedGames = state.acceptedGames || [];
      chosenRegion = state.chosenRegion || null;

      // If we have a chosenRegion, re-filter games
      if (chosenRegion) {
        games = filterByRegion(chosenRegion);

        // Hide region selection UI
        regionSelectContainer.style.display = "none";
        titleText.style.display = "none";
        // Show the swipe container + buttons
        swipeCardContainer.style.display = "block";
        dismissButton.style.display = "block";
        acceptButton.style.display = "block";

        showGame(currentIndex);
      }
    } else {
      // User wants a fresh start
      localStorage.removeItem("ps2State");
    }
  }
  // If no saved state, do nothing special -> user picks region normally
}

// =====================================================
// 5) Save progress to localStorage after each action
// =====================================================
function saveProgress() {
  const state = {
    currentIndex,
    acceptedGames,
    chosenRegion
  };
  localStorage.setItem("ps2State", JSON.stringify(state));
}

// =====================================================
// 6) Filter by region
// =====================================================
function filterByRegion(region) {
  return allGames.filter((game) => game[region] === "Released");
}

// =====================================================
// 7) Initialize the swipe with a filtered array
// =====================================================
function initSwipe(filteredArray) {
  games = filteredArray;
  currentIndex = 0;
  acceptedGames = [];

  // Show container, hide finalList
  swipeCardContainer.style.display = "block";
  finalListContainer.style.display = "none";
  acceptButton.style.display = "none";
  dismissButton.style.display = "none";

  showGame(currentIndex);
  // Right after we init, save so we remember chosenRegion & empties
  saveProgress();
}

// =====================================================
// 8) Show the current game
// =====================================================
function showGame(index) {
  if (index >= games.length) {
    showFinalList();
    return;
  }
  // Clear previous card
  swipeCardContainer.innerHTML = "";

  // Create the new .swipe-card element
  const cardDiv = document.createElement("div");
  cardDiv.classList.add("swipe-card");

  // Overlays for Like/Dislike
  const overlayLike = document.createElement("div");
  overlayLike.classList.add("overlay-like");
  overlayLike.textContent = "LIKE";

  const overlayDislike = document.createElement("div");
  overlayDislike.classList.add("overlay-dislike");
  overlayDislike.textContent = "NOPE";

  cardDiv.appendChild(overlayLike);
  cardDiv.appendChild(overlayDislike);

  const game = games[index];

  // IMAGE fallback
  const imgEl = document.createElement("img");
  imgEl.src =
    game.Image ||
    "assets/placeholder.png";
  cardDiv.appendChild(imgEl);

  const titleEl = document.createElement("h3");
  titleEl.innerText = game.Title || "Unknown Title";
  cardDiv.appendChild(titleEl);

  const devEl = document.createElement("p");
  devEl.innerText = "Developer: " + (game.Developer || "Unknown");
  cardDiv.appendChild(devEl);

  const pubEl = document.createElement("p");
  pubEl.innerText = "Publisher: " + (game.Publisher || "Unknown");
  cardDiv.appendChild(pubEl);

  const regionEl = document.createElement("p");
  regionEl.innerText = `JP: ${game.JP}\nEU/PAL: ${game["EU/PAL"]}\nNA: ${game.NA}`;
  cardDiv.appendChild(regionEl);

  // Possibly a link
  if (game.link) {
    const linkEl = document.createElement("a");
    linkEl.href = game.link;
    linkEl.target = "_blank";
    linkEl.innerText = "More Info";
    cardDiv.appendChild(linkEl);
  }

  // Add the card to the container
  swipeCardContainer.appendChild(cardDiv);

  // For swipe events (touchstart, etc.)
  cardDiv.addEventListener("touchstart", onTouchStart);
  cardDiv.addEventListener("touchmove", onTouchMove);
  cardDiv.addEventListener("touchend", onTouchEnd);
}

// =====================================================
// 9) Accept / Dismiss
//    After each action, saveProgress() so we remember
// =====================================================
function handleDismiss() {
  currentIndex++;
  showGame(currentIndex);
  saveProgress();
}
function handleAccept() {
  acceptedGames.push(games[currentIndex]);
  currentIndex++;
  showGame(currentIndex);
  saveProgress();
}

// =====================================================
// 10) Final list
// =====================================================
function showFinalList() {
  acceptButton.style.display = "none";
  dismissButton.style.display = "none";
  swipeCardContainer.style.display = "none";
  finalListContainer.style.display = "block";

  // Build final list
  finalList.innerHTML = "";
  const ul = document.createElement("ul");
  acceptedGames.forEach((g) => {
    const li = document.createElement("li");
    li.textContent = g.Title;
    ul.appendChild(li);
  });
  finalList.appendChild(ul);
}

// =====================================================
// 11) Swipe logic
// =====================================================
function onTouchStart(e) {
  isDragging = true;
  startX = e.touches[0].clientX;
  e.currentTarget.classList.add("swiping"); // disable transitions
}
function onTouchMove(e) {
  if (!isDragging) return;
  currentX = e.touches[0].clientX;
  const diffX = currentX - startX;

  const cardDiv = e.currentTarget;
  cardDiv.style.transform = `translateX(${diffX}px) rotate(${diffX * 0.03}deg)`;

  if (diffX > 50) {
    cardDiv.classList.add("like");
    cardDiv.classList.remove("dislike");
  } else if (diffX < -50) {
    cardDiv.classList.add("dislike");
    cardDiv.classList.remove("like");
  } else {
    cardDiv.classList.remove("like", "dislike");
  }
}
function onTouchEnd(e) {
  if (!isDragging) return;
  isDragging = false;

  const cardDiv = e.currentTarget;
  cardDiv.classList.remove("swiping");
  cardDiv.style.transform = "";

  const diffX = currentX - startX;
  if (diffX > SWIPE_THRESHOLD) {
    handleAccept();
  } else if (diffX < -SWIPE_THRESHOLD) {
    handleDismiss();
  } else {
    cardDiv.classList.remove("like", "dislike");
  }
}

// =====================================================
// 12) Event Listeners for region + start
//     Also store chosenRegion in localStorage
// =====================================================
startButton.addEventListener("click", () => {
  // Which radio is checked?
  let pickedRegion = null;
  regionRadios.forEach((r) => {
    if (r.checked) pickedRegion = r.value;
  });
  if (!pickedRegion) {
    alert("Please select a region first.");
    return;
  }
  chosenRegion = pickedRegion; // store globally

  // Filter
  const regionGames = filterByRegion(chosenRegion);

  // Initialize
  initSwipe(regionGames);

  // Show Accept and Dismiss
  acceptButton.style.display = "block";
  dismissButton.style.display = "block";

  // Hide region container
  regionSelectContainer.style.display = "none";
  titleText.style.display = "none";

  // Save progress now that we have chosenRegion
  saveProgress();
});

// =====================================================
// 13) Dismiss / Accept button listeners
// =====================================================
dismissButton.addEventListener("click", handleDismiss);
acceptButton.addEventListener("click", handleAccept);

// =====================================================
// 14) Keyboard arrow events
// =====================================================
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      handleDismiss();
      break;
    case "ArrowRight":
      e.preventDefault();
      handleAccept();
      break;
  }
});

// =====================================================
// 15) Export logic
// =====================================================
exportJsonButton.addEventListener("click", () => {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(acceptedGames, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "my-ps2-list.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

exportCsvButton.addEventListener("click", () => {
  let csvContent = "data:text/csv;charset=utf-8,Title,Developer,Publisher,JP,EU/PAL,NA\n";
  acceptedGames.forEach((g) => {
    const row = `"${g.Title}","${g.Developer}","${g.Publisher}","${g.JP}","${g["EU/PAL"]}","${g.NA}"\n`;
    csvContent += row;
  });
  const encodedUri = encodeURI(csvContent);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", encodedUri);
  downloadAnchor.setAttribute("download", "my-ps2-list.csv");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

copyClipboardButton.addEventListener("click", () => {
  const titles = acceptedGames.map((g) => g.Title).join("\n");
  navigator.clipboard
    .writeText(titles)
    .then(() => {
      alert("Copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
    });
});

// =====================================================
// 16) On page load, fetch data
// =====================================================
loadData();