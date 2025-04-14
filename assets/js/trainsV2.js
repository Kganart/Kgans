document.addEventListener("DOMContentLoaded", () => {
    const settingsModal = document.getElementById("settingsModal");
    const openModalBtn = document.getElementById("settingsBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  
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
  
  // ================================================
  //     SETTINGS MODAL: LOAD & SAVE
  // ================================================
  function loadSettingsIntoModal() {
    // read from localStorage (if any) and fill the modal inputs
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
    // read values from modal inputs, store them to localStorage
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
  
  // ================================================
  //    AUTO LOAD BASED ON TIME 
  // ================================================
  function autoLoadBasedOnTime() {
    const morningStation = localStorage.getItem("morningStation");
    const morningDirection = localStorage.getItem("morningDirection");
    const morningTimeFrom = localStorage.getItem("morningTimeFrom"); // e.g. "05:00"
    const morningTimeTo = localStorage.getItem("morningTimeTo");     // e.g. "11:00"
  
    const eveningStation = localStorage.getItem("eveningStation");
    const eveningDirection = localStorage.getItem("eveningDirection");
    const eveningTimeFrom = localStorage.getItem("eveningTimeFrom"); // e.g. "12:00"
    const eveningTimeTo = localStorage.getItem("eveningTimeTo");     // e.g. "20:00"
  
    if (!morningStation || !morningDirection || !morningTimeFrom || !morningTimeTo ||
        !eveningStation || !eveningDirection || !eveningTimeFrom || !eveningTimeTo) {
      return; // no settings yet
    }
  
    // Current time in HH:MM
    const now = new Date();
    const currentHM = now.getHours().toString().padStart(2,'0') + ":" + now.getMinutes().toString().padStart(2,'0');
  
    if (currentHM >= morningTimeFrom && currentHM <= morningTimeTo) {
      // morning range
      fetchStationWithDirection(morningStation, morningDirection);
    } else if (currentHM >= eveningTimeFrom && currentHM <= eveningTimeTo) {
      // evening range
      fetchStationWithDirection(eveningStation, eveningDirection);
    }
  }
  
  // helper to load a single direction, or both. 
  function fetchStationWithDirection(stationName, direction) {

    document.getElementById("northboundResults").innerHTML = "";
    document.getElementById("southboundResults").innerHTML = "";
  
    if (direction === "Northbound") {
      getTrainsForDirection(stationName, "Northbound");
    } else {
      getTrainsForDirection(stationName, "Southbound");
    }
  }
  
 
  async function fetchBothDirections(stationName) {
  
    document.getElementById("northboundResults").innerHTML = "";
    document.getElementById("southboundResults").innerHTML = "";
  
    if (window.innerWidth < 600) {
      document.getElementById("trainContainer").style.display = "none";
      document.getElementById("directionChoice").style.display = "block";
      window.selectedStationForMobile = stationName;
    } else {
      document.getElementById("trainContainer").style.display = "flex";
      document.getElementById("directionChoice").style.display = "none";
      await getTrainsForDirection(stationName, "Northbound");
      await getTrainsForDirection(stationName, "Southbound");
    }
  }
  
  function showDirection(direction) {
    document.getElementById("trainContainer").style.display = "flex";
    document.getElementById("directionChoice").style.display = "none";
  
    document.getElementById("northboundResults").innerHTML = "";
    document.getElementById("southboundResults").innerHTML = "";
  
    if (direction === "Northbound") {
      getTrainsForDirection(window.selectedStationForMobile, "Northbound");
    } else {
      getTrainsForDirection(window.selectedStationForMobile, "Southbound");
    }
  }
  
  async function getTrainsForDirection(stationName, direction) {
    const apiUrl = `https://corsproxy.io/?http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML?StationDesc=${stationName}`;
    try {
      const response = await fetch(apiUrl);
      const data = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, "text/xml");
  
      const trains = Array.from(xmlDoc.getElementsByTagName("objStationData"));
      const directionTrains = trains.filter(t => {
        const dir = t.getElementsByTagName("Direction")[0]?.textContent;
        return dir === direction;
      });
      

      directionTrains.sort((a,b) => {
        const dueA = parseInt(a.getElementsByTagName("Duein")[0]?.textContent || "999");
        const dueB = parseInt(b.getElementsByTagName("Duein")[0]?.textContent || "999");
        return dueA - dueB;
      });
  
      const nextFour = directionTrains.slice(0,4);
  
      // Build HTML
      let html = "";
      nextFour.forEach(train => {
        const destination = train.getElementsByTagName("Destination")[0]?.textContent;
        const dueIn = train.getElementsByTagName("Duein")[0]?.textContent;
        const late = train.getElementsByTagName("Late")[0]?.textContent;
        const status = parseInt(late) > 0 ? `${late} min late` : "On time";
  
        html += `
          <div class="train-card" style="margin-bottom:1rem;">
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
  
      if (nextFour.length === 0) {
        html = `<p>No upcoming trains for ${direction} at this station.</p>`;
      }
  
      if (direction === "Northbound") {
        document.getElementById("northboundResults").innerHTML = html;
      } else {
        document.getElementById("southboundResults").innerHTML = html;
      }
    } catch (err) {
      console.error("Error fetching train data:", err);
      if (direction === "Northbound") {
        document.getElementById("northboundResults").innerHTML = "Error loading data";
      } else {
        document.getElementById("southboundResults").innerHTML = "Error loading data";
      }
    }
  }
  
  function configureUserSettings() {

    const morningStation = prompt("Enter your morning station (exact name):", localStorage.getItem("morningStation") || "Howth");
    const eveningStation = prompt("Enter your evening station (exact name):", localStorage.getItem("eveningStation") || "Raheny");
    const morningRange = prompt("Enter morning range (e.g. 05-11 for 5am-11am):", localStorage.getItem("morningRange") || "05-11");
    const eveningRange = prompt("Enter evening range (e.g. 12-20 for 12pm-8pm):", localStorage.getItem("eveningRange") || "12-20");
  
    if (morningStation && eveningStation && morningRange && eveningRange) {
      localStorage.setItem("morningStation", morningStation);
      localStorage.setItem("eveningStation", eveningStation);
      localStorage.setItem("morningRange", morningRange);
      localStorage.setItem("eveningRange", eveningRange);
      alert("Settings saved!");
    } else {
      alert("Settings not saved, missing some values.");
    }
  }
