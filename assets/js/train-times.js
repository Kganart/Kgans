document.addEventListener("DOMContentLoaded", function () {
    const stationName = "Howth";

    // CORS proxy if necessary
    const proxyUrl = "https://cors-anywhere.herokuapp.com/";
    const apiUrl = `http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML?StationDesc=${stationName}`;

    // Fetch data from the Irish Rail Realtime API
    fetch(proxyUrl + apiUrl)
        .then(response => response.text())  // Get the response as text
        .then(data => {
            // Since the data does not have tags, treat it as a raw text response
            // Split the data by newlines and process each train entry
            const trainLines = data.trim().split('\n');
            
            if (trainLines.length === 0) {
                document.getElementById("train-times").innerHTML = "No trains currently available.";
                return;
            }

            // Build the output HTML
            let output = "<ul>";

            // Loop over each line and extract train details based on position
            trainLines.forEach(line => {
                const trainData = line.trim().split(/\s+/);  // Split each line by spaces (or multiple spaces)

                if (trainData.length < 21) {
                    // If the line doesn't have enough data fields, skip it
                    return;
                }

                // Extract relevant data (assumed positions based on your shared example)
                const timestamp = trainData[0];
                const trainCode = trainData[1];
                const stationName = trainData[2];
                const stationCode = trainData[3];
                const queryTime = trainData[4];
                const trainDate = trainData[5] + " " + trainData[6] + " " + trainData[7];  // Example: "15 Oct 2024"
                const origin = trainData[8];
                const destination = trainData[9];
                const originTime = trainData[10];
                const destinationTime = trainData[11];
                const status = trainData[12];
                const lastLocation = trainData[13] + " " + trainData[14];  // Example: "Departed Kilbarrack"
                const dueIn = trainData[15];  // Minutes until the train arrives
                const late = trainData[16];  // Minutes late
                const expArrival = trainData[17];
                const expDeparture = trainData[18];
                const direction = trainData[19];  // Northbound/Southbound
                const trainType = trainData[20];  // DART or other
                const locationType = trainData[21];  // Location type (D)

                // Create a list item for each train
                output += `<li>
                    <strong>Train ${trainCode} to ${destination}</strong> (${trainType}) - ${direction}<br>
                    Due in: ${dueIn} minutes | Expected Arrival: ${expArrival}<br>
                    Status: ${status} | Last Location: ${lastLocation}<br>
                    Late by: ${late} minutes
                </li>`;
            });

            output += "</ul>";

            // Display the train times on the webpage
            document.getElementById("train-times").innerHTML = output;
        })
        .catch(error => {
            console.error("Error fetching the train times:", error);
            document.getElementById("train-times").innerHTML = `<p class="error">Error loading train times.</p>`;
        });
});
