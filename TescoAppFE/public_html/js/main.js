const search = document.getElementById('search');
const divDataList = document.getElementById('div-data-list');
const divSelectedCity = document.getElementById('div-selected-city');
const divMessage = document.getElementById('div-message');

const tableHead = document.getElementById('table-head');
const tableBody = document.getElementById('table-body');
const tableBodySecondRow = document.getElementById('table-body-second');
const divLocationBody = document.getElementById('div-location-body');


const apiKey = '8cde02722d05cd01c94bc06ead222b72';
const weatherUnits = 'metric';

var foundCities = null;
var finalCity = null;

async function loadCities() {
    await load();
    await searchCities(search.value);
}

async function load() {
    if (foundCities === null || foundCities === undefined) {
        let res = await fetch('data/city.list.json');
        cities = await res.json();
        foundCities = cities;
    }
}

async function getCurrentWeatherFromApi(cityWithCountry) {
    let http = 'http://api.openweathermap.org/data/2.5/weather?q=' + cityWithCountry + '&units=' + weatherUnits + '&APPID=' + apiKey;
    let res = await fetch(http);
    weather = await res.json();
    if (weather.cod === 200) {
        divMessage.innerHTML += 'Current temperature is<br><b>' + weather.main.temp + ' °C</b>';
    }else{
        divMessage.innerHTML += 'Current temperature is not available for this city</b>';
    }
}

async function getDailyWeatherFromApi(lat, lon) {
    let http = 'https://api.openweathermap.org/data/2.5/onecall?lat=' + lat + '&lon=' + lon + '&exclude=hourly&units=' + weatherUnits + '&appid=' + apiKey;
    let res = await fetch(http);
    weather = await res.json();
    clearPage();
    for (var i = 0; i < 7; i++) {
        tableHead.innerHTML += '<th class="tg-0lax">' + getDateFromUnix(weather.daily[i].dt) + '</th>';
        tableBody.innerHTML += '<td class="tg-0lax">' + weather.daily[i].temp.day + ' °C</td>';
        tableBodySecondRow.innerHTML += '<td class="tg-0lax">' + weather.daily[i].weather[0].main + '</td>';
    }

}

function getDateFromUnix(unixTimestamp) {
    let date = new Date(unixTimestamp * 1000);
    return date.toLocaleDateString();
}

async function setFinalCity(inputText) {
    let cityId = getIdFromText(inputText);
    if (await isFinalCitySet(cityId)) {
        return;
    }

    finalCity = await getCityById(cityId);
    if (finalCity === null || finalCity === undefined) {
        divMessage.innerHTML = 'City not found, try find city by autocomplete.';
        clearPage();
    } else {
        divMessage.innerHTML = '<h3>' + finalCity.name + '</h3>';
        getCurrentWeatherFromApi(finalCity.name + ',' + finalCity.country);
        getDailyWeatherFromApi(finalCity.coord.lat, finalCity.coord.lon);
    }
}

function clearPage() {
    tableBody.innerHTML = '';
    tableBodySecondRow.innerHTML = '';
    tableHead.innerHTML = '';
}

async function getCityById(cityId) {
    cities = foundCities;
    if (cities === null || cities === undefined)
        return;

    let foundCity = cities.filter(city => {
        return city.id.toString() === cityId;
    });

    return foundCity === undefined ? null : foundCity[0];
}

async function searchCities(searchText) {
    let cities = foundCities;
    let matches = cities.filter(city => {
        let regex = new RegExp(`^${searchText}`, 'gi');
        return city.name.match(regex) || city.country.match(regex);
    });
    if (searchText.length === 0) {
        matches = [];
    }
    outputHtml(matches);
}

const outputHtml = matches => {
    if (matches.length > 0) {
        let html = '<datalist id="datalist">';
        for (i = 0; i < 10; i++) {
            if (i < matches.length)
                html += `<option value='${matches[i].name},${matches[i].country} (${matches[i].id})'/>`;
        }

        html += '</datalist>';
        divDataList.innerHTML = html;
    }
};

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showTempForCurrLocation);
    } else {
        divLocationBody.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showTempForCurrLocation(position) {
    divMessage.innerHTML = '<h2>Weather for your current position</h2>';
    search.value = '';
    getDailyWeatherFromApi(position.coords.latitude, position.coords.longitude);
    finalCity = null;
}


function getIdFromText(text) {
    let regex = new RegExp(/\(([^)]+)\)/);
    let matches = text.match(regex);
    return matches === null ? null : matches[1];

}

function isFinalCitySet(cityId) {
    return finalCity !== null && finalCity !== undefined && cityId === finalCity.id;
}
    