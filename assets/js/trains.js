function myTrain() {
    selectElement = document.querySelector('#selction');
    selectedElement = selectElement.options[selectElement.selectedIndex].value;
    selectedElementText = selectedElement.replace("%20", " ");
    
    console.log(selectElement);
    console.log(selectedElement);



    /*const stationNameTest = "Howth";
    var stationName = document.getElementById("train-type").innerHTML; */
    const apiUrl = `https://corsproxy.io/?http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML?StationDesc=${selectedElement}`;
    //const apiUrl = `https://corsproxy.io/?http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML?StationDesc=${stationName}`;

    // Fetch data from the Irish Rail Realtime API
    fetch(apiUrl, {
        mode: 'cors',
        method: 'GET' // <-- Change POST to GET here
    })
    .then(response => response.text())  // Get the response as text (since it's XML)
    .then(data => {
        // Parse the XML data
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "text/xml");

        // Get all train entries from the XML response
        const trains = xmlDoc.getElementsByTagName("objStationData");

        // Build the output HTML
        //let output = "<div>";
        let output = `<h3 class="content-text light-banner-text">Next Trains from ${selectedElementText} </h3>
        <div id="train-times" class="card-grid">
        `;
        
        for (let i = 0; i < trains.length; i++) {
            const train = trains[i];

            // Extract train details
            const destination = train.getElementsByTagName("Destination")[0].textContent;
            const dueIn = train.getElementsByTagName("Duein")[0].textContent;
            const direction = train.getElementsByTagName("Direction")[0].textContent;
            const trainType = train.getElementsByTagName("Traintype")[0].textContent;
            /*
            <div class="col">
            <h4 class="banner-text nova-text text-center">
            ${trainType}</h4></div>
            */

            output += `<div id="${direction}" class="card mx-auto ani-ctrl-gradient-2">
                            <div class=" light-banner-text">${direction}</div>
                            <div class="card-body">
                                <h5 class="card-title light-banner-text">Destination: ${destination}</h5>
                            </div>
                            <div class="card-footer">
                                <p class="card-text light-banner-text nova-text "> Due in ${dueIn} mins</p>
                            </div>
                        </div>`;
        }
        output += "</div>";

        // Display the train times on the webpage
        document.getElementById("train-times").innerHTML = output;
    })
    .catch(error => {
        console.error("Error fetching the train times:", error);
        document.getElementById("train-times").innerHTML = "Error loading train times.";
    });

}