/*******************************************************
 *  script.js
 *  Loads ps2list.json, filters by region, and runs
 *  a swipe-based accept/dismiss interface.
 *******************************************************/

// -----------------------------------------------------
// 1) Global variables / references
// -----------------------------------------------------
let allGames = [];        // Holds entire JSON from ps2list.json
let games = [];           // Will be the filtered array for the chosen region
let currentIndex = 0;     // Tracks which game the user is currently on
let acceptedGames = [];   // Stores games the user has "accepted"

const regionSelect       = document.getElementById("regionSelect");
const startButton        = document.getElementById("startButton");
const swipeCard          = document.getElementById("swipeCard");
const dismissButton      = document.getElementById("dismissButton");
const acceptButton       = document.getElementById("acceptButton");
const finalListContainer = document.getElementById("finalListContainer");
const finalList          = document.getElementById("finalList");

// For swipe
let startX = 0;
let currentX = 0;
let isDragging = false;
const SWIPE_THRESHOLD = 100; // px to consider a swipe

// -----------------------------------------------------
// 2) Load data from ps2list.json
// -----------------------------------------------------
async function loadData() {
  try {
    // Adjust the path if needed (./ps2list.json, /data/ps2list.json, etc.)
    const response = await fetch("assets/js/ps2list.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    allGames = await response.json();
    console.log("JSON loaded, total games:", allGames.length);
  } catch (error) {
    console.error("Error loading ps2list.json:", error);
  }
}

// -----------------------------------------------------
// 3) Filter by region ("JP", "EU/PAL", or "NA")
// -----------------------------------------------------
function filterByRegion(region) {
  // Keep only games that have "Released" in that region column
  return allGames.filter((game) => game[region] === "Released");
}

// -----------------------------------------------------
// 4) Initialize the swipe interface with a subset
// -----------------------------------------------------
function initSwipe(filteredArray) {
  games = filteredArray;
  currentIndex = 0;
  acceptedGames = [];

  // Make sure swipe card is visible again, etc.
  swipeCard.style.display          = "block";
  dismissButton.style.display      = "inline-block";
  acceptButton.style.display       = "inline-block";
  finalListContainer.style.display = "none";

  showGame(currentIndex);
}

// -----------------------------------------------------
// 5) Show the current game
// -----------------------------------------------------
function showGame(index) {
  if (index >= games.length) {
    // No more games to show
    showFinalList();
    return;
  }

  // Reset any swipe effects
  swipeCard.classList.remove("like", "dislike", "swiping");
  swipeCard.style.transform = "";

  // Clear and build the new card content
  swipeCard.innerHTML = `
    <!-- Overlays for visual feedback (optional) -->
    <div class="overlay-like">LIKE</div>
    <div class="overlay-dislike">NOPE</div>
  `;

  // Grab the current game
  const game = games[index];

  // Create elements
  const cardImg = document.createElement("img");
  cardImg.src = game.image || "";
  cardImg.alt = game.Title || "PS2 Game";

  const cardTitle = document.createElement("h3");
  cardTitle.innerText = game.Title;

  const cardDev = document.createElement("p");
  cardDev.innerText = `Developer: ${game.Developer ?? "Unknown"}`;

  const cardPub = document.createElement("p");
  cardPub.innerText = `Publisher: ${game.Publisher ?? "Unknown"}`;

  const cardDates = document.createElement("p");
  cardDates.innerText = `First released: ${game["First released"] || "Unknown"}`;

  // Maybe show region statuses, e.g. JP: Released/Unreleased
  const cardRegions = document.createElement("p");
  cardRegions.innerText = `JP: ${game.JP}, EU/PAL: ${game["EU/PAL"]}, NA: ${game.NA}`;

  // Append them
  swipeCard.appendChild(cardImg);
  swipeCard.appendChild(cardTitle);
  swipeCard.appendChild(cardDev);
  swipeCard.appendChild(cardPub);
  swipeCard.appendChild(cardDates);
  swipeCard.appendChild(cardRegions);
}

// -----------------------------------------------------
// 6) Handle Accept / Dismiss
// -----------------------------------------------------
function handleDismiss() {
  currentIndex++;
  showGame(currentIndex);
}

function handleAccept() {
  // Add the current game to the accepted list
  acceptedGames.push(games[currentIndex]);
  currentIndex++;
  showGame(currentIndex);
}

// -----------------------------------------------------
// 7) Swipe logic (touch events)
// -----------------------------------------------------
swipeCard.addEventListener("touchstart", onTouchStart);
swipeCard.addEventListener("touchmove", onTouchMove);
swipeCard.addEventListener("touchend", onTouchEnd);

function onTouchStart(e) {
  if (!games || games.length === 0) return; // no games to swipe
  isDragging = true;
  startX = e.touches[0].clientX;
  swipeCard.classList.add("swiping"); // disable transition while swiping
}

function onTouchMove(e) {
  if (!isDragging) return;
  currentX = e.touches[0].clientX;
  const diffX = currentX - startX;

  // Move the card in the X direction
  swipeCard.style.transform = `translateX(${diffX}px) rotate(${diffX * 0.03}deg)`;

  // Show overlays if user swipes enough
  if (diffX > 50) {
    swipeCard.classList.add("like");
    swipeCard.classList.remove("dislike");
  } else if (diffX < -50) {
    swipeCard.classList.add("dislike");
    swipeCard.classList.remove("like");
  } else {
    swipeCard.classList.remove("like", "dislike");
  }
}

function onTouchEnd() {
  if (!isDragging) return;
  isDragging = false;
  swipeCard.classList.remove("swiping"); // re-enable transition

  const diffX = currentX - startX;
  swipeCard.style.transform = ""; // reset transform

  if (diffX > SWIPE_THRESHOLD) {
    // Swiped right -> Accept
    handleAccept();
  } else if (diffX < -SWIPE_THRESHOLD) {
    // Swiped left -> Dismiss
    handleDismiss();
  } else {
    // Not enough swipe -> reset
    swipeCard.classList.remove("like", "dislike");
  }
}

// -----------------------------------------------------
// 8) Show final list once the user runs out of games
// -----------------------------------------------------
function showFinalList() {
  swipeCard.style.display     = "none";
  dismissButton.style.display = "none";
  acceptButton.style.display  = "none";

  finalListContainer.style.display = "block";

  // Clear any old content
  finalList.innerHTML = "";

  // Build the final list
  const ul = document.createElement("ul");
  acceptedGames.forEach((g) => {
    const li = document.createElement("li");
    li.innerText = g.Title; // or g.Title + " - " + g.Developer, etc.
    ul.appendChild(li);
  });
  finalList.appendChild(ul);
}

// -----------------------------------------------------
// 9) Optional: Keyboard arrow events
// -----------------------------------------------------
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

// -----------------------------------------------------
// 10) Event listeners: region select & start
// -----------------------------------------------------
startButton.addEventListener("click", () => {
  // Which region did the user pick?
  const region = regionSelect.value; // "JP", "EU/PAL", or "NA"
  const regionGames = filterByRegion(region);
  console.log(`User chose ${region}, found ${regionGames.length} games.`);
  initSwipe(regionGames);
});

// -----------------------------------------------------
// 11) On page load, fetch the data
// -----------------------------------------------------
loadData();  
