class ForecastCollectiveMedium{
    constructor(communeId, locationDetails, commonLookupDetails){
        this.year = new Date().getFullYear();
        this.locationLabel = $("span#weather-location-label");
        this.region = locationDetails.region;
        this.cercle = locationDetails.cercle;
        this.commune = locationDetails.commune;
        this.regionId = locationDetails.regionId;
        this.cercleId = locationDetails.cercleId;
        this.communeId = communeId;
        this.filterDataSources = $("input[type='radio'][name='fcollmedium-dtsrc']");
        // common lookups
        this.months = commonLookupDetails.months;
        this.weeks = commonLookupDetails.weeks;

        this.rootUrl = weatherApiUrl;        
    }

    execute = () => {
        this.locationLabel.empty().html(`${this.commune}, ${this.cercle}, ${this.region}`);
        this.locationLabel.attr("data-region-id", this.regionId);
        this.locationLabel.attr("data-cercle-id", this.cercleId);
        this.locationLabel.attr("data-commune-code", this.communeId);
        $("input[type='radio'][name='fcollmedium-dtsrc']").unbind("change").on("change", () => $(`a.nav-link.weather-menu[href="#fcollmedium"]`).trigger("click"));
        this.loadData();
    }

    loadData = () => {
        this.hmReq = {
            "communeId": this.communeId || null,
            "dataSrcId": $("input[type='radio'][name='fcollmedium-dtsrc']:checked").val() || null,
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
        let cardsHtml = ["5", "6", "7"].includes(dataSrcId)
            ? data.map(a => {
                return `<div class="card card-shadow ms-1 me-1 mt-1 mb-1 p-3" style="background-color: #dffffc33">
                    <p class="mb-3 mt-3"><b>Date: ${a.date}</b></p>
                    <p><b>Rainfall:</b> ${!isNaN(a.rainfall) ? (this.int(a.rainfall) ? this.int(a.rainfall) : 0) + " mm": "N/A"}</p>
                </div>`;
            }):
            `<div class="text-center mt-5">Data unavailable</div>`
        $(`div#fcollmedium-summary`).empty().html(cardsHtml);
    }

    renderWeatherCharts = (data, dataSrcId) => {
        switch(true){
            case ["5", "6", "7"].includes(dataSrcId):
                $("div#fcollmedium1").show();
                $("div#fcollmedium2").hide();
                $("span#fcollmedium-title-1").empty().html("Rainfall Forecast");
                $("span#fcollmedium-title-2").empty();
                this.renderWeatherChart1(data, dataSrcId);
                break;
            default:
                break;
        }
    }

    renderWeatherChart1 = (data, dataSrcId) => {
        // Rainfall, Rainfall Chance, Humidity
        let chartData = {
            "5": {
                categories: data.map(a => a.date),
                yAxis: [{labels: {format: '{value}'}, title: {text: 'Rainfall (mm)'},  allowDecimals: false},],
                series: [{name: 'Rainfall', type: 'column', tooltip: {valueSuffix: ' mm'}, data: data.map(e => !isNaN(e.rainfall) ? this.int(e.rainfall) : null), color: '#69ccc3'},                ]
            },
        };
        chartData["6"] = chartData["5"];
        chartData["7"] = chartData["5"];

        if(chartData[dataSrcId].categories?.length){
            let chart = Highcharts.chart(`chart-fcollmedium-weather1`, {
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
            $(`a#dwn-fcollmedium-weather-sc1`).unbind("click").on("click", () => chart.exportChartLocal({filename: `forecast-weather1-${this.commune}`}));
            //table
            let tableHead = `<tr style="background-color: #69ccc3;">` + Object.keys(data[0]).map(e => 
                `<th class="text-white">${
                    e == "rainfall" ? `${e} (mm)`
                    : e == "rainfall_chance" ? `${e} (%)`
                    : e == "humidity" ? `${e} (%)`
                    : ""
                }</th>`).join("") + `</tr>`;
            let tableBody = data.map(e => `<tr>` + Object.values(e).map(f => `<td>${f}</td>`).join("") + `</tr>`).join("\n");
            $(`table#table-fcollmedium-weather-data1`).empty().html(`<thead>${tableHead}</thead><tbody>${tableBody}</tbody>`);
            $(`a#dwn-fcollmedium-weather-dt1`).unbind("click").on("click", () => $(`table#table-fcollmedium-weather-data1`).table2excel({filename: `forecast-weather1-${this.commune}.xls`, preserveColors: false}));
        } else{
            $(`div#chart-fcollmedium-weather1`).empty().html(`<div class="text-center">Data is unavailable for this source</div>`);
            $(`a#dwn-fcollmedium-weather-sc1`).unbind().on("click").on("click", () => alert("Cannot download for data that's unavailable"));
            $(`a#dwn-fcollmedium-weather-dt1`).unbind("click").on("click", () => alert("Cannot download for data that's unavailable"));
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