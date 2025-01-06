    // -----------------------------------------------------
    // Global references
    // -----------------------------------------------------
    const regionSelectContainer = document.getElementById("regionSelectContainer");
    const regionRadios          = document.querySelectorAll('input[name="region"]');
    const startButton           = document.getElementById("startButton");

    const swipeCard             = document.getElementById("swipeCard");
    const swipeButtons          = document.getElementById("swipeButtons");
    const dismissButton         = document.getElementById("dismissButton");
    const acceptButton          = document.getElementById("acceptButton");

    const finalListContainer    = document.getElementById("finalListContainer");
    const finalList             = document.getElementById("finalList");

    // Export buttons
    const exportJsonButton      = document.getElementById("exportJsonButton");
    const exportCsvButton       = document.getElementById("exportCsvButton");
    const copyClipboardButton   = document.getElementById("copyClipboardButton");

    // State
    let allGames = [];      // loaded from ps2list.json
    let games = [];         // filtered subset
    let acceptedGames = [];
    let currentIndex = 0;

    // For swipe
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    const SWIPE_THRESHOLD = 100; // px

    // -----------------------------------------------------
    // Load JSON data on page load
    // -----------------------------------------------------
    async function loadData() {
      try {
        // Adjust path if needed. Must be served over HTTP.
        const response = await fetch("assets/js/ps2list.json");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        allGames = await response.json();
        console.log("Loaded JSON:", allGames.length, "games total");
      } catch (err) {
        console.error("Error loading ps2list.json:", err);
      }
    }
    loadData(); // call immediately

    // -----------------------------------------------------
    // Filter by region
    // -----------------------------------------------------
    function filterByRegion(region) {
      // Return only games "Released" in that region
      return allGames.filter((game) => game[region] === "Released");
    }

    // -----------------------------------------------------
    // Initialize the swipe with the filtered array
    // -----------------------------------------------------
    function initSwipe(filteredArray) {
      games = filteredArray;
      currentIndex = 0;
      acceptedGames = [];

      // Hide region container, show card + buttons
      regionSelectContainer.style.display = "none";
      swipeCard.style.display = "block";
      swipeButtons.style.display = "block";
      finalListContainer.style.display = "none";

      showGame(currentIndex);
    }

    // -----------------------------------------------------
    // Show the current game
    // -----------------------------------------------------
    function showGame(index) {
      if (index >= games.length) {
        showFinalList();
        return;
      }

      // Reset any swipe transform
      swipeCard.style.transform = "";
      swipeCard.innerHTML = ""; // clear old content

      const game = games[index];

      const titleEl  = document.createElement("h3");
      titleEl.textContent = game.Title;

      const devEl = document.createElement("p");
      devEl.textContent = "Developer: " + (game.Developer || "Unknown");

      const pubEl = document.createElement("p");
      pubEl.textContent = "Publisher: " + (game.Publisher || "Unknown");

      const regionEl = document.createElement("p");
      regionEl.textContent = `JP: ${game.JP}, EU/PAL: ${game["EU/PAL"]}, NA: ${game.NA}`;

      swipeCard.appendChild(titleEl);
      swipeCard.appendChild(devEl);
      swipeCard.appendChild(pubEl);
      swipeCard.appendChild(regionEl);
    }

    // -----------------------------------------------------
    // Accept / Dismiss
    // -----------------------------------------------------
    function handleDismiss() {
      currentIndex++;
      showGame(currentIndex);
    }

    function handleAccept() {
      acceptedGames.push(games[currentIndex]);
      currentIndex++;
      showGame(currentIndex);
    }

    // -----------------------------------------------------
    // Final List
    // -----------------------------------------------------
    function showFinalList() {
      swipeCard.style.display = "none";
      swipeButtons.style.display = "none";
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

    // -----------------------------------------------------
    // Swipe logic (touch events)
    // -----------------------------------------------------
    swipeCard.addEventListener("touchstart", onTouchStart);
    swipeCard.addEventListener("touchmove", onTouchMove);
    swipeCard.addEventListener("touchend", onTouchEnd);

    function onTouchStart(e) {
      if (!games || games.length === 0) return;
      isDragging = true;
      startX = e.touches[0].clientX;
    }

    function onTouchMove(e) {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      swipeCard.style.transform = `translateX(${diffX}px) rotate(${diffX * 0.03}deg)`;
    }

    function onTouchEnd() {
      if (!isDragging) return;
      isDragging = false;
      swipeCard.style.transform = "";

      const diffX = currentX - startX;
      if (diffX > SWIPE_THRESHOLD) {
        handleAccept();
      } else if (diffX < -SWIPE_THRESHOLD) {
        handleDismiss();
      }
    }

    // -----------------------------------------------------
    // Keyboard arrow events
    // -----------------------------------------------------
    window.addEventListener("keydown", (e) => {
      if (!games || games.length === 0) return;
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
    // Start button (radio-based)
    // -----------------------------------------------------
    startButton.addEventListener("click", () => {
      // 1) Find which radio is checked
      let chosenRegion = null;
      regionRadios.forEach((radio) => {
        if (radio.checked) {
          chosenRegion = radio.value; // "JP", "EU/PAL", "NA"
        }
      });

      if (!chosenRegion) {
        alert("Please select a region first!");
        return;
      }

      // 2) Filter
      const regionGames = filterByRegion(chosenRegion);
      console.log(`Chosen: ${chosenRegion}, found ${regionGames.length} games`);
      // 3) init swipe
      initSwipe(regionGames);
    });

    // -----------------------------------------------------
    // Dismiss / Accept button listeners
    // -----------------------------------------------------
    dismissButton.addEventListener("click", handleDismiss);
    acceptButton.addEventListener("click", handleAccept);

    // -----------------------------------------------------
    // Export logic
    // -----------------------------------------------------
    exportJsonButton.addEventListener("click", () => {
      // Download acceptedGames as a JSON file
      const dataStr = "data:text/json;charset=utf-8," + 
        encodeURIComponent(JSON.stringify(acceptedGames, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "my-ps2-list.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    exportCsvButton.addEventListener("click", () => {
      // Download acceptedGames as CSV
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Title,Developer,Publisher,JP,EU/PAL,NA\n";
      acceptedGames.forEach((game) => {
        // Escape quotes in fields if needed
        const row = `"${game.Title}","${game.Developer}","${game.Publisher}","${game.JP}","${game["EU/PAL"]}","${game.NA}"\n`;
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
      // Copy titles to clipboard
      const titles = acceptedGames.map((g) => g.Title).join("\n");
      navigator.clipboard.writeText(titles)
        .then(() => {
          alert("Copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
        });
    });