class ForecastCollectiveShort{
    constructor(communeId, locationDetails, commonLookupDetails){
        this.year = new Date().getFullYear();
        this.locationLabel = $("span#weather-location-label");
        this.region = locationDetails.region;
        this.cercle = locationDetails.cercle;
        this.commune = locationDetails.commune;
        this.regionId = locationDetails.regionId;
        this.cercleId = locationDetails.cercleId;
        this.communeId = communeId;
        this.filterDataSources = $("input[type='radio'][name='fcollshort-dtsrc']");
        // common lookups
        this.months = commonLookupDetails.months;
        this.weeks = commonLookupDetails.weeks;
        this.rootUrl = weatherApiUrl;
        this.tomorrowIOCodes = {
            "0":"Unknown","1000":"Clear, Sunny","1001":"Cloudy","1100":"Mostly Clear",
            "1101":"Partly Cloudy","1102":"Mostly Cloudy","2000":"Fog","2100":"Light Fog",
            "4000":"Drizzle","4001":"Rain","4200":"Light Rain","4201":"Heavy Rain",
            "5000":"Snow","5001":"Flurries","5100":"Light Snow","5101":"Heavy Snow",
            "6000":"Freezing Drizzle","6001":"Freezing Rain","6200":"Light Freezing Rain",
            "6201":"Heavy Freezing Rain","7000":"Ice Pellets","7101":"Heavy Ice Pellets",
            "7102":"Light Ice Pellets","8000":"Thunderstorm"
        };
    }

    execute = () => {
        this.locationLabel.empty().html(`${this.commune}, ${this.cercle}, ${this.region}`);
        this.locationLabel.attr("data-region-id", this.regionId);
        this.locationLabel.attr("data-cercle-id", this.cercleId);
        this.locationLabel.attr("data-commune-id", this.communeId);
        $("input[type='radio'][name='fcollshort-dtsrc']").unbind("change").on("change", () => $(`a.nav-link.weather-menu[href="#fcollshort"]`).trigger("click"));
        this.loadData();
    }

    loadData = () => {
        this.hmReq = {
            "communeId": this.communeId || null,
            "dataSrcId": $("input[type='radio'][name='fcollshort-dtsrc']:checked").val() || null,
        };
        this.post("forecast_collective", this.hmReq)
        .then(response => {
            if(response.status){
                let dataSrcId = this.hmReq.dataSrcId;
                let responseData = response.data
                responseData.sort((a, b) => a.date > b.date ? 0 : -1)
                this.renderWeatherCards(responseData, dataSrcId);
                this.renderWeatherCharts(responseData, dataSrcId);
            } else{
                alert(response.message);
            }
        })
        .catch(err => {
            let errMsg = JSON.parse(err.responseText).message;
            alert(`Unable to get forecast data\n${errMsg} for this commune`);
            console.error(err);
        })
        .finally(() => stopWaiting());
    }

