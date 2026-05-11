// ---------- API CONFIGURATION ----------
// Replace with your OpenWeatherMap API key (free tier works)
const API_KEY = "bd5e378503939ddaee76f12ad7a97608";

// DOM references
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const initialStateDiv = document.getElementById('initialState');
const loadingDiv = document.getElementById('loadingState');
const errorDiv = document.getElementById('errorState');
const weatherDisplayDiv = document.getElementById('weatherDisplay');
const errorMessageSpan = document.getElementById('errorMessage');

// UI Update elements
const cityNameSpan = document.getElementById('cityName');
const countryCodeSpan = document.getElementById('countryCode');
const mainTempSpan = document.getElementById('mainTemp');
const weatherIconImg = document.getElementById('weatherIcon');
const weatherDescSpan = document.getElementById('weatherDesc');
const highLowSpan = document.getElementById('highLow');
const humiditySpan = document.getElementById('humidity');
const windSpeedSpan = document.getElementById('windSpeed');
const feelsLikeSpan = document.getElementById('feelsLike');
const pressureSpan = document.getElementById('pressure');

// State variables
let currentWeatherData = null;   // raw API response
let currentUnit = 'metric';      // 'metric' = Celsius, 'imperial' = Fahrenheit

// Helper: show only specific UI state
function setUIState(state) {
    initialStateDiv.classList.add('hidden');
    loadingDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    weatherDisplayDiv.classList.add('hidden');
    
    if (state === 'initial') initialStateDiv.classList.remove('hidden');
    else if (state === 'loading') loadingDiv.classList.remove('hidden');
    else if (state === 'error') errorDiv.classList.remove('hidden');
    else if (state === 'success') weatherDisplayDiv.classList.remove('hidden');
}

// Dynamic background based on weather condition
function setDynamicBackground(weatherMain) {
    const bodyEl = document.body;
    bodyEl.classList.remove('sunny-bg', 'clouds-bg', 'rain-bg', 'clear-bg', 'snow-bg', 'thunder-bg', 'mist-bg', 'default-bg');
    const mainCondition = weatherMain?.toLowerCase() || '';
    if (mainCondition.includes('clear')) bodyEl.classList.add('clear-bg');
    else if (mainCondition.includes('cloud')) bodyEl.classList.add('clouds-bg');
    else if (mainCondition.includes('rain') || mainCondition.includes('drizzle')) bodyEl.classList.add('rain-bg');
    else if (mainCondition.includes('thunderstorm')) bodyEl.classList.add('thunder-bg');
    else if (mainCondition.includes('snow')) bodyEl.classList.add('snow-bg');
    else if (mainCondition.includes('mist') || mainCondition.includes('fog') || mainCondition.includes('haze')) bodyEl.classList.add('mist-bg');
    else if (mainCondition.includes('sunny')) bodyEl.classList.add('sunny-bg');
    else bodyEl.classList.add('default-bg');
}

// Update temperatures based on current unit (Celsius/Fahrenheit)
function updateUITemperatures() {
    if (!currentWeatherData) return;
    const mainTempKelvin = currentWeatherData.main.temp;
    const feelsLikeKelvin = currentWeatherData.main.feels_like;
    const tempMinKelvin = currentWeatherData.main.temp_min;
    const tempMaxKelvin = currentWeatherData.main.temp_max;
    
    let tempC = mainTempKelvin - 273.15;
    let feelsC = feelsLikeKelvin - 273.15;
    let minC = tempMinKelvin - 273.15;
    let maxC = tempMaxKelvin - 273.15;
    
    let tempVal, feelsVal, minVal, maxVal, unitSymbol;
    if (currentUnit === 'metric') {
        tempVal = Math.round(tempC);
        feelsVal = Math.round(feelsC);
        minVal = Math.round(minC);
        maxVal = Math.round(maxC);
        unitSymbol = '°C';
    } else {
        tempVal = Math.round((tempC * 9/5) + 32);
        feelsVal = Math.round((feelsC * 9/5) + 32);
        minVal = Math.round((minC * 9/5) + 32);
        maxVal = Math.round((maxC * 9/5) + 32);
        unitSymbol = '°F';
    }
    
    mainTempSpan.innerText = `${tempVal}${unitSymbol}`;
    feelsLikeSpan.innerText = `${feelsVal}${unitSymbol}`;
    highLowSpan.innerText = `${maxVal}${unitSymbol} / ${minVal}${unitSymbol}`;
}

