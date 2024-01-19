class ForecastCollectiveSeasonal{
    constructor(communeId, locationDetails, commonLookupDetails){
        this.year = new Date().getFullYear();
        this.locationLabel = $("span#location-label");
        this.region = locationDetails.region;
        this.cercle = locationDetails.cercle;
        this.commune = locationDetails.commune;
        this.regionId = locationDetails.regionId;
        this.cercleId = locationDetails.cercleId;
        this.communeId = communeId;
        this.filterDataSources = $("input[type='radio'][name='fcollseasonal-dtsrc']");
        // common lookups
        this.months = commonLookupDetails.months;
        this.weeks = commonLookupDetails.weeks;

        this.rootUrl = weatherApiUrl;
        this.forecastDescription = $("div#fcollseasonal-desc");
        this.forecastGraphCard = $("div#card-fcollseasonal-graph");
        this.forecastGraph  = $("div#chart-fcollseasonal");
        this.forecastSummary = $("div#fcollseasonal-summary");
        this.nmmeColors = {"Above Normal": "green", "Near Normal": "blue", "Below Normal": "orange"};
    }

    execute = () => {
        this.locationLabel.empty().html(`${this.commune}, ${this.cercle}, ${this.region}`);
        this.locationLabel.attr("data-region-id", this.regionId);
        this.locationLabel.attr("data-cercle-id", this.cercleId);
        this.locationLabel.attr("data-commune-code", this.communeId);
        $("input[type='radio'][name='fcollseasonal-dtsrc']").unbind("change").on("change", () => $(`a.nav-link.page-menu[href="#fcollseasonal"]`).trigger("click"));
        this.loadData();
    }

    loadData = () => {
        this.hmReq = {
            "communeId": this.communeId || null,
            "dataSrcId": $("input[type='radio'][name='fcollseasonal-dtsrc']:checked").val() || null,
        };
        this.post("forecast_collective", this.hmReq)
        .then(response => {
            if(response.status){
                if(this.hmReq.dataSrcId == 9) this.renderDescription(response.data)
                else this.renderGraph(response.data, this.hmReq.dataSrcId)
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


    renderDescription = (responseData) => {
        this.forecastDescription.show();
        this.forecastGraphCard.hide();
        if(responseData){
            let responseText = Object.keys(responseData).map(a => {
                if(
                    ["Rainfall Forecast", "Long Term Mean (1991-2020)"].includes(a) 
                    && !responseData[a].includes("mm")
                ) responseData[a] += " mm";
                return responseData[a] ? `<p><b>${a}</b>: ${responseData[a]}</p>` : null;
            }).filter(Boolean);
            this.forecastDescription.empty().html(responseText || `<p>Data for this commune is unavailable</p>`);
        } else this.forecastDescription.empty().html(`<p>Data for this commune is unavailable</p>`);
    }

    renderGraph = (responseData, dataSrcId) => {
        this.forecastDescription.hide();
        this.forecastGraphCard.show();
        if(responseData.length){
            let chartData = {
                "8": {
                    categories: this.uqArray(responseData.map(a => a.forecast_period)),
                    yAxis: [{labels: {format: '{value}'}, title: {text: 'Probability (%)'},  allowDecimals: false},],
                    series: Object.keys(this.nmmeColors).map(a => {
                        return {
                            "name": a,
                            "data": responseData.filter(b => b.tertiary_class == a).map(b => !isNaN(b.prob) ? this.float1(b.prob) : null),
                            "color": this.nmmeColors[a]
                        }
                    })
                },
            };

            let weatherCards = this.uqArray(responseData.map(a => a.forecast_period)).map(a => {
                let outlookProbability = Object.keys(this.nmmeColors).map(b => {
                    let probability = responseData.find(c => c.forecast_period == a && c.tertiary_class == b)?.prob || 0;
                    return `<p><b>${b} Probability:</b>&nbsp;${this.float1(probability)}%</p>`
                }).join("\n");
                return `<div class="card card-shadow ms-1 me-1 mt-1 mb-1 p-3" style="background-color: #dffffc33">
                    <p class="mb-3 mt-3"><b>Forecast Period: ${a}</b></p>
                    ${outlookProbability}
                </div>`;
            })
            this.forecastSummary.empty().html(weatherCards);

            let chart = Highcharts.chart("chart-fcollseasonal", {
                chart: {type: 'column'},
                title: {text: ''},
                subtitle: {text: ''},
                legend: {enabled: true},
                credits: {enabled: true},
                exporting: {enabled: false},
                plotOptions: {column: {label: {enabled: false}}, spline: {label: {enabled: false}}},
                xAxis: {categories: chartData[dataSrcId].categories, crosshair: true, title: {text: "Forecast Period"}},
                yAxis: {title: {"text": "Probability (%)"}},
                tooltip: {shared: true, valueSuffix: " %"},
                series: chartData[dataSrcId].series
            });

            // downloads
            $(`a#dwn-fcollseasonal-graph-sc`).unbind("click").on("click", () => chart.exportChartLocal({filename: `forecast-seasonal-${this.commune}`}));
            let tableHead = `<tr style="background-color: #69ccc3;">` + Object.keys(responseData[0]).map(e => 
                `<th class="text-white">${
                    e == "rainfall" ? `${e} (mm)`
                    : ""
                }</th>`).join("") + `</tr>`;
            let tableBody = responseData.map(e => `<tr>` + Object.values(e).map(f => `<td>${f}</td>`).join("") + `</tr>`).join("\n");
            $(`table#table-fcollseasonal-graph-data`).empty().html(`<thead>${tableHead}</thead><tbody>${tableBody}</tbody>`);
            $(`a#dwn-fcollseasonal-graph-dt`).unbind("click").on("click", () => $(`table#table-fcollseasonal-graph-data`).table2excel({filename: `forecast-seasonal-${this.commune}.xls`, preserveColors: false}));
        } else{
            this.forecastSummary.empty();
            this.forecastDescription.empty();
            $(`a#dwn-fcollseasonal-graph-sc`).unbind().on("click").on("click", () => alert("Cannot download for data that's unavailable"));
            $(`a#dwn-fcollseasonal-graph-dt`).unbind("click").on("click", () => alert("Cannot download for data that's unavailable"));
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