    renderWeatherCards = (data, dataSrcId) => {
        let cardsHtml = dataSrcId == "3"
            ? data.map(a => {
                let weatherIcon = a.weather_code
                    ? `<p style="text-align: center;">
                        <img src="assets/images/tomorrownow-icons/${a.weather_code}.png" title="${this.tomorrowIOCodes[`${a.weather_code}`]}">
                    </p>` : "";
                return `<div class="card card-shadow ms-1 me-1 mt-1 mb-1 p-3">
                    ${weatherIcon}
                    <p class="mb-3 mt-3"><b>Date: ${a.date} </b></p>
                    <p><b>Rainfall:</b> ${!isNaN(a.rainfall) ? this.int(a.rainfall) + " mm": "N/A"}</p>
                    <p><b>Precipitation Chances:</b> ${!isNaN(a.rainfall_chance) ? this.float1(a.rainfall_chance) + " %": "N/A"}</p>
                    <p><b>Max Temp:</b> ${!isNaN(a.temp_max) ? this.float1(a.temp_max) + " °C": "N/A"}</p>
                    <p><b>Min Temp:</b> ${!isNaN(a.temp_min) ? this.float1(a.temp_min) + " °C": "N/A"}</p>
                    <p><b>Humidity:</b> ${!isNaN(a.humidity) ? this.float1(a.humidity) + " %": "N/A"}</p>
                    <p><b>Wind Speed:</b> ${!isNaN(a.wind_speed) ? this.float1(a.wind_speed) + " m/s": "N/A"}</p>
                    <!-- p><b>Wind Direction:</b> ${a.wind_direction ?? ""}</p -->
                </div>`;
            })
            : dataSrcId == "4"
            ? data.map(a => {
                return `<div class="card card-shadow ms-1 me-1 mt-1 mb-1 p-3" style="background-color: #dffffc33">
                    <p class="mb-3 mt-3"><b>Date: ${a.date}</b></p>
                    <p><b>Rainfall:</b> ${!isNaN(a.rainfall) ? (this.int(a.rainfall) ? this.int(a.rainfall) : 0) + " mm": "N/A"}</p>
                    <p><b>Max Temp:</b> ${!isNaN(a.temp_max) ? this.float1(a.temp_max) + " °C": "N/A"}</p>
                    <p><b>Min Temp:</b> ${!isNaN(a.temp_min) ? this.float1(a.temp_min) + " °C": "N/A"}</p>
                    <p><b>Humidity:</b> ${!isNaN(a.humidity) ? this.float1(a.humidity) + " %": "N/A"}</p>
                </div>`;
            })
            : `<div class="text-center mt-5">Data unavailable</div>`
        $(`div#fcollshort-summary`).empty().html(cardsHtml);
    }

    renderWeatherCharts = (data, dataSrcId) => {
        switch(true){
            case dataSrcId == "3":
                $("div#fcollshort1").show();
                $("div#fcollshort2").show();
                $("span#fcollshort-title-1").empty().html("Rainfall, Chances of Rainfall and Humidity Forecast");
                $("span#fcollshort-title-2").empty().html("Temperature and Wind Speed Forecast");
                this.renderWeatherChart1(data, dataSrcId);
                this.renderWeatherChart2(data, dataSrcId);
                break;
            case dataSrcId == "4":
                $("div#fcollshort1").show();
                $("div#fcollshort2").show();
                $("span#fcollshort-title-1").empty().html("Rainfall and Humidity Forecast");
                $("span#fcollshort-title-2").empty().html("Temperature Forecast");
                this.renderWeatherChart1(data, dataSrcId);
                this.renderWeatherChart2(data, dataSrcId);
                break;
            default:
                break;
        }
    }

