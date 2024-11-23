const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const suggestionBox = document.createElement("div");
const loader =  
    document.querySelector('.loader');

const API_KEY = "b01e1ca0d48dc54aeafdf6e7d6785b5f"; // API key for OpenWeatherMap API

suggestionBox.classList.add("suggestions-box");
document.querySelector(".weather-input").appendChild(suggestionBox);

const showCitySuggestions = (suggestions) => {
    suggestionBox.innerHTML = ""; // Clear previous suggestions

    if (suggestions.length === 0) {
        suggestionBox.style.display = 'none'; // Hide suggestion box if no suggestions
        return;
    }

    suggestions.forEach(suggestion => {
        const suggestionItem = document.createElement("div");
        suggestionItem.classList.add("suggestion-item");
        suggestionItem.textContent = suggestion.name;
        suggestionItem.addEventListener("click", () => {
            cityInput.value = suggestion.name;
            suggestionBox.innerHTML = ""; // Clear suggestions after selection
        });
        suggestionBox.appendChild(suggestionItem);
    });

    suggestionBox.style.display = 'block'; // Show the suggestion box
}

const getCitySuggestions = (query) => {
    if (query.length < 3) { // Only show suggestions if the query length is 3 or more
        suggestionBox.style.display = 'none';
        return;
    }

    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`;
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            const uniqueCities = Array.from(new Map(data.map(item => [item.name + item.country, item])).values());
            showCitySuggestions(uniqueCities);
        })
        .catch(() => {
            suggestionBox.style.display = 'none';
            console.error("Error fetching city suggestions");
        });
}

const createWeatherCard = (cityName, weatherItem, index) => {
    if(index === 0) { // HTML for the main weather card
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
    } else { // HTML for the other five day forecast card
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
}

const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL).then(response => response.json()).then(data => {
        // Filter the forecasts to get only one forecast per day
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });

        // Clearing previous weather data
        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        // Creating weather cards and adding them to the DOM
        fiveDaysForecast.forEach((weatherItem, index) => {
            const html = createWeatherCard(cityName, weatherItem, index);
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", html);
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", html);
            }
        });        
    }).catch(() => {
        alert("An error occurred while fetching the weather forecast!");
    });
}

const getCityCoordinates = () => {
    loader.style.display = 'inline-block'; 
    const cityName = cityInput.value.trim();
    if (cityName === "")
    {
        loader.style.display = 'none';
        alert(`Please enter a city name.`);
        return;
    } 
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    // Get entered city coordinates (latitude, longitude, and name) from the API response
    fetch(API_URL).then(response => response.json()).then(data => {
        if (!data.length){
            loader.style.display = 'none';
            return alert(`No coordinates found for ${cityName}`);
        } 
        const { lat, lon, name } = data[0];
        getWeatherDetails(name, lat, lon);
        loader.style.display = 'none'; 
    }).catch(() => {
        alert("An error occurred while fetching the coordinates!");
        loader.style.display = 'none'; 
    });
}

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords; // Get coordinates of user location
            // Get city name from coordinates using reverse geocoding API
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            fetch(API_URL).then(response => response.json()).then(data => {
                const { name } = data[0];
                getWeatherDetails(name, latitude, longitude);
            }).catch(() => {
                alert("An error occurred while fetching the city name!");
            });
        },
        error => { // Show alert if user denied the location permission
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            } else {
                alert("Geolocation request error. Please reset location permission.");
            }
        });
}

locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

// Event listener for the city input field
cityInput.addEventListener("input", (e) => {
    const query = e.target.value;
    getCitySuggestions(query); // Fetch suggestions as the user types
});