// Full UI update from currentWeatherData (non-temp fields + icons + wind)
function updateFullUI() {
    if (!currentWeatherData) return;
    const data = currentWeatherData;
    cityNameSpan.innerText = data.name;
    countryCodeSpan.innerText = data.sys.country;
    const weatherType = data.weather[0];
    weatherDescSpan.innerText = weatherType.description;
    const iconCode = weatherType.icon;
    weatherIconImg.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    humiditySpan.innerText = `${data.main.humidity}%`;
    
    // Wind speed: m/s for metric, mph for imperial
    let windVal = data.wind.speed;
    let windUnit = 'm/s';
    if (currentUnit === 'imperial') {
        windVal = (data.wind.speed * 2.23694).toFixed(1);
        windUnit = 'mph';
    } else {
        windVal = data.wind.speed.toFixed(1);
    }
    windSpeedSpan.innerText = `${windVal} ${windUnit}`;
    pressureSpan.innerText = `${data.main.pressure} hPa`;
    
    setDynamicBackground(weatherType.main);
    updateUITemperatures();
}

// Toggle between Celsius and Fahrenheit
function toggleUnit() {
    if (!currentWeatherData) return;
    if (currentUnit === 'metric') {
        currentUnit = 'imperial';
    } else {
        currentUnit = 'metric';
    }
    updateFullUI(); // refresh temperatures and wind unit
}

// Attach toggle event (ensuring toggle knob visual sync)
const toggleDiv = document.getElementById('unitToggle');
toggleDiv.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDiv.classList.toggle('toggle-active');
    toggleUnit();
});

// Async function to fetch weather data from API
async function getWeatherData(cityName) {
    if (!cityName.trim()) throw new Error('City name cannot be empty');
    const trimmedCity = cityName.trim();
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(trimmedCity)}&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        if (response.status === 404) throw new Error('City not found. Check spelling.');
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
}

// Main search handler with loading, error, and success states
async function handleSearch(city) {
    if (!city || city.trim() === '') {
        setUIState('initial');
        cityInput.placeholder = 'Enter a city name...';
        return;
    }
    setUIState('loading');
    try {
        const weatherData = await getWeatherData(city);
        currentWeatherData = weatherData;
        // Reset unit to Celsius on new search (optional but improves UX)
        if (currentUnit !== 'metric') {
            currentUnit = 'metric';
            if (toggleDiv.classList.contains('toggle-active')) toggleDiv.classList.remove('toggle-active');
        } else {
            if (toggleDiv.classList.contains('toggle-active')) toggleDiv.classList.remove('toggle-active');
        }
        updateFullUI();
        setUIState('success');
    } catch (err) {
        console.error(err);
        let userMessage = "Could not fetch weather data.";
        if (err.message.includes('City not found') || err.message.includes('404')) {
            userMessage = "❌ City not found. Please check spelling.";
        } else if (err.message.includes('network')) {
            userMessage = "🌐 Network error. Check your connection.";
        } else {
            userMessage = `⚠️ ${err.message}`;
        }
        errorMessageSpan.innerText = userMessage;
        setUIState('error');
        currentWeatherData = null;
    }
}

function performSearch() {
    const city = cityInput.value;
    handleSearch(city);
}

// Event Listeners
searchBtn.addEventListener('click', performSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
    }
});

// Optional: Load a default city on page load for a rich initial experience
window.addEventListener('DOMContentLoaded', () => {
    handleSearch('London').catch(e => console.warn);
});