class CurrentRainfall{
    constructor(communeId, locationDetails, commonLookupDetails){
        this.year = new Date().getFullYear();
        this.locationLabel = $("span#weather-location-label");
        this.region = locationDetails.region;
        this.cercle = locationDetails.cercle;
        this.commune = locationDetails.commune;
        this.regionId = locationDetails.regionId;
        this.cercleId = locationDetails.cercleId;
        this.communeId = communeId;
        this.filterDataSources = $("input[type='radio'][name='crf-dtsrc']");
        // common lookups
        this.months = commonLookupDetails.months;
        this.weeks = commonLookupDetails.weeks;
        

        // Filters - Current Rainfall
        this.emptyOption = `<option value="">---------</option>\n`;
        // how much filters
        this.hmFromMonth = $("select#filter-crf-hm-m1");
        this.hmToMonth = $("select#filter-crf-hm-m2");
        this.hmFromWeek = $("select#filter-crf-hm-w1");
        this.hmToWeek = $("select#filter-crf-hm-w2");
        this.hmFromDate = $("input[type='date']#filter-crf-hm-d1");
        this.hmToDate = $("input[type='date']#filter-crf-hm-d2");
        this.temporalLevel = $("div.tab-pane.crf-temporal.active").data("temporal-level");
        this.hmApply = $("button#apply-crf-hm");

        this.temporalFillers = {
            "monthly": {
                "label": "Month",
                "column": "month_text",
                "rf_stats": "monthly_rf_stats",
                "rf_vals": "monthly_rf_vals",
            },
            "weekly": {
                "label": "Meteorological Week",
                "column": "week",
                "rf_stats": "weekly_rf_stats",
                "rf_vals": "weekly_rf_vals"
            },
            "daily": {
                "label": "Day",
                "column": "date",
                "rf_stats": "daily_rf_stats",
                "rf_vals": "daily_rf_vals"
            }
        };
        this.chartTemporalLabel = $("span#crf-hm-temporal-label");
        this.compChart = null;

        this.rootUrl = weatherApiUrl;
        debugger;
    }

    execute = () => {
        let selectedOption = $("#crf-hm-dropdown option:selected").val();
        $(".tab-pane.crf-temporal").removeClass("active");
        $(selectedOption).addClass("active");
        $("#crf-hm-dropdown").on("change", function () {
            let selectedOption = $(this).val();
            $(".tab-pane.crf-temporal").removeClass("active");
            $(selectedOption).addClass("active");
        });
        this.locationLabel.empty().html(`${this.commune}, ${this.cercle}, ${this.region}`);
        this.locationLabel.attr("data-region-id", this.regionId);
        this.locationLabel.attr("data-cercle-id", this.cercleId);
        this.locationLabel.attr("data-commune-id", this.communeId);
        this.chartTemporalLabel.empty().html(`Rainfall for the current year`);
        this.hmFromMonth.empty().html(this.emptyOption + this.months.map(a => `<option value="${a.month_id}">${a.month}</option>`).join("\n"));
        this.hmToMonth.empty().html(this.emptyOption + this.months.map(a => `<option value="${a.month_id}">${a.month}</option>`).join("\n"));
        this.hmFromWeek.empty().html(this.emptyOption + this.weeks.map(a => `<option value="${a.week_id}">${a.week} (${a.week_id})</option>`).join("\n"));
        this.hmToWeek.empty().html(this.emptyOption + this.weeks.map(a => `<option value="${a.week_id}">${a.week} (${a.week_id})</option>`).join("\n"));
        this.hmFromDate.attr("min", `${this.year}-01-01`).attr("max", `${this.year}-12-31`);
        this.hmToDate.attr("min", `${this.year}-01-01`).attr("max", `${this.year}-12-31`);
        this.correlateFilters();
    }

    correlateFilters = () => {
        this.hmFromMonth.on("change", () => {this.hmFromWeek.val(""); this.hmToWeek.val(""); this.hmFromDate.val(""); this.hmToDate.val("");});
        this.hmToMonth.on("change", () => {this.hmFromWeek.val(""); this.hmToWeek.val(""); this.hmFromDate.val(""); this.hmToDate.val("");});
        this.hmFromWeek.on("change", () => {this.hmFromMonth.val(""); this.hmToMonth.val(""); this.hmFromDate.val(""); this.hmToDate.val("");});
        this.hmToWeek.on("change", () => {this.hmFromMonth.val(""); this.hmToMonth.val(""); this.hmFromDate.val(""); this.hmToDate.val("");});
        this.hmFromDate.on("change", () => {this.hmFromMonth.val(""); this.hmToMonth.val(""); this.hmFromMonth.val(""); this.hmToMonth.val("");});
        this.hmToDate.on("change", () => {this.hmFromMonth.val(""); this.hmToMonth.val(""); this.hmFromMonth.val(""); this.hmToMonth.val("");});

        this.hmApply.unbind("click").on("click", () => {
            this.temporalLevel = $("div.tab-pane.crf-temporal.active").data("temporal-level");
            this.loadHowMuch(this.temporalLevel);
        }).trigger("click");
    }