    renderWeatherChart1 = (data, dataSrcId) => {
        // Rainfall, Rainfall Chance, Humidity
        let chartData = {
            "3": {
                categories: data.map(a => a.date),
                yAxis: [
                    {labels: {format: '{value}'}, title: {text: 'Rainfall (mm)'}, allowDecimals: false, opposite: false},
                    {labels: {format: '{value}'}, title: {text: 'Rainfall Chance (%)'}, allowDecimals: false, opposite: true},
                    {labels: {format: '{value}'}, title: {text: 'Humidity (%)'}, allowDecimals: false, opposite: true},
                ],
                series: [
                    {name: 'Rainfall', type: 'column', tooltip: {valueSuffix: ' mm'}, data: data.map(e => !isNaN(e.rainfall) ? this.int(e.rainfall) : null), color: '#69ccc3'},
                    {name: 'Rainfall Chance', type: 'spline', tooltip: {valueSuffix: ' %'}, data: data.map(e => !isNaN(e.rainfall_chance) ? this.float1(e.rainfall_chance) : null), color: 'darkblue'},
                    {name: 'Humidity', type: 'spline', tooltip: {valueSuffix: ' %'}, data: data.map(e => !isNaN(e.humidity) ? this.float1(e.humidity) : null), color: 'lightblue'},
                ]
            },
            "4": {
                categories: data.map(a => a.date),
                yAxis: [
                    {labels: {format: '{value}'}, title: {text: 'Rainfall (mm)'}, allowDecimals: false, opposite: false},
                    {labels: {format: '{value}'}, title: {text: 'Humidity (%)'}, allowDecimals: false, opposite: true},
                ],
                series: [
                    {name: 'Rainfall', type: 'column', tooltip: {valueSuffix: ' mm'}, data: data.map(e => !isNaN(e.rainfall) ? this.int(e.rainfall) : null), color: '#69ccc3'},
                    {name: 'Humidity', type: 'spline', tooltip: {valueSuffix: ' %'}, data: data.map(e => !isNaN(e.humidity) ? this.float1(e.humidity) : null), color: 'lightblue'},
                ]
            },
        }


        if(chartData[dataSrcId].categories?.length){
            let chart = Highcharts.chart(`chart-fcollshort-weather1`, {
                chart: {type: 'column'},
                title: {text: ''},
                subtitle: {text: ''},
                credits: {enabled: true, text: this.selectedSource},
                exporting: {enabled: false},
                plotOptions: {column: {colorByPoint: false, label: {enabled: false}}, spline: {label: {enabled: false}}},
                xAxis: {categories: chartData[dataSrcId].categories, crosshair: true, title: {text: "Date"}},
                yAxis: chartData[dataSrcId].yAxis,
                tooltip: {shared: true},
                series: chartData[dataSrcId].series
            });
            $(`a#dwn-fcollshort-weather-sc1`).unbind("click").on("click", () => chart.exportChartLocal({filename: `forecast-weather1-${this.commune}`}));
            //table
            let tableHead = `<tr style="background-color: #69ccc3;">` + Object.keys(data[0]).map(e => 
                `<th class="text-white">${
                    e == "rainfall" ? `${e} (mm)`
                    : e == "rainfall_chance" ? `${e} (%)`
                    : e == "humidity" ? `${e} (%)`
                    : ""
                }</th>`).join("") + `</tr>`;
            let tableBody = data.map(e => `<tr>` + Object.values(e).map(f => `<td>${f}</td>`).join("") + `</tr>`).join("\n");
            $(`table#table-fcollshort-weather-data1`).empty().html(`<thead>${tableHead}</thead><tbody>${tableBody}</tbody>`);
            $(`a#dwn-fcollshort-weather-dt1`).unbind("click").on("click", () => $(`table#table-fcollshort-weather-data1`).table2excel({filename: `forecast-weather1-${this.commune}.xls`, preserveColors: false}));
        } else{
            $(`div#chart-fcollshort-weather1`).empty().html(`<div class="text-center">Data is unavailable for this source</div>`);
            $(`a#dwn-fcollshort-weather-sc1`).unbind().on("click").on("click", () => alert("Cannot download for data that's unavailable"));
            $(`a#dwn-fcollshort-weather-dt1`).unbind("click").on("click", () => alert("Cannot download for data that's unavailable"));
        }
    }

