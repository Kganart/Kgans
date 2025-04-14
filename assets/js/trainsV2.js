let currentStationName = null;
let currentDirection = null; 
let refreshIntervalId = null;
const REFRESH_INTERVAL_MS = 60000; 

let selectedStationForMobile = null;

document.addEventListener("DOMContentLoaded", () => {
    const settingsModal = document.getElementById("settingsModal");
    const openModalBtn = document.getElementById("settingsBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");

    document.getElementById("northboundColumn").style.display = "none";
    document.getElementById("southboundColumn").style.display = "none";

    document.getElementById("mobileSwitchDirection").style.display = "none";

    openModalBtn.addEventListener("click", () => {
      settingsModal.style.display = "block";
      loadSettingsIntoModal();
    });

    closeModalBtn.addEventListener("click", () => {
      settingsModal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
      if (e.target === settingsModal) {
        settingsModal.style.display = "none";
      }
    });

    saveSettingsBtn.addEventListener("click", () => {
      saveSettings();
      settingsModal.style.display = "none";

      autoLoadBasedOnTime();
    });

    const toggleStationsBtn = document.getElementById("toggleStationsBtn");
    const stationsWrapper = document.getElementById("stationsWrapper");

    toggleStationsBtn.addEventListener("click", () => {
      if (stationsWrapper.classList.contains("active")) {
        stationsWrapper.classList.remove("active");
        toggleStationsBtn.textContent = "Show Stations";
      } else {
        stationsWrapper.classList.add("active");
        toggleStationsBtn.textContent = "Hide Stations";

        if (refreshIntervalId !== null) {
            clearInterval(refreshIntervalId);
            refreshIntervalId = null;
            currentStationName = null;
            currentDirection = null;
            selectedStationForMobile = null;
            console.log("Station selector opened, auto-refresh stopped.");

            document.getElementById("northboundColumn").style.display = "none";
            document.getElementById("southboundColumn").style.display = "none";
            document.getElementById("mobileSwitchDirection").style.display = "none";
            document.getElementById('selectedStationHeader').textContent = '';
            document.getElementById('northboundResults').innerHTML = '';
            document.getElementById('southboundResults').innerHTML = '';

            document.getElementById("directionChoice").style.display = "none";
        }
      }
    });

    const stationCardsContainer = document.getElementById("stationCardsContainer");
    const stationCards = stationCardsContainer.querySelectorAll(".station-card");
    stationCards.forEach(card => {
      card.addEventListener("click", () => {
        const stationValue = card.getAttribute("data-station");
        fetchBothDirections(stationValue); 

        stationsWrapper.classList.remove("active");
        toggleStationsBtn.textContent = "Show Stations";

      });
    });

    const stationSearchInput = document.getElementById("stationSearch");
    stationSearchInput.addEventListener("keyup", () => {
      const query = stationSearchInput.value.toLowerCase();
      stationCards.forEach(card => {

        const stationName = card.textContent.toLowerCase();
        if (stationName.includes(query)) {
          card.style.display = "inline-block"; 
        } else {
          card.style.display = "none";
        }
      });
    });

    autoLoadBasedOnTime();
});

function loadSettingsIntoModal() {
    const morningStation = localStorage.getItem("morningStation") || "";
    const morningDirection = localStorage.getItem("morningDirection") || "";
    const morningTimeFrom = localStorage.getItem("morningTimeFrom") || "05:00";
    const morningTimeTo = localStorage.getItem("morningTimeTo") || "11:00";

    const eveningStation = localStorage.getItem("eveningStation") || "";
    const eveningDirection = localStorage.getItem("eveningDirection") || "";
    const eveningTimeFrom = localStorage.getItem("eveningTimeFrom") || "12:00";
    const eveningTimeTo = localStorage.getItem("eveningTimeTo") || "20:00";

    document.getElementById("morningStationSelect").value = morningStation;
    document.getElementById("morningDirectionSelect").value = morningDirection;
    document.getElementById("morningTimeFrom").value = morningTimeFrom;
    document.getElementById("morningTimeTo").value = morningTimeTo;

    document.getElementById("eveningStationSelect").value = eveningStation;
    document.getElementById("eveningDirectionSelect").value = eveningDirection;
    document.getElementById("eveningTimeFrom").value = eveningTimeFrom;
    document.getElementById("eveningTimeTo").value = eveningTimeTo;
}

