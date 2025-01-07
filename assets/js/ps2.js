/*******************************************************
 * ps2.js
 * Disabling pointer events on <img> to avoid iOS Safari
 * accidental "tap" dismiss.
 *******************************************************/

/** Toggles the "More" dropdown by click (unchanged) */
const dropdownToggle = document.querySelector(".dropdown-toggle");
dropdownToggle.addEventListener("click", (e) => {
  e.preventDefault();
  dropdownToggle.parentElement.classList.toggle("show");
});

// 1) References
const regionSelectContainer = document.getElementById("regionSelectContainer");
const regionRadios = document.querySelectorAll('input[name="region"]');
const genreSelect = document.getElementById("genreSelect");
const startButton = document.getElementById("startButton");
const titleText = document.getElementById("titleText");

const swipeCardContainer = document.getElementById("swipeCardContainer");
const dismissButton = document.getElementById("dismissButton");
const acceptButton = document.getElementById("acceptButton");

const finalListContainer = document.getElementById("finalListContainer");
const finalList = document.getElementById("finalList");

const exportJsonButton = document.getElementById("exportJsonButton");
const exportCsvButton = document.getElementById("exportCsvButton");
const copyClipboardButton = document.getElementById("copyClipboardButton");

const navbar = document.getElementById("navbar");
const gameCountRadios = document.querySelectorAll('input[name="gameCount"]');
const progressBar = document.getElementById("progressBar");

// 2) Global State
let allGames = {};
let gamesArray = [];
let filteredGames = [];
let acceptedGames = [];
let currentIndex = 0;

let chosenRegion = null;
let chosenGenre = null;

let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let isDragging = false;

// High threshold to prevent accidental swipes
const SWIPE_THRESHOLD = 150;
// or 200, if you want it even bigger

let inSwipeSession = false;
let totalGamesCount = 0;

/*******************************************************
 * loadCoverImage
 *******************************************************/
function loadCoverImage(gameId, imgEl) {
  const baseUrl1 = "https://psxdatacenter.com/psx2/images2/covers/";
  const baseUrl2 =
    "https://raw.githubusercontent.com/xlenore/ps2-covers/refs/heads/main/covers/default/";
  const placeholder = "assets/placeholder.png";

  const firstUrl = baseUrl1 + gameId + ".jpg";
  const secondUrl = baseUrl2 + gameId + ".jpg";

  imgEl.src = firstUrl;
  imgEl.onerror = function handleFirstError() {
    imgEl.onerror = function handleSecondError() {
      imgEl.src = placeholder;
    };
    imgEl.src = secondUrl;
  };
}

/*******************************************************
 * random subset + shuffling
 *******************************************************/
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function getRandomSubset(array, n) {
  if (n >= array.length) {
    return shuffleArray(array.slice());
  }
  const shuffled = shuffleArray(array.slice());
  return shuffled.slice(0, n);
}

/*******************************************************
 * 3) Load JSON
 *******************************************************/