    renderWeatherChart2 = (data, dataSrcId) => {
        let chartData = {
            "3": {
                categories: data.map(a => a.date),
                yAxis: [
                    {labels: {format: '{value}'}, title: {text: 'Max Temperature (°C)'}, allowDecimals: false, opposite: false},
                    {labels: {format: '{value}'}, title: {text: 'Min Temperature (°C)'}, allowDecimals: false, opposite: false},
                    {labels: {format: '{value}'}, title: {text: 'Wind Speed (m/s)'}, allowDecimals: false, opposite: true},
                ],
                series: [
                    {name: 'Max Temperature', type: 'column', tooltip: {valueSuffix: ' °C'}, data: data.map(e => !isNaN(e.temp_max) ? this.float1(e.temp_max) : null), color: '#cc7d69'},
                    {name: 'Min Temperature', type: 'column', tooltip: {valueSuffix: ' °C'}, data: data.map(e => !isNaN(e.temp_max) ? this.float1(e.temp_min) : null), color: '#69ccc3'},
                    {name: 'Wind Speed', type: 'spline', tooltip: {valueSuffix: ' m/s'}, data: data.map(e => !isNaN(e.wind_speed) ? this.float1(e.wind_speed) : null), color: 'grey'},
                ]
            },
            "5": {
                categories: data.map(a => a.date),
                yAxis: [
                    {labels: {format: '{value}'}, title: {text: 'Max Temperature (°C)'}, allowDecimals: false, opposite: false},
                    {labels: {format: '{value}'}, title: {text: 'Min Temperature (°C)'}, allowDecimals: false, opposite: false},
                ],
                series: [
                    {name: 'Max Temperature', type: 'column', tooltip: {valueSuffix: ' °C'}, data: data.map(e => !isNaN(e.temp_max) ? this.float1(e.temp_max) : null), color: '#cc7d69'},
                    {name: 'Min Temperature', type: 'column', tooltip: {valueSuffix: ' °C'}, data: data.map(e => !isNaN(e.temp_max) ? this.float1(e.temp_min) : null), color: '#69ccc3'},
                ]
            }
        }
        chartData["4"] = chartData["5"];

        if(chartData[dataSrcId].categories?.length){
            let chart = Highcharts.chart(`chart-fcollshort-weather2`, {
                chart: {type: 'column'},
                title: {text: ''},
                subtitle: {text: ''},
                credits: {enabled: true, text: this.selectedSource},
                exporting: {enabled: false},
                plotOptions: {column: {colorByPoint: false, label: {enabled: false}}, spline: {label: {enabled: false}}},
                xAxis: {categories: chartData[dataSrcId].categories, crosshair: true, title: {text: "Date"}},
                yAxis: chartData[dataSrcId].yAxis,
                tooltip: {shared: true},
                series: chartData[dataSrcId].series
            });
            $(`a#dwn-fcollshort-weather-sc2`).unbind("click").on("click", () => chart.exportChartLocal({filename: `forecast-weather2-${this.commune}`}));
            //table
            let tableHead = `<tr style="background-color: #69ccc3;">` + Object.keys(data[0]).map(e => 
                `<th class="text-white">${
                    e == "temp_max" ? `${e} (°C)`
                    : e == "temp_min" ? `${e} (°C)`
                    : e == "humidity" ? `${e} (%)`
                    : ""
                }</th>`).join("") + `</tr>`;
            let tableBody = data.map(e => `<tr>` + Object.values(e).map(f => `<td>${f}</td>`).join("") + `</tr>`).join("\n");
            $(`table#table-fcollshort-weather-data2`).empty().html(`<thead>${tableHead}</thead><tbody>${tableBody}</tbody>`);
            $(`a#dwn-fcollshort-weather-dt2`).unbind("click").on("click", () => $(`table#table-fcollshort-weather-data2`).table2excel({filename: `forecast-weather2-${this.commune}.xls`, preserveColors: false}));
        } else{
            $(`div#chart-fcollshort-weather2`).empty().html(`<div class="text-center">Data is unavailable for this source</div>`);
            $(`a#dwn-fcollshort-weather-sc2`).unbind().on("click").on("click", () => alert("Cannot download for data that's unavailable"));
            $(`a#dwn-fcollshort-weather-dt2`).unbind("click").on("click", () => alert("Cannot download for data that's unavailable"));
        }

    }

    int = num => !isNaN(num) ? Number(Math.round(num)) : 0;
    float1 = num => !isNaN(num) ? Number(parseFloat(num).toFixed(1)) : 0;
    float2 = num => !isNaN(num) ? Number(parseFloat(num).toFixed(2)) : 0;
    uqArray = (arr) => [...new Set(arr)];

    get = (path) => new Promise((resolve, reject) => {
        $.ajax({
            "type": "GET",
            "url": `${this.rootUrl}/${path}`,
            "crossDomain": true,
            "success": response => resolve(response),
            "error": err => reject(err)
        });
    });
    
    
    post = (path, reqBody) => new Promise((resolve, reject) => {
        $.ajax({
            "type": "POST",
            "url": `${this.rootUrl}/${path}`,
            "beforeSend": () => startWaiting(),
            "crossDomain": true,
            "headers": {"Content-TYPE": "application/json"},
            "data": JSON.stringify(reqBody),
            "success": response => resolve(response),
            "error": err => reject(err)
        });
    });
}