    loadHowMuch = (temporalLevel, reqBody) => {
        this.selectedSource = $("input[type='radio'][name='crf-dtsrc']:checked").data("label");
        this.hmReq = {
            "communeId": this.communeId || null,
            "dataSrcId": $("input[type='radio'][name='crf-dtsrc']:checked").val() || null,
            "fromMonth": this.hmFromMonth.val() && !isNaN(this.hmFromMonth.val()) ? this.int(this.hmFromMonth.val()): 0,
            "toMonth": this.hmToMonth.val() && !isNaN(this.hmToMonth.val()) ? this.int(this.hmToMonth.val()): 0,
            "fromWeek": this.hmFromWeek.val() && !isNaN(this.hmFromWeek.val()) ? this.int(this.hmFromWeek.val()): 0,
            "toWeek": this.hmToWeek.val() && !isNaN(this.hmToWeek.val()) ? this.int(this.hmToWeek.val()): 0,
            "fromDate": this.hmFromDate.val() || null,
            "toDate": this.hmToDate.val() || null
        }
        this.post(`current_${temporalLevel}_rainfall`, this.hmReq)
        .then(response => {
            if(response.status){
                let currentData = response.data.cy_data;
                let currentVals = currentData[this.temporalFillers[temporalLevel]["rf_vals"]];
                let currentStats = currentData[this.temporalFillers[temporalLevel]["rf_stats"]];
                this.renderHowMuch(currentVals, currentStats, temporalLevel);
                let historicData = response.data.py_data;
                let gaugeTitle = currentData[`${temporalLevel}_rf_stats`].total >= historicData.hist_rf_avg
                    ? `${parseInt(((currentData[`${temporalLevel}_rf_stats`].total - historicData.hist_rf_avg)*100)/historicData.hist_rf_avg)}%  more than last 30 years avg<br/>(Historical average being ${historicData.hist_rf_avg} mm)`
                    : `${parseInt(((historicData.hist_rf_avg- currentData[`${temporalLevel}_rf_stats`].total)*100)/historicData.hist_rf_avg)}%  less than last 30 years avg<br/>(Historical average being ${historicData.hist_rf_avg} mm)`;
                let compChartData = {
                    "cyVal": parseInt(currentData[`${temporalLevel}_rf_stats`].total), 
                    "pyAvgVal": parseInt(historicData.hist_rf_avg),
                    "titleText": gaugeTitle
                }
                this.renderComparison(compChartData);
            } else throw new Error(response.message)
        })
        .catch(err => {
            let errMsg = JSON.parse(err.responseText).message || err;
            alert(`Unable to get ${temporalLevel} data for current year\n${errMsg}`);
            console.error(err);
        })
        .finally(() => stopWaiting());
    }

