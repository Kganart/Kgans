/*******************************************************
 * ps2.js
 * Using #swipeCardContainer and .swipe-card
 * Updated for new JSON: {
 *   "SLES-53007": {
 *      "genre": "Action",
 *      "language": ["English", "French", "German"],
 *      "publisher": "Ubisoft",
 *      "region": "PAL",
 *      "release_date": "2005-04-01",
 *      "title": "Tom Clancy's Splinter Cell: Chaos Theory"
 *   },
 *   ...
 * }
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

// Navbar
const navbar = document.getElementById("navbar");

// 2) Global state
let allGames = {}; // <-- This will hold the entire JSON object
let gamesArray = []; // We'll convert allGames to an array of objects
let filteredGames = []; // after we filter by region
let acceptedGames = [];
let currentIndex = 0;

// For region chosen
let chosenRegion = null;

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
    const response = await fetch("assets/json/GBA.data.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    // new structure is an object keyed by game ID
    // e.g. { "SLES-53007": { region, ...}, "SLES-12345": {...}, ... }
    allGames = await response.json();
    console.log("Loaded JSON (object keys):", Object.keys(allGames).length);

    // Convert that object into an array for easier filtering
    // Each element will be: { id: 'SLES-53007', ...restOfFields }
    gamesArray = Object.keys(allGames).map((key) => {
      // merge game data plus an "id" field
      return {
        id: key,
        ...allGames[key],
      };
    });

    console.log("Converted to array of length:", gamesArray.length);

    // After data is loaded, check if user has a saved state
    checkForSavedState();
  } catch (err) {
    console.error("Error loading gba json:", err);
  }
}

// =====================================================
// 4) Check for saved state in localStorage (Resume?)
// =====================================================
function checkForSavedState() {
  const saved = localStorage.getItem("gbaState");
  if (saved) {
    if (
      confirm(
        "HEY YOU!\nThere is saved progress.\n\nResume from where you left off?"
      )
    ) {
      const state = JSON.parse(saved);

      // Restore variables
      currentIndex = state.currentIndex || 0;
      acceptedGames = state.acceptedGames || [];
      chosenRegion = state.chosenRegion || null;

      // If we have region+genre, re-filter
      if (chosenRegion) {
        filteredGames = filterByRegionAndGenre(chosenRegion);

        // Hide region selection UI
        regionSelectContainer.style.display = "none";
        // Hide Title Text
        titleText.style.display = "none";
        // Hide Navbar
        navbar.style.display = "none";
        // Show the swipe container + buttons
        swipeCardContainer.style.display = "block";
        dismissButton.style.display = "block";
        acceptButton.style.display = "block";

        showGame(currentIndex);
      }
    } else {
      // User wants a fresh start
      localStorage.removeItem("gbaState");
    }
  }
  // If no saved state, do nothing -> user picks region
}

// =====================================================
// 5) Save progress to localStorage after each action
// =====================================================
function saveProgress() {
  const state = {
    currentIndex,
    acceptedGames,
    chosenRegion,
  };
  localStorage.setItem("gbaState", JSON.stringify(state));
}

// =====================================================
// 6) Filter by region +
//    region: "PAL", "NTSC-J", "NTSC-U"
// =====================================================
function filterByRegionAndGenre(region) {
  return gamesArray.filter((g) => {
    // e.g. g.region === "PAL"
    // and  g.genre === "Action"
    const gameRegion = g.region || "";
    return gameRegion === region;
  });
}

// =====================================================
// 7) Initialize the swipe with a filtered array
// =====================================================
function initSwipe(games) {
  // "games" is the filtered array
  filteredGames = games;
  currentIndex = 0;
  acceptedGames = [];

  // Show container, hide finalList
  swipeCardContainer.style.display = "block";
  finalListContainer.style.display = "none";
  acceptButton.style.display = "none";
  dismissButton.style.display = "none";

  showGame(currentIndex);
  // Save
  saveProgress();
}

// =====================================================
// 8) Show the current game
// =====================================================
function showGame(index) {
  if (index >= filteredGames.length) {
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

  // Get the game from filteredGames
  const game = filteredGames[index];

  // Some fields we have in the new structure:
  //   id, title, region, language, release_date
  //   We might not have an "Image" unless you add it, so let's do placeholder
  const imgEl = document.createElement("img");
  // If you have an "image" field in the JSON, do game.image
  // else fallback to a placeholder
  imgEl.src = game.image || "assets/gbaPlaceholder.png";
  cardDiv.appendChild(imgEl);

  // Title
  const titleEl = document.createElement("h3");
  titleEl.innerText = game.title || "Unknown Title";
  cardDiv.appendChild(titleEl);

  // Region
  const regEl = document.createElement("p");
  regEl.innerText = "Region: " + (game.region || "Unknown");
  cardDiv.appendChild(regEl);

  // Release date
  const dateEl = document.createElement("p");
  dateEl.innerText = "Release Date: " + (game.release_date || "N/A");
  cardDiv.appendChild(dateEl);

  // Language array
  if (Array.isArray(game.language)) {
    const langEl = document.createElement("p");
    langEl.innerText = "Languages: " + game.language.join(", ");
    cardDiv.appendChild(langEl);
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
// =====================================================
function handleDismiss() {
  currentIndex++;
  showGame(currentIndex);
  saveProgress();
}
function handleAccept() {
  // push the current game into acceptedGames
  acceptedGames.push(filteredGames[currentIndex]);
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
  navbar.style.display = "block";
  finalListContainer.style.display = "block";

  // Build final list
  finalList.innerHTML = "";
  const ul = document.createElement("ul");
  acceptedGames.forEach((g) => {
    const li = document.createElement("li");
    li.textContent = g.title; // now we use g.title
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
  e.currentTarget.classList.add("swiping");
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
// =====================================================
startButton.addEventListener("click", () => {
  // 1) Which region is checked?
  chosenRegion = null;
  regionRadios.forEach((r) => {
    if (r.checked) chosenRegion = r.value;
  });

  if (!chosenRegion) {
    alert("Please select a region (PAL, NTSC-J, NTSC-U).");
    return;
  }

  // 3) Filter
  const regionGames = filterByRegionAndGenre(chosenRegion);

  if (regionGames.length === 0) {
    alert("No games found for that region. Please try again.");
    return;
  }

  // 4) Initialize
  initSwipe(regionGames);

  // Show Accept and Dismiss
  acceptButton.style.display = "block";
  dismissButton.style.display = "block";

  // Hide region container, title, navbar
  regionSelectContainer.style.display = "none";
  titleText.style.display = "none";
  navbar.style.display = "none";

  // 5) Save progress now
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
  // We'll export the acceptedGames array
  // Note these objects have fields like: id, title, region, etc.
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(acceptedGames, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "my-gba-list.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

exportCsvButton.addEventListener("click", () => {
  // CSV columns: maybe "ID,Title,Developer,Publisher,Region"
  let csvContent = "data:text/csv;charset=utf-8,ID,Title,Region\n";
  acceptedGames.forEach((g) => {
    const row = `"${g.id}","${g.title}","${g.region}"\n`;
    csvContent += row;
  });
  const encodedUri = encodeURI(csvContent);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", encodedUri);
  downloadAnchor.setAttribute("download", "my-gba-list.csv");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

copyClipboardButton.addEventListener("click", () => {
  // Copy just the titles to clipboard
  const titles = acceptedGames.map((g) => g.title).join("\n");
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