async function loadData() {
  try {
    const response = await fetch("assets/json/PS2.data.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    allGames = await response.json();
    console.log("Loaded JSON (keys):", Object.keys(allGames).length);

    gamesArray = Object.keys(allGames).map((key) => ({
      id: key,
      ...allGames[key],
    }));

    console.log("Converted to array:", gamesArray.length);

    checkForSavedState();
  } catch (err) {
    console.error("Error loading ps2 data:", err);
  }
}

/*******************************************************
 * 4) checkForSavedState
 *******************************************************/
function checkForSavedState() {
  const saved = localStorage.getItem("ps2State");
  if (saved) {
    if (confirm("HEY YOU!\nSaved progress found.\nResume?")) {
      const state = JSON.parse(saved);

      currentIndex = state.currentIndex || 0;
      acceptedGames = state.acceptedGames || [];
      chosenRegion = state.chosenRegion || null;
      chosenGenre = state.chosenGenre || null;
      filteredGames = state.filteredGames || [];
      totalGamesCount = state.totalGamesCount || 0;

      if (filteredGames.length > 0) {
        regionSelectContainer.style.display = "none";
        titleText.style.display = "none";
        navbar.style.display = "none";

        swipeCardContainer.style.display = "block";
        dismissButton.style.display = "block";
        acceptButton.style.display = "block";

        inSwipeSession = true;

        progressBar.style.display = "block";
        updateProgressBar(currentIndex, totalGamesCount);

        showGame(currentIndex);
      }
    } else {
      localStorage.removeItem("ps2State");
    }
  }
}

/*******************************************************
 * 5) saveProgress
 *******************************************************/
function saveProgress() {
  const state = {
    currentIndex,
    acceptedGames,
    chosenRegion,
    chosenGenre,
    filteredGames,
    totalGamesCount,
  };
  localStorage.setItem("ps2State", JSON.stringify(state));
}

/*******************************************************
 * 6) filterByRegionAndGenre
 *******************************************************/
function filterByRegionAndGenre(region, genre) {
  if (genre === "All") {
    return gamesArray.filter((g) => g.region === region);
  } else {
    return gamesArray.filter((g) => g.region === region && g.genre === genre);
  }
}

/*******************************************************
 * 7) initSwipe
 *******************************************************/
function initSwipe(games) {
  filteredGames = games;
  currentIndex = 0;
  acceptedGames = [];
  totalGamesCount = games.length;

  swipeCardContainer.style.display = "block";
  finalListContainer.style.display = "none";
  acceptButton.style.display = "none";
  dismissButton.style.display = "none";

  inSwipeSession = true;

  progressBar.style.display = "block";
  updateProgressBar(0, totalGamesCount);

  showGame(currentIndex);
  saveProgress();
}

/*******************************************************
 * 8) showGame
 *******************************************************/
function showGame(index) {
  if (index >= filteredGames.length) {
    showFinalList();
    return;
  }

  swipeCardContainer.innerHTML = "";

  const cardDiv = document.createElement("div");
  cardDiv.classList.add("swipe-card");
  // Make sure the user can't tap on the image to cause a separate event:
  // We also set pointerEvents=none on the image below.
  cardDiv.style.touchAction = "none";
  cardDiv.setAttribute("tabindex", "0");

  const overlayLike = document.createElement("div");
  overlayLike.classList.add("overlay-like");
  overlayLike.textContent = "LIKE";

  const overlayDislike = document.createElement("div");
  overlayDislike.classList.add("overlay-dislike");
  overlayDislike.textContent = "NOPE";

  cardDiv.appendChild(overlayLike);
  cardDiv.appendChild(overlayDislike);

  const game = filteredGames[index];

  const imgEl = document.createElement("img");
  imgEl.style.pointerEvents = "none"; // <--- CRITICAL to avoid iOS tap on image
  loadCoverImage(game.id, imgEl);
  cardDiv.appendChild(imgEl);

  const cardBoxDiv = document.createElement("div");
  cardBoxDiv.classList.add("swipe-card-shadow");

  // Title
  const titleEl = document.createElement("h3");
  titleEl.innerText = game.title || "Unknown Title";
  cardBoxDiv.appendChild(titleEl);

  // Dev
  const devEl = document.createElement("p");
  devEl.innerText = "Developer: " + (game.developer || "Unknown");
  cardBoxDiv.appendChild(devEl);

  // Pub
  const pubEl = document.createElement("p");
  pubEl.innerText = "Publisher: " + (game.publisher || "Unknown");
  cardBoxDiv.appendChild(pubEl);

  // Genre
  const genreEl = document.createElement("p");
  genreEl.innerText = "Genre: " + (game.genre || "Unknown");
  cardBoxDiv.appendChild(genreEl);

  // Region
  const regEl = document.createElement("p");
  regEl.innerText = "Region: " + (game.region || "Unknown");
  cardBoxDiv.appendChild(regEl);

  // Release date
  const dateEl = document.createElement("p");
  dateEl.innerText = "Release Date: " + (game.release_date || "N/A");
  cardBoxDiv.appendChild(dateEl);

  // Language
  if (Array.isArray(game.language)) {
    const langEl = document.createElement("p");
    langEl.innerText = "Languages: " + game.language.join(", ");
    cardBoxDiv.appendChild(langEl);
  }

  cardDiv.appendChild(cardBoxDiv);
  swipeCardContainer.appendChild(cardDiv);

  // SWIPE events only
  cardDiv.addEventListener("touchstart", onTouchStart, { passive: false });
  cardDiv.addEventListener("touchmove", onTouchMove, { passive: false });
  cardDiv.addEventListener("touchend", onTouchEnd, { passive: false });
}

/*******************************************************
 * 9) Accept / Dismiss
 *******************************************************/
function handleDismiss() {
  currentIndex++;
  updateProgressBar(currentIndex, totalGamesCount);
  showGame(currentIndex);
  saveProgress();
}
function handleAccept() {
  acceptedGames.push(filteredGames[currentIndex]);
  currentIndex++;
  updateProgressBar(currentIndex, totalGamesCount);
  showGame(currentIndex);
  saveProgress();
}

/*******************************************************
 * 10) showFinalList
 *******************************************************/
function showFinalList() {
  acceptButton.style.display = "none";
  dismissButton.style.display = "none";
  swipeCardContainer.style.display = "none";
  navbar.style.display = "block";
  finalListContainer.style.display = "block";

  inSwipeSession = false;
  progressBar.style.display = "none";

  finalList.innerHTML = "";
  const ul = document.createElement("ul");
  ul.setAttribute("role", "list");
  acceptedGames.forEach((g) => {
    const li = document.createElement("li");
    li.setAttribute("role", "listitem");
    li.textContent = g.title;
    ul.appendChild(li);
  });
  finalList.appendChild(ul);
}

/*******************************************************
 * 11) Swipe logic
 *******************************************************/
let touchStartTime = 0;

function onTouchStart(e) {
  if (!inSwipeSession) return;
  e.preventDefault();
  e.stopPropagation();

  touchStartTime = Date.now();

  isDragging = true;
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  e.currentTarget.classList.add("swiping");
}

function onTouchMove(e) {
  if (!isDragging || !inSwipeSession) return;
  e.preventDefault();
  e.stopPropagation();

  currentX = e.touches[0].clientX;
  currentY = e.touches[0].clientY;

  const diffX = currentX - startX;
  const diffY = currentY - startY;

  // If user hasn't moved horizontally enough, or vertical is bigger, do nothing
  if (Math.abs(diffX) < 40 || Math.abs(diffY) > Math.abs(diffX)) return;

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
  if (!isDragging || !inSwipeSession) return;
  e.preventDefault();
  e.stopPropagation();

  isDragging = false;

  const cardDiv = e.currentTarget;
  cardDiv.classList.remove("swiping");
  cardDiv.style.transform = "";

  const diffX = currentX - startX;
  const diffY = currentY - startY;
  const elapsed = Date.now() - touchStartTime; // how many ms?
  console.log("startX =", startX, "currentX =", currentX);
  console.log("diffX =", diffX);
  console.log("elapsed =", elapsed);
  // If user completed the tap in under ~150 ms but we see large diffX,
  // likely a glitch => ignore
  if (elapsed < 130 && Math.abs(diffX) > 150) {
    // treat as a tap, do nothing
    cardDiv.classList.remove("like", "dislike");
    return;
  }
  console.log("elapsed Triggered=", elapsed);
  // If horizontal movement was small or overshadowed by vertical => no action
  if (Math.abs(diffX) < 40 || Math.abs(diffY) > Math.abs(diffX)) {
    cardDiv.classList.remove("like", "dislike");
    return;
  }

  const absDiffX = Math.abs(diffX);
  if (Math.abs(diffX) < 40 || Math.abs(diffY) > Math.abs(diffX)) {
    // treat as a tap or vertical scroll, do nothing
    cardDiv.classList.remove("like", "dislike");
    return;
  }

  // if user swiped left beyond threshold
  if (diffX < -SWIPE_THRESHOLD && absDiffX > SWIPE_THRESHOLD) {
    handleDismiss();
  }
  // else if user swiped right beyond threshold
  else if (diffX > SWIPE_THRESHOLD && absDiffX > SWIPE_THRESHOLD) {
    handleAccept();
  } else {
    // reset
    cardDiv.classList.remove("like", "dislike");
  }
}

/*******************************************************
 * 12) Start button logic
 *******************************************************/
startButton.addEventListener("click", () => {
  chosenRegion = null;
  regionRadios.forEach((r) => {
    if (r.checked) chosenRegion = r.value;
  });
  if (!chosenRegion) {
    alert("Please select a region (PAL, NTSC-J, NTSC-U).");
    return;
  }

  chosenGenre = genreSelect.value;
  let regionGames = filterByRegionAndGenre(chosenRegion, chosenGenre);
  if (regionGames.length === 0) {
    alert("No games found for that region/genre. Try again.");
    return;
  }

  let chosenCount = null;
  gameCountRadios.forEach((radio) => {
    if (radio.checked) chosenCount = radio.value;
  });
  if (!chosenCount) {
    alert("Select how many games (25, 50, etc.)");
    return;
  }

  if (chosenCount !== "ALL") {
    const n = parseInt(chosenCount, 10);
    regionGames = getRandomSubset(regionGames, n);
    console.log(`Random subset of size ${regionGames.length}`);
  }

  initSwipe(regionGames);
  acceptButton.style.display = "block";
  dismissButton.style.display = "block";

  regionSelectContainer.style.display = "none";
  titleText.style.display = "none";
  navbar.style.display = "none";

  inSwipeSession = true;
  saveProgress();
});

/*******************************************************
 * 13) Dismiss / Accept button listeners
 *******************************************************/
dismissButton.addEventListener("click", handleDismiss);
acceptButton.addEventListener("click", handleAccept);

/*******************************************************
 * 14) Keyboard arrow events
 *******************************************************/
window.addEventListener("keydown", (e) => {
  if (!inSwipeSession) return;
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

/*******************************************************
 * 15) Export logic
 *******************************************************/
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
  let csvContent =
    "data:text/csv;charset=utf-8,ID,Title,Developer,Publisher,Genre,Region\n";
  acceptedGames.forEach((g) => {
    const row = `"${g.id}","${g.title}","${g.developer}","${g.publisher}","${g.genre}","${g.region}"\n`;
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

/*******************************************************
 * 16) On page load, fetch data
 *******************************************************/
loadData();

/*******************************************************
 * PROGRESS BAR: updateProgressBar()
 *******************************************************/
function updateProgressBar(currentIndex, totalCount) {
  if (!totalCount) return;
  const fraction = currentIndex / totalCount;
  const percentage = Math.floor(fraction * 100);
  progressBar.style.width = percentage + "%";
}
