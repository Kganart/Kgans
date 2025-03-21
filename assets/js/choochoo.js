function myTrain() {
    // Get the selected station value from the dropdown.
    var selectElement = document.querySelector('#selction');
    var selectedElement = selectElement.options[selectElement.selectedIndex].value;
    // Store the text (with spaces restored) globally so our callback can use it.
    window.selectedElementText = selectedElement.replace("%20", " ");
    
    console.log(selectElement);
    console.log(selectedElement);

    // Build the API URL with the callback parameter.
    // NOTE: We remove the CORS proxy and append the callback parameter.
    const apiUrl = `http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML?StationDesc=${selectedElement}&callback=handleStationData`;

    // Create a new script element and set its source to the API URL.
    var script = document.createElement('script');
    script.src = apiUrl;
    
    // Append the script to the document body to trigger the JSONP request.
    document.body.appendChild(script);
}

// This function will be called by the JSONP response.
function handleStationData(data) {
    // 'data' is expected to be the XML string returned from the API wrapped in this callback.
    // Parse the XML data.
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, "text/xml");

    // Get all train entries from the XML response.
    const trains = xmlDoc.getElementsByTagName("objStationData");

    // Build the output HTML.
    let output = `<h3 class="content-text light-banner-text">Next Trains from ${window.selectedElementText} </h3>
        <div id="train-times" class="card-grid">`;
    
    for (let i = 0; i < trains.length; i++) {
        const train = trains[i];

        // Extract train details.
        const destination = train.getElementsByTagName("Destination")[0].textContent;
        const dueIn = train.getElementsByTagName("Duein")[0].textContent;
        const direction = train.getElementsByTagName("Direction")[0].textContent;
        const trainType = train.getElementsByTagName("Traintype")[0].textContent;

        output += `<div id="${direction}" class="card mx-auto ani-ctrl-gradient-2">
                        <div class="light-banner-text">${direction}</div>
                        <div class="card-body">
                            <h5 class="card-title light-banner-text">Destination: ${destination}</h5>
                        </div>
                        <div class="card-footer">
                            <p class="card-text light-banner-text nova-text">Due in ${dueIn} mins</p>
                        </div>
                    </div>`;
    }
    output += "</div>";

    // Display the train times on the webpage.
    document.getElementById("train-times").innerHTML = output;
}
