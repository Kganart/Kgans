/**
 * Train Times Application - Main Controller
 * Handles station selection, settings management, and real-time data fetching
 */

document.addEventListener("DOMContentLoaded", () => {
    // DOM element references
    const settingsModal = document.getElementById("settingsModal");
    const openModalBtn = document.getElementById("settingsBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    const toggleStationsBtn = document.getElementById("toggleStationsBtn");
    const stationsWrapper = document.getElementById("stationsWrapper");
    const stationCardsContainer = document.getElementById("stationCardsContainer");
    const stationCards = stationCardsContainer.querySelectorAll(".station-card");
    const stationSearchInput = document.getElementById("stationSearch");

    // Initialize direction columns as hidden
    document.getElementById("northboundColumn").style.display = "none";
    document.getElementById("southboundColumn").style.display = "none";

    // Event handlers for settings modal
    openModalBtn.addEventListener("click", () => {
        settingsModal.style.display = "block";
        loadSettingsIntoModal();
    });

    closeModalBtn.addEventListener("click", () => {
        settingsModal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === settingsModal) settingsModal.style.display = "none";
    });

    saveSettingsBtn.addEventListener("click", () => {
        saveSettings();
        settingsModal.style.display = "none";
    });

    // Station list management
    toggleStationsBtn.addEventListener("click", () => {
        const isActive = stationsWrapper.classList.toggle("active");
        toggleStationsBtn.textContent = isActive ? "Hide Stations" : "Show Stations";
    });

    // Station card interactions
    stationCards.forEach(card => {
        card.addEventListener("click", () => {
            const stationValue = card.getAttribute("data-station");
            fetchBothDirections(stationValue);
            stationsWrapper.classList.remove("active");
            toggleStationsBtn.textContent = "Show Stations";
            document.getElementById("northboundColumn").style.display = "block";
            document.getElementById("southboundColumn").style.display = "block";
        });
    });

    // Station search functionality
    stationSearchInput.addEventListener("keyup", () => {
        const query = stationSearchInput.value.toLowerCase();
        stationCards.forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(query) 
                ? "inline-block" 
                : "none";
        });
    });

    // Initial load logic
    autoLoadBasedOnTime();
    
    // Show stations if no auto-load occurred
    setTimeout(() => {
        if (!document.getElementById("selectedStationHeader").textContent) {
            stationsWrapper.classList.add("active");
            toggleStationsBtn.textContent = "Hide Stations";
        }
    }, 100);
});

// ================================================
// Settings Management
// ================================================

/**
 * Loads user settings from localStorage into modal form
 */
function loadSettingsIntoModal() {
    const loadSetting = (key, defaultValue) => localStorage.getItem(key) || defaultValue;
    
    // Morning settings
    document.getElementById("morningStationSelect").value = loadSetting("morningStation", "");
    document.getElementById("morningDirectionSelect").value = loadSetting("morningDirection", "");
    document.getElementById("morningTimeFrom").value = loadSetting("morningTimeFrom", "05:00");
    document.getElementById("morningTimeTo").value = loadSetting("morningTimeTo", "11:00");

    // Evening settings
    document.getElementById("eveningStationSelect").value = loadSetting("eveningStation", "");
    document.getElementById("eveningDirectionSelect").value = loadSetting("eveningDirection", "");
    document.getElementById("eveningTimeFrom").value = loadSetting("eveningTimeFrom", "12:00");
    document.getElementById("eveningTimeTo").value = loadSetting("eveningTimeTo", "20:00");
}

/**
 * Saves user settings from modal form to localStorage
 */
function saveSettings() {
    const getValue = id => document.getElementById(id).value;
    
    // Morning settings
    localStorage.setItem("morningStation", getValue("morningStationSelect"));
    localStorage.setItem("morningDirection", getValue("morningDirectionSelect"));
    localStorage.setItem("morningTimeFrom", getValue("morningTimeFrom"));
    localStorage.setItem("morningTimeTo", getValue("morningTimeTo"));

    // Evening settings
    localStorage.setItem("eveningStation", getValue("eveningStationSelect"));
    localStorage.setItem("eveningDirection", getValue("eveningDirectionSelect"));
    localStorage.setItem("eveningTimeFrom", getValue("eveningTimeFrom"));
    localStorage.setItem("eveningTimeTo", getValue("eveningTimeTo"));

    alert("Settings saved!");
}

// ================================================
// Core Application Logic
// ================================================

/**
 * Automatically loads trains based on time of day and user settings
 */
function autoLoadBasedOnTime() {
    const getSetting = key => localStorage.getItem(key);
    const now = new Date();
    const currentHM = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

    // Check morning time window
    if (currentHM >= getSetting("morningTimeFrom") && currentHM <= getSetting("morningTimeTo")) {
        fetchStationWithDirection(getSetting("morningStation"), getSetting("morningDirection"));
    } 
    // Check evening time window
    else if (currentHM >= getSetting("eveningTimeFrom") && currentHM <= getSetting("eveningTimeTo")) {
        fetchStationWithDirection(getSetting("eveningStation"), getSetting("eveningDirection"));
    }
}