function saveSettings() {
    const morningStation = document.getElementById("morningStationSelect").value;
    const morningDirection = document.getElementById("morningDirectionSelect").value;
    const morningTimeFrom = document.getElementById("morningTimeFrom").value;
    const morningTimeTo = document.getElementById("morningTimeTo").value;

    const eveningStation = document.getElementById("eveningStationSelect").value;
    const eveningDirection = document.getElementById("eveningDirectionSelect").value;
    const eveningTimeFrom = document.getElementById("eveningTimeFrom").value;
    const eveningTimeTo = document.getElementById("eveningTimeTo").value;

    localStorage.setItem("morningStation", morningStation); 
    localStorage.setItem("morningDirection", morningDirection);
    localStorage.setItem("morningTimeFrom", morningTimeFrom);
    localStorage.setItem("morningTimeTo", morningTimeTo);

    localStorage.setItem("eveningStation", eveningStation); 
    localStorage.setItem("eveningDirection", eveningDirection);
    localStorage.setItem("eveningTimeFrom", eveningTimeFrom);
    localStorage.setItem("eveningTimeTo", eveningTimeTo);

    alert("Settings saved!");
}

function toggleMobileDirection() {
    if (!currentStationName || !selectedStationForMobile) return; 

    const isNorthboundVisible = document.getElementById("northboundColumn").style.display === "block";
    const newDirection = isNorthboundVisible ? "Southbound" : "Northbound";

    showDirection(newDirection);
}

function autoLoadBasedOnTime() {

    if (refreshIntervalId !== null) {
       clearInterval(refreshIntervalId);
       refreshIntervalId = null;
    }
    currentStationName = null;
    currentDirection = null;
    selectedStationForMobile = null;

    const morningStation = localStorage.getItem("morningStation");
    const morningDirection = localStorage.getItem("morningDirection");
    const morningTimeFrom = localStorage.getItem("morningTimeFrom");
    const morningTimeTo = localStorage.getItem("morningTimeTo");

    const eveningStation = localStorage.getItem("eveningStation");
    const eveningDirection = localStorage.getItem("eveningDirection");
    const eveningTimeFrom = localStorage.getItem("eveningTimeFrom");
    const eveningTimeTo = localStorage.getItem("eveningTimeTo");

    if (!morningStation || !morningDirection || !morningTimeFrom || !morningTimeTo ||
        !eveningStation || !eveningDirection || !eveningTimeFrom || !eveningTimeTo) {
      console.log("Auto-load check: Missing one or more settings.");

       const stationsWrapper = document.getElementById("stationsWrapper");
       if (!stationsWrapper.classList.contains("active")) {
            const toggleStationsBtn = document.getElementById("toggleStationsBtn");
            stationsWrapper.classList.add("active");
            toggleStationsBtn.textContent = "Hide Stations";
       }
      return; 
    }

    const now = new Date();
    const currentHM = now.getHours().toString().padStart(2,'0') + ":" + now.getMinutes().toString().padStart(2,'0');
    console.log("Auto-load check: Current time:", currentHM);

    let stationToLoad = null;
    let directionToLoad = null;

    if (currentHM >= morningTimeFrom && currentHM <= morningTimeTo) {
      console.log("Auto-load: Matched morning time range.");
      stationToLoad = morningStation;
      directionToLoad = morningDirection;
    } else if (currentHM >= eveningTimeFrom && currentHM <= eveningTimeTo) {
      console.log("Auto-load: Matched evening time range.");
      stationToLoad = eveningStation;
      directionToLoad = eveningDirection;
    }

    if (stationToLoad && directionToLoad) {
         console.log(`Auto-loading station: ${stationToLoad}, direction: ${directionToLoad}`);
         fetchStationWithDirection(stationToLoad, directionToLoad); 
    } else {
        console.log("Auto-load: Current time doesn't match any range. Showing stations.");

        const stationsWrapper = document.getElementById("stationsWrapper");
        const toggleStationsBtn = document.getElementById("toggleStationsBtn");
        stationsWrapper.classList.add("active");
        toggleStationsBtn.textContent = "Hide Stations";

        document.getElementById("northboundColumn").style.display = "none";
        document.getElementById("southboundColumn").style.display = "none";
        document.getElementById("mobileSwitchDirection").style.display = "none";
        document.getElementById('selectedStationHeader').textContent = '';
    }
}

function startAutoRefresh() {

  if (refreshIntervalId !== null) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }

  if (currentStationName) {
    console.log(`Starting auto-refresh for ${currentStationName} (${currentDirection || 'None'}) every ${REFRESH_INTERVAL_MS / 1000} seconds.`);
    refreshIntervalId = setInterval(refreshCurrentStationData, REFRESH_INTERVAL_MS);
  } else {
     console.log("No station selected, auto-refresh not started.");
  }
}

