/**
 * Train Times Application - Main Controller
 * Handles station selection, settings management, and real-time data fetching
 */

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const settingsModal = document.getElementById("settingsModal");
    const openModalBtn = document.getElementById("settingsBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    const toggleStationsBtn = document.getElementById("toggleStationsBtn");
    const stationsWrapper = document.getElementById("stationsWrapper");
    const stationCards = document.querySelectorAll(".station-card");
    const stationSearchInput = document.getElementById("stationSearch");
    
    // Initialize direction visibility
    document.getElementById("northboundColumn").style.display = "none";
    document.getElementById("southboundColumn").style.display = "none";

    // Modal Handling
    openModalBtn.addEventListener("click", () => {
        settingsModal.style.display = "block";
        loadSettingsIntoModal();
    });

    closeModalBtn.addEventListener("click", () => settingsModal.style.display = "none");
    window.addEventListener("click", (e) => e.target === settingsModal && (settingsModal.style.display = "none"));
    saveSettingsBtn.addEventListener("click", () => {
        saveSettings();
        settingsModal.style.display = "none";
    });

    // Station List Toggle
    toggleStationsBtn.addEventListener("click", () => {
        const isActive = stationsWrapper.classList.toggle("active");
        toggleStationsBtn.textContent = isActive ? "Hide Stations" : "Show Stations";
    });

    // Station Selection
    stationCards.forEach(card => card.addEventListener("click", function() {
        const station = this.getAttribute("data-station");
        fetchBothDirections(station);
        stationsWrapper.classList.remove("active");
        toggleStationsBtn.textContent = "Show Stations";
    }));

    // Station Search
    stationSearchInput.addEventListener("input", () => {
        const query = stationSearchInput.value.toLowerCase();
        stationCards.forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(query) ? "inline-block" : "none";
        });
    });

    // Initial Load
    autoLoadBasedOnTime();
    
    // Show stations if no auto-load
    setTimeout(() => {
        if (!document.getElementById("selectedStationHeader").textContent) {
            stationsWrapper.classList.add("active");
            toggleStationsBtn.textContent = "Hide Stations";
        }
    }, 100);
});

// Settings Management
function loadSettingsIntoModal() {
    const getSetting = key => localStorage.getItem(key) || "";
    document.getElementById("morningStationSelect").value = getSetting("morningStation");
    document.getElementById("morningDirectionSelect").value = getSetting("morningDirection");
    document.getElementById("morningTimeFrom").value = getSetting("morningTimeFrom") || "05:00";
    document.getElementById("morningTimeTo").value = getSetting("morningTimeTo") || "11:00";
    document.getElementById("eveningStationSelect").value = getSetting("eveningStation");
    document.getElementById("eveningDirectionSelect").value = getSetting("eveningDirection");
    document.getElementById("eveningTimeFrom").value = getSetting("eveningTimeFrom") || "12:00";
    document.getElementById("eveningTimeTo").value = getSetting("eveningTimeTo") || "20:00";
}

function saveSettings() {
    const getValue = id => document.getElementById(id).value;
    localStorage.setItem("morningStation", getValue("morningStationSelect"));
    localStorage.setItem("morningDirection", getValue("morningDirectionSelect"));
    localStorage.setItem("morningTimeFrom", getValue("morningTimeFrom"));
    localStorage.setItem("morningTimeTo", getValue("morningTimeTo"));
    localStorage.setItem("eveningStation", getValue("eveningStationSelect"));
    localStorage.setItem("eveningDirection", getValue("eveningDirectionSelect"));
    localStorage.setItem("eveningTimeFrom", getValue("eveningTimeFrom"));
    localStorage.setItem("eveningTimeTo", getValue("eveningTimeTo"));
    alert("Settings saved!");
}

