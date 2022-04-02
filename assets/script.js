// apikeys for google and Ticket Master
const apiKeyG = "AIzaSyAT66zvPMuy--n3ep1y7gSHibsV_aNMtbc";
const apiKeyTM = "8gCIaWZY4lHT8Aj0NRXlEobIThAGmNGO";
// variables
const currentTimeDiv = document.getElementById("current-date-time");
const container = document.getElementById("container");
const mapDiv = document.getElementById("map");
const eventsListDiv = document.getElementById("events-list");
const myBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const searchInput = document.getElementById("keywords");
var searchHistory = document.getElementById("past_searches");
var userInputArr = JSON.parse(localStorage.getItem("savedSearches")) || [];
var userLatitude;
var userLongitude;
var userCity;
//nabvar Btns
const signUpBtn = document.getElementById("signUpBtn");
const logInBtn = document.getElementById("logInBtn");
//map
let map;
let service;
let infowindow;

displayRecentSearches();

// current time and day
var today = moment();
currentTimeDiv.textContent = today.format("dddd, Do MMM, YYYY [at] h:mm a");

//function declaration section

//retrieve user location
function initMap() {
  infowindow = new google.maps.InfoWindow();

  //setting map on a default value
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -37.8136, lng: 144.9631 },
    zoom: 12,
  });

  //setting marker for default position
  const locationButton = document.createElement("button");

  locationButton.textContent = "Pan to Current Location";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
  locationButton.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        new google.maps.Marker({
          position: pos,
          map,
          title: "Current Location",
        });

        map.setCenter(pos);
      });
    }
  });
}

function createMarker(place) {
  if (!place.geometry || !place.geometry.location) return;
  new google.maps.Marker({
    map,
    position: place.geometry.location,
  });
}

//new map with the location we insert
function initSecondMap() {
  infowindow = new google.maps.InfoWindow();
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: userLatitude, lng: userLongitude },
    zoom: 12,
  });
  const request = {
    query: localStorage.getItem("Location"),
    fields: ["name", "geometry"],
  };

  service = new google.maps.places.PlacesService(map);
  service.findPlaceFromQuery(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
      for (let i = 0; i < results.length; i++) {
        console.log(i);
        console.log(results[i]);
        createMarker(results[i]);
      }

      map.setCenter(results[0].geometry.location);
    }
  });
}

//retrieving events data and displaying them
function getApi() {
  //getting data from ticketmaster API
  var city = localStorage.getItem("Location");
  var queryURL =
    "https://app.ticketmaster.com/discovery/v2/events.json?&classificationName=music&city=" +
    city +
    "&apikey=" +
    apiKeyTM;

  initSecondMap();

  fetch(queryURL)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      console.log(data);
      saveRecentSearches(data);
      const isEmbedded = "_embedded" in data;

      eventsListDiv.innerHTML = "";
      //User data validation and checking if there are events on the user city
      if (data.page.totalElements == 0 && !isEmbedded) {
        var displayEl = document.createElement("p");
        eventsListDiv.append(displayEl);
        displayEl.innerHTML =
          "No Events for this city or city does not exist";
      } else {
        for (var i = 0; i < 10; i++) {
          console.log(i)
          var displayEl = document.createElement("p");
          eventsListDiv.append(displayEl);
          displayEl.innerHTML =
            "<strong>Name:</strong>" + data._embedded.events[i].name + "<br/>";
          displayEl.innerHTML +=
            "<strong>Date:</strong>" +
            data._embedded.events[i].dates.start.localDate +
            " <br/>";
          displayEl.innerHTML +=
            "<strong>Time:</strong>" +
            data._embedded.events[i].dates.start.localTime +
            "<br/>";
          //putting personalised markers on every event
          var location = {
            lat: JSON.parse(
              data._embedded.events[i]._embedded.venues[0].location.latitude
            ),
            lng: JSON.parse(
              data._embedded.events[i]._embedded.venues[0].location.longitude
            ),
          };
          addMarker(location, map);
        }
      }
    });
}

var markerImage = "./assets/music-note-icon.png";
function addMarker(location, map) {
  console.log(location);
  new google.maps.Marker({
    position: location,
    title: "",
    icon: markerImage,
    map: map,
  });
}

//append past searches and make them clickable
function appendCities(event) {
  event.preventDefault();

  for (var i = 0; i < "past cities".length; i++) {
    var node = document.createElement("h1");
    node.textContent = localStorage.getItem("past cities".key(i));
    document.getElementById("past_searches").appendChild(node);

    node.addEventListener("click", function () {
      document.getElementById("keywords").value = "";
      var city = node.textContent;
      localStorage.setItem("Location", city);

      initMap();
      getApi();
    });
  }
}

function isValidUserInput(userSearchInput, data) {
  return (userSearchInput !== "" && isNaN(userSearchInput) && "_embedded" in data && !userInputArr.slice(-5).includes(userSearchInput))
}

// saving resent searches in local storage and displaying the last 5 searches
function saveRecentSearches(data) {
  console.log(data);
  var userSearchInput = localStorage.getItem("Location");

  if (isValidUserInput(userSearchInput, data)) {
    userInputArr.push(userSearchInput);
    localStorage.setItem("savedSearches", JSON.stringify(userInputArr));
    displayRecentSearches();
  }

}

function displayRecentSearches() {
  searchHistory.innerHTML = "";
  const recentFiveSearch = userInputArr.slice(-5);
  recentFiveSearch.forEach(function (item) {
    console.log(item);
    const historyBtn = document.createElement("button");
    historyBtn.textContent = item;
    historyBtn.style.textTransform = "capitalize";
    historyBtn.setAttribute("class", "btn");
    document.getElementById("past_searches").appendChild(historyBtn);

    historyBtn.addEventListener("click", function () {
      document.getElementById("keywords").value = "";
      var city = historyBtn.textContent;
      localStorage.setItem("Location", city);
      initMap();
      getApi();
    });
  });
}

//adding eventlisteners to all buttons
myBtn.addEventListener("click", function (event) {
  event.preventDefault();
  var city = document.getElementById("keywords").value;
  if (city === "" || !isNaN(city)) {
    alert("Please Enter a city or a keyword.");
    return;
  } else {
    localStorage.setItem("Location", city);

    //initMap();
    getApi();
  }
});

myBtn.addEventListener("click", saveRecentSearches);

clearBtn.addEventListener("click", function () {
  searchHistory.innerHTML = "";
  userInputArr = [];
  localStorage.clear();
});

getApi();