async function refreshCurrentStationData() {
  if (!currentStationName) {
    console.log("Auto-refresh called but no station selected. Stopping.");
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
    return;
  }

  console.log(`Refreshing data for ${currentStationName} (${currentDirection})...`);

  try {
    if (currentDirection === "Northbound") {
        await getTrainsForDirection(currentStationName, "Northbound");
    } else if (currentDirection === "Southbound") {
        await getTrainsForDirection(currentStationName, "Southbound");
    } else if (currentDirection === "Both") {

        await Promise.all([
            getTrainsForDirection(currentStationName, "Northbound"),
            getTrainsForDirection(currentStationName, "Southbound")
        ]);
    }
     console.log(`Data refreshed for ${currentStationName}.`);
  } catch (error) {
      console.error("Error during auto-refresh:", error);

  }
}

function updateStationHeader(stationName) {

    const decodedName = decodeURIComponent(stationName);
    document.getElementById('selectedStationHeader').textContent = `Current Station: ${decodedName}`;
}

function fetchStationWithDirection(stationName, direction) {
  updateStationHeader(stationName);

  currentStationName = stationName;
  currentDirection = direction; 
  selectedStationForMobile = stationName; 

  document.getElementById("northboundResults").innerHTML = "";
  document.getElementById("southboundResults").innerHTML = "";

  const northCol = document.getElementById("northboundColumn");
  const southCol = document.getElementById("southboundColumn");
  const trainContainer = document.getElementById("trainContainer");

  northCol.style.display = direction === "Northbound" ? "block" : "none";
  southCol.style.display = direction === "Southbound" ? "block" : "none";

  getTrainsForDirection(stationName, direction)
    .then(startAutoRefresh)
    .catch(error => {
        console.error(`Error fetching initial ${direction} data:`, error);

        if (refreshIntervalId !== null) {
           clearInterval(refreshIntervalId);
           refreshIntervalId = null;
        }
        currentStationName = null;
        currentDirection = null;
        selectedStationForMobile = null;
    });

  trainContainer.style.display = "flex"; 
  document.getElementById("directionChoice").style.display = "none";

  if (window.innerWidth < 600) {
       document.getElementById("mobileSwitchDirection").style.display = "block";
  } else {
       document.getElementById("mobileSwitchDirection").style.display = "none";
  }

  const stationsWrapper = document.getElementById("stationsWrapper");
  const toggleStationsBtn = document.getElementById("toggleStationsBtn");
  if (stationsWrapper.classList.contains("active")){
    stationsWrapper.classList.remove("active");
    toggleStationsBtn.textContent = "Show Stations";
  }
}

async function fetchBothDirections(stationName) {
  updateStationHeader(stationName);

  currentStationName = stationName;
  selectedStationForMobile = stationName; 

  document.getElementById("northboundResults").innerHTML = "";
  document.getElementById("southboundResults").innerHTML = "";

  if (window.innerWidth < 600) {

    document.getElementById("trainContainer").style.display = "none"; 
    document.getElementById("directionChoice").style.display = "block"; 
    document.getElementById("mobileSwitchDirection").style.display = "none"; 

     if (refreshIntervalId !== null) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
     }

     currentDirection = null;

  } else {

    currentDirection = "Both"; 
    document.getElementById("trainContainer").style.display = "flex";
    document.getElementById("directionChoice").style.display = "none";
    document.getElementById("mobileSwitchDirection").style.display = "none";

    document.getElementById("northboundColumn").style.display = "block";
    document.getElementById("southboundColumn").style.display = "block";

    try {

        await Promise.all([
            getTrainsForDirection(stationName, "Northbound"),
            getTrainsForDirection(stationName, "Southbound")
        ]);
        startAutoRefresh();
    } catch (error) {
        console.error("Error fetching initial data for both directions:", error);

        if (refreshIntervalId !== null) {
           clearInterval(refreshIntervalId);
           refreshIntervalId = null;
        }
        currentStationName = null;
        currentDirection = null;
        selectedStationForMobile = null;
    }
  }
}

