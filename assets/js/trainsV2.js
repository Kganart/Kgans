document.addEventListener("DOMContentLoaded", () => {
    const stationSearchInput = document.getElementById("stationSearch");
    const stationCardsContainer = document.getElementById("stationCardsContainer");
    const stationCards = stationCardsContainer.querySelectorAll(".station-card");

    stationSearchInput.addEventListener("keyup", () => {
      const query = stationSearchInput.value.toLowerCase();
      stationCards.forEach(card => {
        const stationName = card.textContent.toLowerCase();
        // Hide/show if it contains query
        if (stationName.includes(query)) {
          card.style.display = "inline-block";
        } else {
          card.style.display = "none";
        }
      });
    });
  
    // When a station card is clicked, fetch data for that station
    stationCards.forEach(card => {
      card.addEventListener("click", () => {
        const stationValue = card.getAttribute("data-station");
        fetchBothDirections(stationValue);
      });
    });
  
    const settingsBtn = document.getElementById("settingsBtn");
    settingsBtn.addEventListener("click", () => {
      configureUserSettings();
    });

    autoLoadBasedOnTime();
  });
  

  async function fetchBothDirections(stationName) {
    // Clear existing
    document.getElementById("northboundResults").innerHTML = "";
    document.getElementById("southboundResults").innerHTML = "";
  
    // For large screens (desktop), show both columns by default
    // For small screens, display a directionChoice prompt
    if (window.innerWidth < 600) {
      document.getElementById("trainContainer").style.display = "none";
      document.getElementById("directionChoice").style.display = "block";
  
      // Temporarily store stationName in a global or local variable
      window.selectedStationForMobile = stationName;
    } else {
      document.getElementById("trainContainer").style.display = "flex";
      document.getElementById("directionChoice").style.display = "none";
  
      await getTrainsForDirection(stationName, "Northbound");
      await getTrainsForDirection(stationName, "Southbound");
    }
  }
  
  async function showDirection(direction) {
    document.getElementById("trainContainer").style.display = "flex";
    document.getElementById("directionChoice").style.display = "none";
  
    document.getElementById("northboundResults").innerHTML = "";
    document.getElementById("southboundResults").innerHTML = "";

    if (direction === "Northbound") {
      await getTrainsForDirection(window.selectedStationForMobile, "Northbound");
    } else {
      await getTrainsForDirection(window.selectedStationForMobile, "Southbound");
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
          <div class="card ani-ctrl-gradient-2" style="margin-bottom:1rem;">
            <div class="light-banner-text" style="font-size:1.2rem;">${direction}</div>
            <div class="card-body">
              <h5 class="card-title light-banner-text">Dest: ${destination}</h5>
              <p class="card-text light-banner-text nova-text">
                Due in: ${dueIn} mins
              </p>
              <p class="card-text" style="font-size:0.85rem;">Status: ${status}</p>
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
  function autoLoadBasedOnTime() {
    const morningStation = localStorage.getItem("morningStation");
    const eveningStation = localStorage.getItem("eveningStation");
    const morningRange = localStorage.getItem("morningRange"); // e.g. "05-11"
    const eveningRange = localStorage.getItem("eveningRange"); // e.g. "12-20"
    
    if (!morningStation || !eveningStation || !morningRange || !eveningRange) {
      return; 
    }
  
    const now = new Date();
    const hour = now.getHours();
    
    const [morningMin, morningMax] = morningRange.split("-").map(n=>parseInt(n,10));
    const [eveningMin, eveningMax] = eveningRange.split("-").map(n=>parseInt(n,10));
  
    let stationToUse = null;
  
    if (hour >= morningMin && hour <= morningMax) {
      stationToUse = morningStation;
    } else if (hour >= eveningMin && hour <= eveningMax) {
      stationToUse = eveningStation;
    }
  
    if (stationToUse) {
      fetchBothDirections(stationToUse);
    }
  }
  