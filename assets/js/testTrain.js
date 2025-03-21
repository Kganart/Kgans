document.addEventListener("DOMContentLoaded", function () {
    // Get the station name from your page (for example, "Howth")
    var stationName = document.getElementById("train-type").innerHTML;
    
    // Build the API URL with a callback parameter for JSONP.
    // Note: This example uses the direct API URL without a CORS proxy.
    const apiUrl = `http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML?StationDesc=${encodeURIComponent(stationName)}&callback=handleStationData`;

    // Create a new script element
    var script = document.createElement('script');
    script.src = apiUrl;
    // Append the script to the document to trigger the JSONP request
    document.body.appendChild(script);
});

// This function will be called by the JSONP response
function handleStationData(data) {
    // Assuming data is returned as a JSON object.
    // (If data is in XML format, JSONP won’t work without the API supporting it.)
    
    // Build the output HTML
    let output = "<div>";
    
    // Assume the returned data has a property 'objStationData' that is an array of train objects
    let trains = data.objStationData;
    
    // If there’s only one train, the API might not return an array so we wrap it.
    if (trains && !Array.isArray(trains)) {
        trains = [trains];
    }
    
    if (trains && trains.length > 0) {
        trains.forEach(train => {
            // Extract train details
            const destination = train.Destination;
            const dueIn = train.Duein;
            const direction = train.Direction;
            const trainType = train.Traintype;
    
            output += `<div class="card text-bg-dark">
                        <div class="row">
                          <div class="col">
                            <h4 class="banner-text nova-text text-center">${destination}</h4>
                          </div>
                          <div class="col">
                            <h4 class="banner-text nova-text text-center">${direction}</h4>
                          </div>
                          <div class="col">
                            <h4 class="banner-text nova-text text-center">${dueIn}</h4>
                          </div>
                        </div>
                      </div><br>`;
        });
    } else {
        output += "No train data available.";
    }
    
    output += "</div>";
    
    // Display the train times on the webpage
    document.getElementById("train-times").innerHTML = output;
}
