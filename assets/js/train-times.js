document.addEventListener("DOMContentLoaded", function () {
    const stationName = "Howth";
    
    // You can use a CORS proxy if needed
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    const apiUrl = `http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML?StationDesc=${stationName}`;

    // Fetch data from the Irish Rail Realtime API
    fetch(proxyUrl + apiUrl)
        .then(response => response.text())  // Get the response as text (since it's XML)
        .then(data => {
            // Parse the XML data
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");

            // Get all train entries from the XML response
            const trains = xmlDoc.getElementsByTagName("objStationData");

            if (trains.length === 0) {
                document.getElementById("train-times").innerHTML = "No trains currently available.";
                return;
            }

            // Build the output HTML
            let output = "<ul>";
            for (let i = 0; i < trains.length; i++) {
                const train = trains[i];

                // Extract train details
                const destination = train.getElementsByTagName("Destination")[0].textContent;
                const dueIn = train.getElementsByTagName("Duein")[0].textContent;
                const direction = train.getElementsByTagName("Direction")[0].textContent;
                const trainType = train.getElementsByTagName("Traintype")[0].textContent;
                const expArrival = train.getElementsByTagName("Exparrival")[0].textContent;

                output += `<li>
                    <strong>Train to ${destination}</strong> (${trainType}) - ${direction}, Due in: ${dueIn} minutes, Expected arrival: ${expArrival}
                </li>`;
            }
            output += "</ul>";

            // Display the train times on the webpage
            document.getElementById("train-times").innerHTML = output;
        })
        .catch(error => {
            console.error("Error fetching the train times:", error);
            document.getElementById("train-times").innerHTML = `<p class="error">Error loading train times.</p>`;
        });
});
