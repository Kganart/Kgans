function myTrain() {
    // 1. Grab the station code from <select>
    const selectElement = document.querySelector('#selction');
    const stationCode = selectElement.value;  // e.g. "HOWTH"
    
    // 2. Grab the "visible text" if you want to show the station name on the page
    const selectedElementText = selectElement.options[selectElement.selectedIndex].text; 
    // e.g. "Howth", "Sutton"
    
    // 3. Build the REST API URL
    const apiUrl = `https://irish-rail-rest-api.fly.dev/stations/${stationCode}/timetable?num_mins=90`;

    // 4. Fetch JSON from the new endpoint
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // data is an array of train objects
            // e.g. [ { destination: "...", direction: "...", due_in: ..., train_type: "..." }, ... ]

            // 5. Build the output
            let output = `<h3 class="content-text light-banner-text">Next Trains from ${selectedElementText}</h3>
                          <div id="train-times" class="card-grid">`;

            // If no trains returned, handle that
            if (!data || data.length === 0) {
                output += `
                  <div class="card mx-auto ani-ctrl-gradient-2">
                    <div class="card-body">
                      <p class="card-text light-banner-text nova-text">No trains found.</p>
                    </div>
                  </div>`;
            } else {
                // We have trains
                data.forEach(train => {
                    const { direction, destination, due_in, train_type } = train;
                    // direction might be "Northbound"/"Southbound"/"To City Centre"? 
                    // depends on the route
                    output += `
                      <div id="${direction}" class="card mx-auto ani-ctrl-gradient-2">
                        <div class="light-banner-text">${direction}</div>
                        <div class="card-body">
                          <h5 class="card-title light-banner-text">Destination: ${destination}</h5>
                          <h6 class="light-banner-text">${train_type}</h6>
                        </div>
                        <div class="card-footer">
                          <p class="card-text light-banner-text nova-text">Due in ${due_in} mins</p>
                        </div>
                      </div>`;
                });
            }

            output += "</div>";

            // 6. Display on the webpage
            document.getElementById("train-times").innerHTML = output;
        })
        .catch(error => {
            console.error("Error fetching the train times:", error);
            document.getElementById("train-times").innerHTML = "Error loading train times.";
        });
}
