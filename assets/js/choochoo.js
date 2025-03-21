function myTrain() {
    // 1. Get the station code from the select box
    const selectElement = document.querySelector('#selction');
    const selectedElement = selectElement.options[selectElement.selectedIndex].value;
    const selectedElementText = selectedElement.replace("%20", " ");

    // 2. For the new REST API, we need the station code
    //    The station code is typically something like "HOWTH" or "HTH"
    //    But in your example, you're using station *names* in your <option> tags.
    //    This API call actually wants the station 'code' (like "HOWT") - 
    //    but we only have the 'name' (like "Howth"). 
    //    Because this unofficial REST API doesn't do "by name" directly, we can do 2 calls:
    //    a) search stations by name
    //    b) once we find a matching code, call {code}/timetable
    // 
    // BUT good news: there's *another* endpoint 
    //   GET /stations/{stationName}/timetable
    // that also accepts the station name if it matches exactly. 
    // If you look at the docs, it says "code" is required but it's actually flexible:
    // "Returns all trains due to serve the station code in the next num_mins minutes."
    // 
    // We'll try to pass the 'station name' in place of the code to see if it works.
    // If that fails, we can do a search first.

    // 3. Build the REST API URL
    // Example: 
    //   https://irish-rail-rest-api.fly.dev/stations/howth/timetable
    // or 
    //   https://irish-rail-rest-api.fly.dev/stations/tara street/timetable 
    // 
    // But notice that special chars/spaces might cause 404 or route problems.
    // The simplest fix is to URL-encode the station name, e.g. encodeURIComponent()

    const stationUrl = `https://irish-rail-rest-api.fly.dev/stations/${encodeURIComponent(selectedElementText)}/timetable?num_mins=90`;

    // 4. Fetch JSON from the new endpoint
    fetch(stationUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // "data" is now a JS array of objects, 
            // each object is a train arrival with fields like:
            // {
            //   "destination": "string",
            //   "due_in": 0,
            //   "direction": "string",
            //   "train_type": "string",
            //   ...
            // }

            // 5. Build the output
            let output = `<h3 class="content-text light-banner-text">Next Trains from ${selectedElementText} </h3>
                          <div id="train-times" class="card-grid">`;

            // If the array is empty, it means no trains found. 
            if (!data || data.length === 0) {
                output += `<div class="card mx-auto ani-ctrl-gradient-2">
                             <div class="card-body">
                               <p class="card-text light-banner-text nova-text ">No upcoming trains found.</p>
                             </div>
                           </div>`;
            } else {
                // 6. Loop over each train in the JSON array
                data.forEach(train => {
                    // train.direction, train.destination, train.due_in, train.train_type ...
                    const { direction, destination, due_in, train_type } = train;

                    // 7. Add each train to the output
                    output += `<div id="${direction}" class="card mx-auto ani-ctrl-gradient-2">
                                <div class=" light-banner-text">${direction}</div>
                                <div class="card-body">
                                    <h5 class="card-title light-banner-text">Destination: ${destination}</h5>
                                </div>
                                <div class="card-footer">
                                    <p class="card-text light-banner-text nova-text">Due in ${due_in} mins</p>
                                </div>
                               </div>`;
                });
            }

            output += "</div>";

            // 8. Show it
            document.getElementById("train-times").innerHTML = output;
        })
        .catch(error => {
            console.error("Error fetching the train times:", error);
            document.getElementById("train-times").innerHTML = "Error loading train times.";
        });
}