/**
 * Fetches train data for a single direction
 * @param {string} stationName - Selected station name
 * @param {string} direction - Northbound/Southbound
 */
function fetchStationWithDirection(stationName, direction) {
    updateStationHeader(stationName);
    document.getElementById("northboundResults").innerHTML = "";
    document.getElementById("southboundResults").innerHTML = "";
    getTrainsForDirection(stationName, direction);
}

/**
 * Fetches train data for both directions
 * @param {string} stationName - Selected station name
 */
async function fetchBothDirections(stationName) {
    updateStationHeader(stationName);
    document.getElementById("northboundResults").innerHTML = "";
    document.getElementById("southboundResults").innerHTML = "";

    if (window.innerWidth < 600) {
        // Mobile view - show direction choice
        document.getElementById("trainContainer").style.display = "none";
        document.getElementById("directionChoice").style.display = "block";
        window.selectedStationForMobile = stationName;
        document.getElementById("mobileSwitchDirection").style.display = "none";
    } else {
        // Desktop view - show both directions
        document.getElementById("trainContainer").style.display = "flex";
        document.getElementById("directionChoice").style.display = "none";
        document.getElementById("northboundColumn").style.display = "block";
        document.getElementById("southboundColumn").style.display = "block";
        await getTrainsForDirection(stationName, "Northbound");
        await getTrainsForDirection(stationName, "Southbound");
    }
}

/**
 * Handles mobile direction selection
 * @param {string} direction - Selected direction (Northbound/Southbound)
 */
function showDirection(direction) {
    document.getElementById("trainContainer").style.display = "flex";
    document.getElementById("directionChoice").style.display = "none";
    document.getElementById("mobileSwitchDirection").style.display = "block";

    // Clear existing results and show selected direction
    document.getElementById("northboundResults").innerHTML = "";
    document.getElementById("southboundResults").innerHTML = "";
    
    if (direction === "Northbound") {
        document.getElementById("northboundColumn").style.display = "block";
        getTrainsForDirection(window.selectedStationForMobile, "Northbound");
    } else {
        document.getElementById("southboundColumn").style.display = "block";
        getTrainsForDirection(window.selectedStationForMobile, "Southbound");
    }
}

/**
 * Toggles direction display for mobile view
 */
function toggleMobileDirection() {
    const currentDirection = document.getElementById("northboundColumn").style.display === "block" 
        ? "Northbound" 
        : "Southbound";
    showDirection(currentDirection === "Northbound" ? "Southbound" : "Northbound");
}

// ================================================
// Data Fetching & UI Helpers
// ================================================

/**
 * Fetches and displays train data for a specific direction
 * @param {string} stationName - Selected station name
 * @param {string} direction - Northbound/Southbound
 */
async function getTrainsForDirection(stationName, direction) {
    try {
        const apiUrl = `https://corsproxy.io/?http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML?StationDesc=${stationName}`;
        const response = await fetch(apiUrl);
        const xmlDoc = new DOMParser().parseFromString(await response.text(), "text/xml");
        
        // Process XML data
        const trains = Array.from(xmlDoc.getElementsByTagName("objStationData"))
            .filter(t => t.getElementsByTagName("Direction")[0]?.textContent === direction)
            .sort((a, b) => {
                const dueA = parseInt(a.getElementsByTagName("Duein")[0]?.textContent || 999;
                const dueB = parseInt(b.getElementsByTagName("Duein")[0]?.textContent || 999;
                return dueA - dueB;
            })
            .slice(0, 4);

        // Generate HTML for train cards
        const html = trains.length > 0 
            ? trains.map(train => generateTrainCard(train, direction)).join("") 
            : `<p>No upcoming trains for ${direction} at this station.</p>`;

        // Update appropriate results column
        document.getElementById(`${direction.toLowerCase()}Results`).innerHTML = html;
    } catch (err) {
        console.error("Error fetching train data:", err);
        document.getElementById(`${direction.toLowerCase()}Results`).innerHTML = "Error loading data";
    }
}

/**
 * Generates HTML for a train card
 * @param {Element} train - XML train data element
 * @param {string} direction - Train direction
 */
function generateTrainCard(train, direction) {
    const destination = train.getElementsByTagName("Destination")[0]?.textContent;
    const dueIn = train.getElementsByTagName("Duein")[0]?.textContent;
    const late = parseInt(train.getElementsByTagName("Late")[0]?.textContent || 0);

    return `
        <div class="train-card" style="margin-bottom:1rem;">
            <div class="train-banner-text" style="font-size:1.2rem;">${direction}</div>
            <div class="card-body">
                <h5 class="card-title train-banner-text">Dest: ${destination}</h5>
                <p class="card-text train-banner-text nova-text">
                    Due in: ${dueIn} mins
                </p>
                <p class="card-text" style="font-size:0.85rem; margin-top: 0.7rem;">
                    Status: ${late > 0 ? `${late} min late` : "On time"}
                </p>
            </div>
        </div>
    `;
}

/**
 * Updates the station header display
 * @param {string} stationName - Selected station name
 */
function updateStationHeader(stationName) {
    document.getElementById('selectedStationHeader').textContent = 
        `Current Station: ${decodeURIComponent(stationName)}`;
}