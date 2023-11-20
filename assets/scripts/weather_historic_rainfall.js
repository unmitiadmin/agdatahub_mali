class HistoricRainfall{
    constructor(communeId, locationDetails, commonLookupDetails){
        this.region = locationDetails.region;
        this.cercle = locationDetails.cercle;
        this.commune = locationDetails.commune;
        this.locationLabel = $("span#weather-location-label");
        this.regionId = locationDetails.regionId;
        this.cercleId = locationDetails.cercleId;
        this.communeId = communeId;
        this.filterDataSources = $("input[type='radio'][name='hrf-dtsrc']");
        // this.dataSrcId = $("input[type='radio'][name='hrf-dtsrc']:checked");
        
        // common lookups
        this.months = commonLookupDetails.months;
        this.weeks = commonLookupDetails.weeks;
        this.crops = commonLookupDetails.crops;

        // Filters - Historic Rainfall
        this.emptyOption = `<option value="">---------</option>\n`;
        // how much filters
        this.hmFromMonth = $("select#filter-hrf-hm-m1");
        this.hmToMonth = $("select#filter-hrf-hm-m2");
        this.hmFromWeek = $("select#filter-hrf-hm-w1");
        this.hmToWeek = $("select#filter-hrf-hm-w2");
        this.hmRfGte = $("input[type='number']#filter-hrf-hm-gte");
        this.hmRfLt = $("input[type='number']#filter-hrf-hm-lt");
        this.hmApply = $("button#apply-hrf-hm");
        // how dry filters
        this.hdFromWeek = $("select#filter-hrf-hd-w1");
        this.hdToWeek = $("select#filter-hrf-hd-w2");
        this.hdRfLt = $("input[type='number']#filter-hrf-hd-lt");
        this.hdApply = $("button#apply-hrf-hd");
        // how wet filters
        this.hwFromWeek = $("select#filter-hrf-hw-w1");
        this.hwToWeek = $("select#filter-hrf-hw-w2");
        this.hwRfGte = $("input[type='number']#filter-hrf-hw-gte");
        this.hwApply = $("button#apply-hrf-hw");
        // crop stress filters
        this.csCrop = $("select#filter-hrf-cs-crop");
        this.csFromWeek = $("select#filter-hrf-cs-w1");
        this.csRfLt = $("input[type='number']#filter-hrf-cs-lt");
        this.csApply = $("button#apply-hrf-cs");

        this.rootUrl = weatherApiUrl;
    }

    execute = () => {
        let selectedOption = $("#hrf-hm-dropdown option:selected").val();
        $(".tab-pane.hrf-temporal").removeClass("active");
        $(selectedOption).addClass("active");
        $("#hrf-hm-dropdown").on("change", function () {
            let selectedOption = $(this).val();
            $(".tab-pane.hrf-temporal").removeClass("active");
            $(selectedOption).addClass("active");
        });
        this.locationLabel.empty().html(`${this.commune}, ${this.cercle}, ${this.region}`);
        this.locationLabel.attr("data-region-id", this.regionId);
        this.locationLabel.attr("data-cercle-id", this.cercleId);
        this.locationLabel.attr("data-commune-id", this.communeId);
        this.hmFromMonth.empty().html(this.emptyOption + this.months.map(a => `<option value="${a.month_id}">${a.month}</option>`).join("\n"));
        this.hmToMonth.empty().html(this.emptyOption + this.months.map(a => `<option value="${a.month_id}">${a.month}</option>`).join("\n"));
        this.hmFromWeek.empty().html(this.emptyOption + this.weeks.map(a => `<option value="${a.week_id}">${a.week} (${a.week_id})</option>`).join("\n"));
        this.hmToWeek.empty().html(this.emptyOption + this.weeks.map(a => `<option value="${a.week_id}">${a.week} (${a.week_id})</option>`).join("\n"));
        this.hdFromWeek.empty().html(this.emptyOption + this.weeks.map(a => `<option value="${a.week_id}">${a.week} (${a.week_id})</option>`).join("\n"));
        this.hdToWeek.empty().html(this.emptyOption + this.weeks.map(a => `<option value="${a.week_id}">${a.week} (${a.week_id})</option>`).join("\n"));
        this.hwFromWeek.empty().html(this.emptyOption + this.weeks.map(a => `<option value="${a.week_id}">${a.week} (${a.week_id})</option>`).join("\n"));
        this.hwToWeek.empty().html(this.emptyOption + this.weeks.map(a => `<option value="${a.week_id}">${a.week} (${a.week_id})</option>`).join("\n"));
        this.csCrop.empty().html(this.emptyOption + this.crops.map(a => `<option value="${a.crop_id}">${a.crop}</option>`).join("\n"));
        this.csFromWeek.empty().html(this.emptyOption + this.weeks.map(a => `<option value="${a.week_id}">${a.week} (${a.week_id})</option>`).join("\n"));
        this.correlateFilters();
    }

    
    correlateFilters = () => {
        // how much events
        // month filters
        this.hmFromMonth.on("change", () => {
            this.hmFromWeek.val("");  
            this.hmToWeek.val("");
            let fromMonthVal = this.hmFromMonth.val() ? this.int(this.hmFromMonth.val()) : 0;
            if(fromMonthVal > 1){
                let toMonthOptions = this.emptyOption
                    + this.months.filter(a => a.month_id > fromMonthVal).map(a => `<option value=${a.month_id}>${a.month}</option>`).join("\n")
                    + this.months.filter(a => a.month_id <= fromMonthVal).map(a => `<option value=${a.month_id}>${a.month} (+1y)</option>`).join("\n")
                this.hmToMonth.empty().html(toMonthOptions);
            }
        });
        this.hmToMonth.on("change", () => {
            this.hmFromWeek.val("");
            this.hmToWeek.val("");
        });
        // week filters
        this.hmFromWeek.on("change", () => {
            this.hmFromMonth.val("");
            this.hmToMonth.val("");
            let fromWeekVal = this.hmFromWeek.val() ? this.int(this.hmFromWeek.val()) : 0;
            if(fromWeekVal > 1){
                let toWeekOptions = this.emptyOption
                    + this.weeks.filter(a => a.week_id > fromWeekVal).map(a => `<option value=${a.week_id}>${a.week} (${a.week_id})</option>`).join("\n")
                    + this.weeks.filter(a => a.week_id <= fromWeekVal).map(a => `<option value=${a.week_id}>${a.week} (${a.week_id}) (+1y)</option>`).join("\n");
                this.hmToWeek.empty().html(toWeekOptions);
            }
        });
        this.hmToWeek.on("change", () => {
            this.hmFromMonth.val("");
            this.hmToMonth.val("");
        });
        this.hmApply.unbind("click").on("click", () => this.loadHowMuch()).trigger("click"); // activate back at last

        // how dry events
        // week filters
        this.hdFromWeek.on("change", () => {
            let fromWeekVal = this.hdFromWeek.val() ? this.int(this.hdFromWeek.val()) : 0;
            if(fromWeekVal > 1){
                let toWeekOptions = this.emptyOption
                    + this.weeks.filter(a => a.week_id > fromWeekVal).map(a => `<option value=${a.week_id}>${a.week} (${a.week_id})</option>`).join("\n")
                    + this.weeks.filter(a => a.week_id <= fromWeekVal).map(a => `<option value=${a.week_id}>${a.week} (${a.week_id}) (+1y)</option>`).join("\n");
                this.hdToWeek.empty().html(toWeekOptions);
            }
        });
        this.hdApply.unbind("click").on("click", () => this.loadHowDry());

        // how wet events
        // week filters
        this.hwFromWeek.on("change", () => {
            let fromWeekVal = this.hwFromWeek.val() ? this.int(this.hwFromWeek.val()) : 0;
            if(fromWeekVal > 1){
                let toWeekOptions = this.emptyOption
                    + this.weeks.filter(a => a.week_id > fromWeekVal).map(a => `<option value=${a.week_id}>${a.week} (${a.week_id})</option>`).join("\n")
                    + this.weeks.filter(a => a.week_id <= fromWeekVal).map(a => `<option value=${a.week_id}>${a.week} (${a.week_id}) (+1y)</option>`).join("\n");
                this.hwToWeek.empty().html(toWeekOptions);
            }
        });
        this.hwApply.unbind("click").on("click", () => this.loadHowWet());

        // crop stress events
        this.csApply.unbind("click").on("click", () => this.loadCropStress());
    }


    loadHowMuch = () => {
        this.selectedSource = $("input[type='radio'][name='hrf-dtsrc']:checked").data("label");
        this.hmReq = {
            "communeId": this.communeId || null,
            "dataSrcId": $("input[type='radio'][name='hrf-dtsrc']:checked").val() || null,
            "fromMonth": this.hmFromMonth.val() && !isNaN(this.hmFromMonth.val()) ? this.int(this.hmFromMonth.val()): 0,
            "toMonth": this.hmToMonth.val() && !isNaN(this.hmToMonth.val()) ? this.int(this.hmToMonth.val()): 0,
            "fromWeek": this.hmFromWeek.val() && !isNaN(this.hmFromWeek.val()) ? this.int(this.hmFromWeek.val()): 0,
            "toWeek": this.hmToWeek.val() && !isNaN(this.hmToWeek.val()) ? this.int(this.hmToWeek.val()): 0,
            "rfGte": this.hmRfGte.val() && !isNaN(this.hmRfGte.val()) ? this.float(this.hmRfGte.val()) : 0,
            "rfLt": this.hmRfLt.val() && !isNaN(this.hmRfLt.val()) ? this.float(this.hmRfLt.val()) : 0,
        };
        this.post("historic_yearly_rainfall", this.hmReq)
        .then(response => {
            if(response.status){
                let allYearHMChartData = response.data.all_years_rf_vals;
                let allYearHMStats = response.data.all_years_rf_stats;
                allYearHMChartData.forEach(e => {e.color = e.range_match ? "#69ccc3" : "lightgrey"; e.mean_rf = allYearHMStats.mean;});
                let allYearHMPoeChartData = response.data.all_years_poe;
                this.renderHowMuch(allYearHMChartData, allYearHMPoeChartData, allYearHMStats, "all");

                let elNinoHMChartData = response.data.elnino_year_rf_vals;
                let elNinoHMStats = response.data.elnino_year_rf_stats
                elNinoHMChartData.forEach(e => {e.color = e.range_match && e.year_type_match ? "#69ccc3" : "lightgrey"; e.mean_rf = elNinoHMStats.mean});
                let elNinoHMPoeChartData = response.data.elnino_years_poe;
                this.renderHowMuch(elNinoHMChartData, elNinoHMPoeChartData, elNinoHMStats, "elnino");

                let laNinaHMChartData = response.data.lanina_year_rf_vals;
                let laNinaHMStats = response.data.lanina_year_rf_stats
                laNinaHMChartData.forEach(e => {e.color = e.range_match && e.year_type_match ? "#69ccc3" : "lightgrey"; e.mean_rf = laNinaHMStats.mean});
                let laNinaHMPoeChartData = response.data.lanina_years_poe;
                this.renderHowMuch(laNinaHMChartData, laNinaHMPoeChartData, laNinaHMStats, "lanina");

                let allYearAvg = response.data.all_years_rf_stats.total/response.data.all_years_rf_stats.count;
                let enYearAvg = response.data.elnino_year_rf_stats.total/response.data.elnino_year_rf_stats.count;
                let enTitleText = enYearAvg >= allYearAvg
                    ? `${parseInt(((enYearAvg - allYearAvg)*100)/allYearAvg)}% more than all year mean`
                    : `${parseInt(((allYearAvg - enYearAvg)*100)/allYearAvg)}% less than all year mean`;
                this.renderComparison({"typeAvg": enYearAvg, "allAvg": allYearAvg, "titleText": enTitleText}, "elnino")
                
                let lnYearAvg = response.data.lanina_year_rf_stats.total/response.data.lanina_year_rf_stats.count;
                let lnTitleText = lnYearAvg >= allYearAvg
                    ? `${parseInt(((lnYearAvg - allYearAvg)*100)/allYearAvg)}% more than all year mean`
                    : `${parseInt(((allYearAvg - lnYearAvg)*100)/allYearAvg)}% less than all year mean`;
                this.renderComparison({"typeAvg": lnYearAvg, "allAvg": allYearAvg, "titleText": lnTitleText}, "lanina")
                
            }
        })
        .catch(err => {
            alert("Unable to get historic rainfall data");
            console.error(err);
        })
        .then(() => stopWaiting())

    }

    renderHowMuch = (chartData, poeChartData, stats, yearType) => {
        // chart
        if(chartData.length && chartData.map(a => a.rainfall).every(Boolean)){
            let hrfHMChart = Highcharts.chart(`chart-hrf-hm-${yearType}`, {
                chart: {zoomType: "xy"},
                title: {text: ""},
                subtitle: {text: ""},
                credits: {enabled: true, text: this.selectedSource},
                exporting: {enabled: false},
                legend: {
                    enabled: true,
                    symbolWidth: 0,
                    useHTML: true,
                    labelFormatter: function () {
                        return `<div style="display:flex;align-items:center;">
                            <div style="
                                width: 12px;
                                height: 12px;
                                background-color:${this.options.type === 'column' ? '#69ccc3' : '#07689c'};
                                border-radius:50%;margin-right:8px;
                            ">
                            </div>
                            ${this.name}
                        </div>`;
                    }
                },
                plotOptions: {column: {colorByPoint: true, label: {enabled: false}}, spline: {label: {enabled: false}}},
                xAxis: {categories: chartData.map(e => e.year), crosshair: true, title: {text: "Year"}},
                yAxis: [
                    {labels: {format: '{value}'}, title: {text: 'Rainfall (mm)'}},
                    {title: {text: ''}, opposite: false},
                ],
                tooltip: {shared: true},
                series: [
                    {name: 'Rainfall', type: 'column', tooltip: {valueSuffix: ' mm'}, data: chartData.map(e => {return {"y": e.rainfall, "color": e.color}}) },
                    {name: 'Mean', type: 'spline', color: '#07689c', tooltip: {valueSuffix: 'mm'}, data: chartData.map(e => e.mean_rf)} 
                ]
            });
            $(`a#dwn-hrf-hm-${yearType}-sc`).unbind("click").on("click", () => hrfHMChart.exportChartLocal({filename: `rainfall-${yearType}-year-${this.commune}`}))
            // chart table
            let t1Head = `<thead style="background-color: #69ccc3; color: white;"><tr>${Object.keys(chartData[0]).map(e => `<th>${["rainfall", "mean_rf"].includes(e) ? `${e} (mm)` : e}</th>`).join("")}</tr></thead>`;
            let t1Body = `<tbody>${chartData.map(a => `<tr>${Object.values(a).map(b => `<td>${b}</td>`)}</tr>`).join("")}<tbody>`;
            $(`table#table-hrf-hm-${yearType}-dt`).html(`${t1Head}${t1Body}`);
            $(`a#dwn-hrf-hm-${yearType}-dt`).unbind("click").on("click", () => $(`table#table-hrf-hm-${yearType}-dt`).table2excel({filename: `rainfall-${yearType}-year-${this.commune}.xls`, preserveColors: false}));
            // chart-stats table
            let t2Head = `<thead style="background-color: #69ccc3; color: white;"><tr><th>Number of Years</th><th>Min (mm)</th><th>Max (mm)</th><th>Mean (mm)</th><th>% Variance</th><th>Standard Deviation</th></tr></thead>`;
            let t2Body = `<tbody><tr><td>${stats.count}</td><td>${stats.min}</td><td>${stats.max}</td><td>${stats.mean}</td><td>${stats.cov}</td><td>${stats.std_dev}</td></tr></tbody>`;
            $(`table#table-hrf-hm-${yearType}-st`).html(`${t2Head}${t2Body}`);
            $(`a#dwn-hrf-hm-${yearType}-st`).unbind("click").on("click", () => $(`table#table-hrf-hm-${yearType}-st`).table2excel({filename: `rainfall-stats-${yearType}-year-${this.commune}.xls`, preserveColors: false}));
        } else{
            $(`table#table-hrf-hm-${yearType}-dt`).empty();
            $(`a#dwn-hrf-hm-${yearType}-dt`).unbind("click").on("click", () => alert("Cannot download for the data that's unavailable"));
            $(`table#table-hrf-hm-${yearType}-st`).empty();
            $(`a#dwn-hrf-hm-${yearType}-st`).unbind("click").on("click", () => alert("Cannot download for the data that's unavailable"));
            $(`div#chart-hrf-hm-${yearType}`).empty().html(`<div class="my-5" style="height: inherit;">Data unavailable for the selected commune from ${this.selectedSource}</div>`);
        }

        // chart-poe
        if(poeChartData?.length){
            let upperlimit = Math.ceil(Math.max(...poeChartData.map(e => e.rainfall)) /100)*100 + 100;
            let hrfHMPoeChart = Highcharts.chart(`chart-hrf-hm-${yearType}-poe`, {
                chart: {zoomType: 'xy'},
                title: {text: ''},
                subtitle: {text: ''},
                credits: {enabled: true, text: this.selectedSource},
                exporting: {enabled: false},
                plotOptions: {series: {marker: {enabled: true}, label: {enabled: false}}},
                xAxis: { crosshair: true, title: {text: "Rainfall (mm)"}, min: 0, max: upperlimit},
                yAxis: [{labels: {format: '{value}'}, title: {text: 'Probability (%)'}, max: 100}],
                series: [{
                    name: "Probability", type: 'spline', color: "#07689c", linewidth: 1, 
                    data: poeChartData.map(e => {return {"x": e.rainfall, "y": e.probability, color: "#07689c"}}), 
                    showInLegend: false
                }]
            });
            $(`a#dwn-hrf-hm-${yearType}-poe-sc`).unbind("click").on("click", () => hrfHMPoeChart.exportChartLocal({filename: `rainfall-${yearType}-year-poe-${this.commune}`}))
            let t3Head = `<thead><tr><th>Rainfall (mm)</th><th>Probability of exceedance (%)</th></tr></thead>`;
            let t3Body = `<tbody>` + poeChartData.map(a => `<tr><td>${a.rainfall}</td><td>${a.probability}</td></tr>`).join("") + `</tbody>`;
            $(`table#table-hrf-hm-${yearType}-poe-dt`).empty().html(`${t3Head}${t3Body}`)
            $(`a#dwn-hrf-hm-${yearType}-poe-dt`).unbind("click").on("click", () => $(`table#table-hrf-hm-${yearType}-poe-dt`).table2excel({filename: `rainfall-stats-${yearType}-year-poe-${this.commune}.xls`, preserveColors: false}))
        } else{
            $(`div#chart-hrf-hm-${yearType}-poe`).empty().html(`<div class="my-5" style="height: inherit;">Data unavailable for the selected filters</div>`);
            $(`table#table-hrf-hm-${yearType}-poe-dt`).empty();
            $(`a#dwn-hrf-hm-${yearType}-poe-sc`).unbind("click").on("click", () => alert("Cannot download for the data that's unavailable"));
            $(`a#dwn-hrf-hm-${yearType}-poe-dt`).unbind("click").on("click", () => alert("Cannot download for the data that's unavailable"));
        }
    }

    loadHowDry = () => {
        this.selectedSource = $("input[type='radio'][name='hrf-dtsrc']:checked").data("label");
        this.hdReq = {
            "communeId": this.communeId || null,
            "dataSrcId": $("input[type='radio'][name='hrf-dtsrc']:checked").val() || null,
            "fromWeek": this.hdFromWeek.val() && !isNaN(this.hdFromWeek.val()) ? this.int(this.hdFromWeek.val()): 0,
            "toWeek": this.hdToWeek.val() && !isNaN(this.hdToWeek.val()) ? this.int(this.hdToWeek.val()): 0,
            "rfLt": this.hdRfLt.val() && !isNaN(this.hdRfLt.val()) ? this.float(this.hdRfLt.val()) : 0,
        };
        this.post("historic_dry_spells", this.hdReq)
        .then(response => {
            if(response.status) this.renderHowDry(response.data)
            else alert(response.message);
        })
        .catch(err => {
            let errMsg = JSON.parse(err.responseText).message;
            alert(`Unable to load dry spells data\n${errMsg}`);
            console.error(err);
        })
        .finally(() => stopWaiting());
    }

    renderHowDry = (tableData) => {
        let vertCell = "writing-mode: tb-rl; transform: rotate(-180deg);"
        let weekHeader = tableData.week_rf_probabilities.map(e => `<td class="text-white">${e.week}</td>`).join("");
        let weekTextHeader = tableData.week_rf_probabilities.map(e => `<td class="text-white" style="${vertCell}"><small>${e.week_text}</small></td>`).join("");
        let probabilityHeader = tableData.week_rf_probabilities.map(e => `<td class="text-white">${Math.round(e.probability)}</td>`).join("");
        let tableHeader = `<thead style="top: 0; position: sticky; inset-block-start: 0;">
            <tr style="background-color: #07689c;">
                <td class="text-white" rowspan="2">Year/Met week</td>
                <td class="text-white" rowspan="2">ENSO Type</td>
                <td class="text-white" rowspan="2">Number of dry weeks</td>
                <td class="text-white" rowspan="2">Longest dry period (weeks)</td>
                ${weekHeader}
            </tr>
            <tr style="background-color: #07689c;">${weekTextHeader}</tr>
            <tr style="background-color: #07689c;"><td class="text-white" colspan="4">Probability (%)</td>${probabilityHeader}</tr>
        </thead>`;

        let allYearsList = Array.from(new Set(tableData.week_year_rf_vals.map(e => e.year)));
        allYearsList.sort((a, b) => a > b ? -1 : 0);
        let tableBody = `<tbody>` + allYearsList.map(yr => {
            let yrRF = tableData.week_year_rf_vals.filter(e => e.year == yr).map((e, i) => {return {"wi": i+1, ...e}});
            let yrDws = tableData.week_year_rf_vals.filter(e => e.year == yr && e.range_match);
            let yrEnso = tableData.week_year_rf_vals.filter(e => e.year == yr)[0].enso;
            let dryWeeks = yrRF.filter(e => e.range_match).map(e => {return {"wi": e.wi, "week": e.week};});
            let dryPeriodsFn = (arr, expected = 0, group = []) => 
                arr.reduce((acc, c, i) => 
                    ((c === expected ? (group.push(c), expected++) : (acc.push(group), group = [c], expected=++c)), 
                    (i === arr.length-1 && acc.push(group)), 
                    acc), []
            ).filter(e => e.length);
            let dryPeriods = dryPeriodsFn(dryWeeks.map(a => a.wi));
            dryPeriods.sort((a, b) => a.length > b.length ? -1 : 0);
            const findWeekByIndex = (dryPeriod) => {
                let fromWk = dryWeeks.find(a => a.wi == Math.min(...dryPeriod)).week;
                let toWk = dryWeeks.find(a => a.wi == Math.max(...dryPeriod)).week;
                return `<small>${fromWk} to ${toWk}</small>`;
            }
            let longestDryPeriod = dryPeriods.length ? findWeekByIndex(dryPeriods[0]) : `<small>N/A</small>` ;
            let yrRFRow = `<tr><th>${yr}</th><th><small>${yrEnso}</small></th><td>${yrDws.length}</td><td>${longestDryPeriod}</td>` + yrRF.map(e => {
                return e.range_match ? `<th style="color: red; background-color:pink">${this.int(e.rainfall)}</th>` : `<td>${this.int(e.rainfall)}</td>`;
            }).join("") + `</tr>`;
            return yrRFRow;
        }).join("") + `</tbody>`;
        $(`table#table-hrf-hd`).empty().html(tableHeader + tableBody);
        $(`a#dwn-hrf-hd-data`).unbind("click").on("click", () => $(`table#table-hrf-hd`).table2excel({filename: `dryspells-${this.commune}.xls`, preserveColors: true}));
    }

    loadHowWet = () => {
        this.selectedSource = $("input[type='radio'][name='hrf-dtsrc']:checked").data("label");
        this.hwReq = {
            "communeId": this.communeId || null,
            "dataSrcId": $("input[type='radio'][name='hrf-dtsrc']:checked").val() || null,
            "fromWeek": this.hwFromWeek.val() && !isNaN(this.hwFromWeek.val()) ? this.int(this.hwFromWeek.val()): 0,
            "toWeek": this.hwToWeek.val() && !isNaN(this.hwToWeek.val()) ? this.int(this.hwToWeek.val()): 0,
            "rfGte": this.hwRfGte.val() && !isNaN(this.hwRfGte.val()) ? this.float(this.hwRfGte.val()) : 0
        };
        this.post("historic_wet_spells", this.hwReq)
        .then(response => {
            if(response.status) this.renderHowWet(response.data)
            else alert(response.message);
        })
        .catch(err => {
            let errMsg = JSON.parse(err.responseText).message;
            alert(`Unable to load wet spells data\n${errMsg}`);
            console.error(err);
        })
        .finally(() => stopWaiting());
    }

    renderHowWet = (tableData) => {
        let vertCell = "writing-mode: tb-rl; transform: rotate(-180deg);"
        let weekHeader = tableData.week_rf_probabilities.map(e => `<td class="text-white">${e.week}</td>`).join("");
        let weekTextHeader = tableData.week_rf_probabilities.map(e => `<td class="text-white" style="${vertCell}"><small>${e.week_text}</small></td>`).join("");
        let probabilityHeader = tableData.week_rf_probabilities.map(e => `<td class="text-white">${Math.round(e.probability)}</td>`).join("");
        let tableHeader = `<thead style="top: 0; position: sticky; inset-block-start: 0;">
            <tr style="background-color: #07689c;">
                <td class="text-white" rowspan="2">Year/Met week</td>
                <td class="text-white" rowspan="2">ENSO Type</td>
                <td class="text-white" rowspan="2">Number of wet weeks</td>
                <td class="text-white" rowspan="2">Longest wet period (weeks)</td>
                ${weekHeader}
            </tr>
            <tr style="background-color: #07689c;">${weekTextHeader}</tr>
            <tr style="background-color: #07689c;"><td class="text-white" colspan="4">Probability (%)</td>${probabilityHeader}</tr>
        </thead>`;

        let allYearsList = Array.from(new Set(tableData.week_year_rf_vals.map(e => e.year)));
        allYearsList.sort((a, b) => a > b ? -1 : 0);
        let tableBody = `<tbody>` + allYearsList.map(yr => {
            let yrRF = tableData.week_year_rf_vals.filter(e => e.year == yr).map((e, i) => {return {"wi": i+1, ...e}});
            let yrDws = tableData.week_year_rf_vals.filter(e => e.year == yr && e.range_match);
            let yrEnso = tableData.week_year_rf_vals.filter(e => e.year == yr)[0].enso;
            let wetWeeks = yrRF.filter(e => e.range_match).map(e => {return {"wi": e.wi, "week": e.week};});
            let wetPeriodsFn = (arr, expected = 0, group = []) => 
                arr.reduce((acc, c, i) => 
                    ((c === expected ? (group.push(c), expected++) : (acc.push(group), group = [c], expected=++c)), 
                    (i === arr.length-1 && acc.push(group)), 
                    acc), []
            ).filter(e => e.length);
            let wetPeriods = wetPeriodsFn(wetWeeks.map(a => a.wi));
            wetPeriods.sort((a, b) => a.length > b.length ? -1 : 0);
            const findWeekByIndex = (wetPeriod) => {
                let fromWk = wetWeeks.find(a => a.wi == Math.min(...wetPeriod)).week;
                let toWk = wetWeeks.find(a => a.wi == Math.max(...wetPeriod)).week;
                return `<small>${fromWk} to ${toWk}</small>`;
            }
            let longestwetPeriod = wetPeriods.length ? findWeekByIndex(wetPeriods[0]) : `<small>N/A</small>` ;
            let yrRFRow = `<tr><th>${yr}</th><th><small>${yrEnso}</small></th><td>${yrDws.length}</td><td>${longestwetPeriod}</td>` + yrRF.map(e => {
                return e.range_match ? `<th style="color: green; background-color:lightgreen;">${this.int(e.rainfall)}</th>` : `<td>${this.int(e.rainfall)}</td>`;
            }).join("") + `</tr>`;
            return yrRFRow;
        }).join("") + `</tbody>`;
        $(`table#table-hrf-hw`).empty().html(tableHeader + tableBody);
        $(`a#dwn-hrf-hw-data`).unbind("click").on("click", () => $(`table#table-hrf-hw`).table2excel({filename: `wetspells-${this.commune}.xls`, preserveColors: true}));
    }

    loadCropStress = () => {
        this.selectedSource = $("input[type='radio'][name='hrf-dtsrc']:checked").data("label");
        this.selectedCrop = $("select#filter-hrf-cs-crop option:selected").text();
        this.csReq = {
            "communeId": this.communeId || null,
            "dataSrcId": $("input[type='radio'][name='hrf-dtsrc']:checked").val() || null,
            "cropId": this.csCrop.val() && !isNaN(this.csCrop.val()) ? this.int(this.csCrop.val()) : 0,
            "fromWeek": this.csFromWeek.val() && !isNaN(this.csFromWeek.val()) ? this.int(this.csFromWeek.val()): 0,
            "rfLt": this.csRfLt.val() && !isNaN(this.csRfLt.val()) ? this.float(this.csRfLt.val()) : 0
        };
        this.post("historic_crop_stress", this.csReq)
        .then(response => {
            if(response.status) this.renderCropStress(response.data)
            else alert(response.message);
        })
        .catch(err => {
            let errMsg = JSON.parse(err.responseText).message;
            alert(`Unable to load wet spells data\n${errMsg}`);
            console.error(err);
        })
        .finally(() => stopWaiting());
    }

    renderCropStress = (tableData) => {
        let sowStages = Array.from(new Set(tableData.week_rf_probabilities.map(e => e.stage)));
        let sowStageHead = `<tr style="background-color: #07689c;"><th class="text-white">Crop Stage</th>` + sowStages.map(s => {
            let stageSpan = tableData.week_rf_probabilities.filter(t => t.stage == s).length;
            return `<th  class="text-white" colspan="${stageSpan}">${s}</th>`
        }).join("") + `</tr>`;
        let weekHead = `<tr style="background-color: #07689c;"><th class="text-white">Met Week</th>` + tableData.week_rf_probabilities.map(e => `<th class="text-white">${e.week}</th>`) + `</tr>`;
        let weekTextHead = `<tr style="background-color: #07689c;"><th class="text-white">(During)</th>` + tableData.week_rf_probabilities.map(e => `<th class="text-white"><small>${e.week_text}</small></th>`) + `</tr>`;
        let tableHead = `<thead>${sowStageHead}${weekHead}${weekTextHead}</thead>`;
        let tableBody = `<tbody><tr><th>Probability (%)</th>` +
            tableData.week_rf_probabilities.map(t => {
                return t.prob_match ? `<th style="background-color:pink; color:red;">${Math.round(t.probability)}</th>` : `<th style="background-color:lightgreen; color:green;">${Math.round(t.probability)}</th>`
            }).join("")
        + `</tr></tbody>`;
        $(`table#table-hrf-cs`).empty().html(`${tableHead}${tableBody}`);
        // $(`div#table-hrf-cs-legend`).empty().html(`
        //     <span style="height: 25px; width: 25px; background-color: pink; border-radius: 50%; display: inline-block;"></span>&nbsp;<span style="padding-bottom: 20px;">above ${tableData.threshold}%</span>
        //     &nbsp;&nbsp;&nbsp;&nbsp;
        //     <span style="height: 25px; width: 25px; background-color: lightgreen; border-radius: 50%; display: inline-block;"></span>&nbsp;<span style="padding-bottom: 20px;">below ${tableData.threshold}%</span>
        // `);
        $(`a#dwn-hrf-cs-data`).unbind("click").on("click", () => $(`table#table-hrf-cs`).table2excel({filename: `crop-stress-${this.selectedCrop}-${this.commune}.xls`, preserveColors: true}));
    }

    renderComparison = (chartData, yearType) => {
        let selectedSource = this.selectedSource;
        let plotBands = [
            { from: 0, to: Math.round(chartData.allAvg), color: "red", zIndex: -1 },
            { from: Math.round(chartData.allAvg), to: Math.round(chartData.allAvg * 2), color: "green", zIndex: -1 }
        ];
        let customTicks = [0, Math.round(chartData.allAvg), Math.round(chartData.allAvg*2)];
        let yearTypeLabel = {"elnino": "El Niño", "lanina": "La Niña"}

        Highcharts.chart(`chart-hrf-hm-${yearType}-comp`, {
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
                max: Math.round(chartData.allAvg*2),
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
                name: `${yearTypeLabel[yearType]} years' average rainfall`,
                data: [Math.round(chartData.typeAvg)],
                color: '#69ccc3',
                tooltip: {
                    valueSuffix: " mm",
                },
            }],
        });
    }


    // renderComparison = (chartData, yearType) => {
    //     let selectedSource = this.selectedSource;   
    //     am4core.ready(function() {
    //         am4core.useTheme(am4themes_animated);
    
    //         var chart = am4core.create(`chart-hrf-hm-${yearType}-comp`, am4charts.GaugeChart);
    //         chart.hiddenState.properties.opacity = 0;
    //         chart.innerRadius = -25;
    //         chart.logo.disabled = true;
    //         chart.fontFamily = "Arial, sans-serif"
    //         chart.startAngle = 0; // Rotate the chart to the right
    //         chart.endAngle = -90; // Rotate the chart to the right
            
    //         var axis = chart.xAxes.push(new am4charts.ValueAxis());
    //         axis.min = 0;
    //         axis.max = chartData.allAvg*2;
    //         axis.strictMinMax = true;
    //         axis.renderer.grid.template.stroke = new am4core.InterfaceColorSet().getFor("background");
    //         axis.renderer.grid.template.strokeOpacity = 0.3;
    //         axis.renderer.labels.template.fontSize = 8;
    
    //         var customTicks = [];
    //         customTicks.push(0, chartData.allAvg, chartData.allAvg*2)
    //         axis.renderer.ticks.template.disabled = true;
    //         axis.renderer.minGridDistance = 20;
    //         axis.renderer.labels.template.fontSize = 12; // Set the font size
    //         axis.renderer.labels.template.adapter.add("text", (text, target) => {
    //             if (customTicks.indexOf(target.dataItem.value) !== -1) {
    //                 return text;
    //             }
    //             return "";
    //         });
            
    //         var label = axis.renderer.labels.template;
    //         label.fontSize = 8;
    
    //         var range0 = axis.axisRanges.create();
    //         range0.value = 0;
    //         range0.endValue = chartData.allAvg;
    //         range0.axisFill.fillOpacity = 1;
    //         range0.axisFill.fill = am4core.color("red");
    //         range0.axisFill.zIndex = - 1;
    
    //         var range1 = axis.axisRanges.create();
    //         range1.value = chartData.allAvg;
    //         range1.endValue = chartData.allAvg*2;
    //         range1.axisFill.fillOpacity = 1;
    //         range1.axisFill.fill = am4core.color("green");
    //         range1.axisFill.zIndex = -1;
    
    //         var hand = chart.hands.push(new am4charts.ClockHand());
    //         hand.showValue(chartData.typeAvg);
    
    //         var title = chart.titles.create();
    //         title.text = chartData.titleText;
    //         title.fontSize = 14;
    //         title.marginBottom = 18;
    //         title.align = "center"; // Align title to the center
    
    //         var citation = chart.chartContainer.createChild(am4core.Label);
    //         citation.text = selectedSource;
    //         citation.align = "right";
    //         citation.fontSize = 8;
    //     });
    // }

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