    renderHowMuch = (chartData, statsData, temporalLevel) => {
        this.chartTemporalLabel.empty().html(`${temporalLevel} rainfall for the current year`);
        if(temporalLevel == "monthly"){
            let monthFilledChartData = this.months.map(a => {
                let m = chartData.find(b => b.month_text == a.month);
                return m ? m : {"month": a.month_id, "month_text": a.month, "rainfall": null, "mean_rf": null, "cumulative_rf": null};
            });
            chartData = monthFilledChartData;
        }
        
        if(chartData.length){
            // chart
            let crfHMChart = Highcharts.chart(`chart-crf-hm`, {
                chart: {zoomType: "xy"},
                title: {text: ""},
                subtitle: {text: ""},
                credits: {enabled: true, text: this.selectedSource},
                exporting: {enabled: false},
                legend: {enabled: true},
                plotOptions: {column: {label: {enabled: false}}, spline: {label: {enabled: false}}},
                xAxis: {categories: chartData.map(e => e[this.temporalFillers[temporalLevel]["column"]]), crosshair: true, title: {text: this.temporalFillers[temporalLevel]["label"]}},
                yAxis: [
                    {labels: {format: '{value}'}, title: {text: 'Rainfall (mm)'}, max: Math.max(...chartData.map(e => e.rainfall))},
                    {title: {text: ''}},
                    {title: {text: '{value} mm'}, opposite: true, title: {text: 'Cumulative Rainfall (mm)'}, max: Math.max(...chartData.map(e => e.cumulative_rf))}
                ],
                tooltip: {shared: true},
                series: [
                    {name: 'Rainfall', type: 'column', yAxis: 0, color: '#69ccc3', tooltip: {valueSuffix: ' mm'}, data: chartData.map(e => e.rainfall) },
                    {name: 'Mean Rainfall', type: 'spline', yAxis: 0, color: 'orange', tooltip: {valueSuffix: ' mm'}, data: chartData.map(e => e.mean_rf)},
                    {name: 'Cumulative Rainfall', type: 'spline', yAxis: 2, color: '#07689c', tooltip: {valueSuffix: ' mm'}, data: chartData.map(e => e.cumulative_rf)} 
                ]
            });
            $(`a#dwn-crf-hm-sc`).unbind("click").on("click", () => crfHMChart.exportChartLocal({filename: `rainfall-current-year-${temporalLevel}-${this.commune}`}));
            // data table
            let t1Head = `<thead style="background-color: #69ccc3; color: white;"><tr>` + Object.keys(chartData[0]).map(a => `<th class="text-white">${["rainfall", "mean_rf", "cumulative_rf"].includes(a) ? `${a} (mm)` : a}</th>`) + `</tr></thead>`;
            let t1body = `<tbody>`+  chartData.map(a => `<tr>` + Object.values(a).map(b => `<td>${b}</td>`).join("") + `</tr>`).join("\n") + `</tbody>`;
            $(`table#table-crf-hm-dt`).empty().html(`${t1Head}${t1body}`);
            $(`a#dwn-crf-hm-dt`).unbind("click").on("click", () => $(`table#table-crf-hm-dt`).table2excel({filename: `rainfall-current-year-${temporalLevel}-${this.commune}.xls`, preserveColors: false}))
            // stats table
            let t2Head = `<thead style="background-color: #69ccc3; color: white;"><tr><td>${this.temporalFillers[temporalLevel]["label"]}s</td><td>Min (mm)</td><td>Max (mm)</td><td>Mean (mm)</td><td>Total</td><td>% Variance</td><td>Std Deviation</td></tr></thead>`;
            let t2Body = `<tbody><tr><td>${statsData.count}</td><td>${statsData.min}</td><td>${statsData.max}</td><td>${statsData.mean}</td><td>${statsData.total}</td><td>${statsData.cov}</td><td>${statsData.std_dev}</td></tr></tbody>`
            $(`table#table-crf-hm-st`).empty().html(`${t2Head}${t2Body}`);
            $(`a#dwn-crf-hm-st`).unbind("click").on("click", () => $(`table#table-crf-hm-st`).table2excel({filename: `rainfall-current-year-stats-${temporalLevel}-${this.commune}.xls`, preserveColors: false}))
        } else {
            $(`a#dwn-crf-hm-sc`).unbind("click").on("click", () => alert("Cannot download for data that's unavailable"));
            $(`a#dwn-crf-hm-dt`).unbind("click").on("click", () => alert("Cannot download for data that's unavailable"));
            $(`a#dwn-crf-hm-st`).unbind("click").on("click", () => alert("Cannot download for data that's unavailable"));
        }
    }

    renderComparison = (chartData) => {
        if (this.compChart) {
            this.compChart.destroy();
        }
    
        let plotBands = chartData.cyVal > chartData.pyAvgVal * 2
            ? [
                { from: 0, to: chartData.pyAvgVal, color: "red", zIndex: -1 },
                { from: chartData.pyAvgVal, to: chartData.pyAvgVal * 2, color: "orange", zIndex: -1 },
                { from: chartData.pyAvgVal * 2, to: chartData.pyAvgVal * 3, color: "green", zIndex: -1 }
            ]
            : [
                { from: 0, to: chartData.pyAvgVal, color: "red", zIndex: -1 },
                { from: chartData.pyAvgVal, to: chartData.pyAvgVal * 2, color: "green", zIndex: -1 }
            ];

        let customTicks = chartData.cyVal > chartData.pyAvgVal * 2
            ? [0, chartData.pyAvgVal, chartData.pyAvgVal * 2, chartData.pyAvgVal * 3]
            : [0, chartData.pyAvgVal, chartData.pyAvgVal * 2];
        
    
        this.compChart = Highcharts.chart("chart-crf-hm-comp", {
            chart: {
                type: "gauge",
                plotBackgroundColor: null,
                plotBackgroundImage: null,
                plotBorderWidth: 0,
                plotShadow: false,
            },
            credits: { enabled: true, text: this.selectedSource },
            exporting: { enabled: false },
            title: {
                text: chartData.titleText,
                style: {
                    fontSize: "12px",
                    fontWeight: "normal",
                    marginTop: "25px",
                },
            },
            pane: {
                startAngle: -135,
                endAngle: 135,
                background: [],
            },
            yAxis: [{
                min: 0,
                max: chartData.pyAvgVal * (chartData.cyVal > chartData.pyAvgVal * 2 ? 3 : 2),
                minorTickInterval: null,
                tickPositions: customTicks,
                tickLength: 0,
                labels: {
                    step: 1,
                    distance: 15,
                    style: {
                        fontSize: "12px",
                    },
                    formatter: function() {
                        if (customTicks.indexOf(this.value) !== -1) {
                            return this.value;
                        }
                    },
                },
                title: {
                    text: "",
                },
                plotBands: plotBands,
            }],
            series: [{
                name: "Selected period's rainfall",
                data: [chartData.cyVal],
                color: '#69ccc3',
                tooltip: {
                    valueSuffix: " mm",
                },
            }],
        });
    
        this.compChart.series[0].setData([chartData.cyVal]);
    };
    

    int = num => !isNaN(num) ? Number(parseInt(num)) : null;
    float = num => !isNaN(num) ? Number(parseFloat(num).toFixed(3)) : null;

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