// Core Functionality
function autoLoadBasedOnTime() {
    const getTime = key => localStorage.getItem(key);
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    
    const morningActive = currentTime >= getTime("morningTimeFrom") && currentTime <= getTime("morningTimeTo");
    const eveningActive = currentTime >= getTime("eveningTimeFrom") && currentTime <= getTime("eveningTimeTo");
    
    if (morningActive) {
        fetchStationWithDirection(localStorage.getItem("morningStation"), localStorage.getItem("morningDirection"));
    } else if (eveningActive) {
        fetchStationWithDirection(localStorage.getItem("eveningStation"), localStorage.getItem("eveningDirection"));
    }
}

function fetchStationWithDirection(station, direction) {
    updateStationHeader(station);
    document.getElementById("northboundResults").innerHTML = "";
    document.getElementById("southboundResults").innerHTML = "";
    
    if (direction === "Northbound") {
        getTrainsForDirection(station, "Northbound");
        document.getElementById("northboundColumn").style.display = "block";
    } else {
        getTrainsForDirection(station, "Southbound");
        document.getElementById("southboundColumn").style.display = "block";
    }
}

async function fetchBothDirections(station) {
    updateStationHeader(station);
    document.getElementById("northboundResults").innerHTML = "";
    document.getElementById("southboundResults").innerHTML = "";
    
    if (window.innerWidth < 600) {
        document.getElementById("trainContainer").style.display = "none";
        document.getElementById("directionChoice").style.display = "block";
        window.selectedStationForMobile = station;
    } else {
        document.getElementById("trainContainer").style.display = "flex";
        document.getElementById("northboundColumn").style.display = "block";
        document.getElementById("southboundColumn").style.display = "block";
        await getTrainsForDirection(station, "Northbound");
        await getTrainsForDirection(station, "Southbound");
    }
}

function showDirection(direction) {
    document.getElementById("trainContainer").style.display = "flex";
    document.getElementById("directionChoice").style.display = "none";
    document.getElementById("northboundColumn").style.display = direction === "Northbound" ? "block" : "none";
    document.getElementById("southboundColumn").style.display = direction === "Southbound" ? "block" : "none";
    getTrainsForDirection(window.selectedStationForMobile, direction);
}

// Mobile Direction Toggle
function toggleMobileDirection() {
    const currentDirection = document.getElementById("northboundColumn").style.display === "block" 
        ? "Northbound" 
        : "Southbound";
    showDirection(currentDirection === "Northbound" ? "Southbound" : "Northbound");
}

// Data Fetching
async function getTrainsForDirection(stationName, direction) {
    try {
        const response = await fetch(
            `https://corsproxy.io/?http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML?StationDesc=${stationName}`
        );
        const xml = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "text/xml");
        
        const trains = Array.from(xmlDoc.getElementsByTagName("objStationData"))
            .filter(t => t.getElementsByTagName("Direction")[0].textContent === direction)
            .sort((a, b) => parseInt(a.getElementsByTagName("Duein")[0].textContent) - parseInt(b.getElementsByTagName("Duein")[0].textContent))
            .slice(0, 4);

        const results = trains.map(train => {
            const destination = train.getElementsByTagName("Destination")[0].textContent;
            const dueIn = train.getElementsByTagName("Duein")[0].textContent;
            const late = train.getElementsByTagName("Late")[0].textContent;
            return `
                <div class="train-card">
                    <div class="train-banner-text">${direction}</div>
                    <div class="card-body">
                        <h5>Dest: ${destination}</h5>
                        <p>Due in: ${dueIn} mins</p>
                        <p>Status: ${late > 0 ? `${late} min late` : "On time"}</p>
                    </div>
                </div>
            `;
        }).join("");

        document.getElementById(`${direction.toLowerCase()}Results`).innerHTML = results || `<p>No trains found for ${direction}</p>`;
    } catch (error) {
        console.error("Fetch error:", error);
        document.getElementById(`${direction.toLowerCase()}Results`).innerHTML = "Error loading data";
    }
}

// Helper Functions
function updateStationHeader(stationName) {
    document.getElementById("selectedStationHeader").textContent = `Current Station: ${decodeURIComponent(stationName)}`;
}