function showDirection(direction) {
  const stationName = selectedStationForMobile; 
  if (!stationName) {
      console.error("Cannot show direction, no station selected for mobile view.");
      return;
  }

  updateStationHeader(stationName);

  currentStationName = stationName;
  currentDirection = direction;

  document.getElementById("trainContainer").style.display = "flex";
  document.getElementById("directionChoice").style.display = "none"; 
  document.getElementById("mobileSwitchDirection").style.display = "block"; 

  document.getElementById("northboundResults").innerHTML = "";
  document.getElementById("southboundResults").innerHTML = "";

  const northCol = document.getElementById("northboundColumn");
  const southCol = document.getElementById("southboundColumn");

  northCol.style.display = direction === "Northbound" ? "block" : "none";
  southCol.style.display = direction === "Southbound" ? "block" : "none";

   getTrainsForDirection(stationName, direction)
      .then(startAutoRefresh)
      .catch(error => {
          console.error(`Error fetching initial ${direction} data (mobile):`, error);

          if (refreshIntervalId !== null) {
             clearInterval(refreshIntervalId);
             refreshIntervalId = null;
          }
          currentStationName = null;
          currentDirection = null;
          selectedStationForMobile = null;
      });
}

async function getTrainsForDirection(stationName, direction) {

    const encodedStationName = encodeURIComponent(stationName);
    const apiUrl = `https://corsproxy.io/?http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML?StationDesc=${encodedStationName}`;
    const resultsDivId = direction === "Northbound" ? "northboundResults" : "southboundResults";
    const resultsDiv = document.getElementById(resultsDivId);

    if (!resultsDiv) {
        console.error(`Results container div not found: ${resultsDivId}`);
        return; 
    }

    resultsDiv.classList.add('fade-out');

    try {
      const response = await fetch(apiUrl);
       if (!response.ok) {

           let errorBody = '';
           try { errorBody = await response.text(); } catch (e) {  }
           throw new Error(`HTTP error! status: ${response.status} ${response.statusText}. ${errorBody}`);
       }
      const data = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, "text/xml");

      const parserError = xmlDoc.querySelector("parsererror");
        if (parserError) {
            console.error("XML Parsing Error:", parserError.textContent);
            throw new Error("Failed to parse train data XML.");
        }

        if (!xmlDoc.getElementsByTagName("ArrayOfObjStationData").length) {
             console.warn(`No ArrayOfObjStationData found for ${stationName} ${direction}. API might have returned empty or error structure.`);

        }

      const trains = Array.from(xmlDoc.getElementsByTagName("objStationData"));
      const directionTrains = trains.filter(t => {
        const dir = t.getElementsByTagName("Direction")[0]?.textContent;
        return dir === direction;
      });

      directionTrains.sort((a,b) => {
        const dueA = parseInt(a.getElementsByTagName("Duein")[0]?.textContent || "9999");
        const dueB = parseInt(b.getElementsByTagName("Duein")[0]?.textContent || "9999");
        return dueA - dueB;
      });

      const nextFour = directionTrains.slice(0,4);

      let html = "";
      if (nextFour.length > 0) {
          nextFour.forEach(train => {
            const destination = train.getElementsByTagName("Destination")[0]?.textContent || 'N/A';
            const dueIn = train.getElementsByTagName("Duein")[0]?.textContent || '?';
            const late = train.getElementsByTagName("Late")[0]?.textContent;

             let status = "On time"; 
             if (parseInt(late) > 0) {
                 status = `${late} min late`;
             }

             const trainStatusElem = train.getElementsByTagName("Status")[0]?.textContent;
             if (trainStatusElem && trainStatusElem !== 'En Route') { 

             }

            html += `
              <div class="train-card train-card-animate" style="margin-bottom:1rem;">
                <div class="train-banner-text" style="font-size:1.2rem;">${direction}</div>
                <div class="card-body">
                  <h5 class="card-title train-banner-text">Dest: ${destination}</h5>
                  <p class="card-text train-banner-text nova-text">
                    Due in: ${dueIn} mins
                  </p>
                  <p class="card-text" style="font-size:0.85rem; margin-top: 0.7rem;">Status: ${status}</p>
                </div>
              </div>
            `;
          });
      } else {

        html = `<p style="padding: 1rem;">No upcoming ${direction} trains found for ${decodeURIComponent(stationName)}.</p>`;
      }

       setTimeout(() => {
         resultsDiv.innerHTML = html;
         resultsDiv.classList.remove('fade-out'); 
      }, 150); 

    } catch (err) {
      console.error(`Error fetching/processing train data for ${direction} ${stationName}:`, err);

      setTimeout(() => {
         resultsDiv.innerHTML = `<p style="padding: 1rem; color: red;">Error loading ${direction} data. Please try again later.</p>`; 
         resultsDiv.classList.remove('fade-out'); 
      }, 300);
      throw err; 
    }
}