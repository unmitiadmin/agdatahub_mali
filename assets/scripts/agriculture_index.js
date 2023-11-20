class AgricultureIndex{
    constructor(){
        // page tabs
        this.faoTab = $("button#agriculture-fao-tab");
        this.oaTab = $("button#agriculture-oa-tab");
        // Filters, map for locations
        this.oaMap = null;
        this.oaMapContainerId = "oa-map";
        this.filterRegion = $("select#filter-region");
        this.filterCercle = $("select#filter-cercle");
        this.filterCommune = $("select#filter-commune");
        this.submitCommune = $("button#submit-commune");
        // data points
        this.crops = ["Bananas", "Maize (Corn)", "Millet", "Potatoes", "Rice/Paddy", "Sugarcane", "Sweet Potatoes"];
        this.years = [2022, 2021, 2020, 2019];
        this.indicators = [
            {"indicator": "Area", "units": "Ha"},
            {"indicator": "Production", "units": "Ton"},
            {"indicator": "Yield", "units": "Kg/Ha"},
        ];
        this.faoArea = [];
        this.faoYield = [];
        this.faoProduction = [];
        this.oaArea = [];
        this.oaYield = [];
        this.oaProduction = [];
        // filters
        this.filterFAOCrop = $("select#filter-fao-crop");
        this.filterFAOYear = $("select#filter-fao-year");
        this.filterFAOIndicator = $("select#filter-fao-indicator");
        this.submitFAO = $("button#submit-fao");
        this.chartFAOId = "chart-fao-data";
        this.filterOACrop = $("select#filter-oa-crop");
        this.mapFile = "mali.geojson";
        this.geoData = null;
    }

    init = () => {
        // Filter change events unbind
        this.filterRegion.unbind("change");
        this.filterCercle.empty().html(`<option>---</option>`).prop("disabled", true);
        this.filterCommune.empty().html(`<option>---</option>`).prop("disabled", true);
        this.submitCommune.unbind("click");
        this.readDataSets();
        // Leaflet map for OpenAfrica
        if (this.oaMap != undefined || this.oaMap != null) {this.oaMap.remove(); this.oaMap.off();}
        this.oaMapContainer = L.DomUtil.get(this.oaMapContainerId);
        if(this.oaMapContainer != null) this.oaMapContainer._leaflet_id = null;
        this.oaMap = L.map(this.oaMapContainerId, {fullscreenContol: false})
        this.streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", 
            {attribution: null, zoomSnap: 0.1, opacity: 3/4, transparency: 'true'});
        this.streetLayer.addTo(this.oaMap);
        this.oaMap.setView([17.5707, -3.9962], 5.25);
        this.oaTab.on("click", this.refreshOAMap);
        // Common filter values
        let yearHtml = this.years.map(a => `<option value="${a}">${a}</option>`).join("\n");
        let cropHtml = this.crops.map(a => `<option value="${a}">${a}</option>`).join("\n");
        let indicatorHtml = this.indicators.map(a => `<option value="${a.indicator}">${a.indicator}</option>`).join("\n");
        // fao filters
        this.filterFAOYear.empty().html(yearHtml);
        this.filterFAOCrop.empty().html(cropHtml);
        this.filterFAOIndicator.empty().html(indicatorHtml);
        this.filterFAOYear.on("change", e => this.chosenYear = $(e.currentTarget).val()).trigger("change");
        this.filterFAOIndicator.on("change", e => this.chosenIndicator = $(e.currentTarget).val()).trigger("change");
        // oa filters
        this.filterOACrop.empty().html(`<option value="All Crops">All Crops</option>\n` + cropHtml);
    }

    refreshOAMap = () => setTimeout(() => this.oaMap.invalidateSize(), 10);
    

    readDataSets = () => {
        Promise.all([
            this.loadExcelFile("agriculture_data.xlsx"),
            this.loadMapFile(this.mapFile)
        ])
        .then(([agricultureData, geoData]) => {
            [this.faoArea, this.faoYield, this.faoProduction, this.oaArea, this.oaYield, this.oaProduction]
                = this.excelToArray(agricultureData, "fao_area", "fao_yield", "fao_production", "openafrica_area", "openafrica_yield", "openafrica_production");
            this.geoData = geoData;
            this.plotRegions();
        })
        .then(() => {
            this.enableFAOApply();
            this.enableOAApply();
        })
        .then(() => {
            this.filterRegion.on("change", e => {
                this.regionId = $(e.currentTarget).val();
                if(this.regionId){
                    d3.select(`path#oa_region_${this.regionId}`).attr("fill-opacity", 0.9);
                    d3.selectAll(`path:not(#oa_region_${this.regionId})`).attr("fill-opacity", 0.5);
                } else d3.selectAll(`path.oa_region`).attr("fill-opacity", 0.5);
                this.filterOACrop.trigger("change");
            });
        })
        .then(() => this.filterRegion.trigger("change"))
        .catch(err => {
            console.error(err);
            alert("Unable to read the datasets under Agriculture")
        })
        .finally(stopWaiting)
    }

    enableFAOApply = () => {
        this.submitFAO.unbind("click").on("click", () => {
            let indicatorData = this.chosenIndicator == "Area" ? this.faoArea
                : this.chosenIndicator == "Production" ? this.faoProduction
                : this.faoYield;
            let yearData = indicatorData.filter(b => b.year == this.chosenYear);
            let regionData = this.regionId ? yearData.filter(b => b.region_id == this.regionId) : yearData;
            let chartData = this.crops.map(b => {
                let uqRegionsCount = this.uqArray(regionData.map(c => c.region_id)).length || 1;
                let value = this.chosenIndicator == "Yield" ? this.sumArray(regionData.map(c => c[b]))/uqRegionsCount : this.sumArray(regionData.map(c => c[b]));
                return {"name": b, "value": value}
            })
            let units = this.indicators.find(b => b.indicator == this.chosenIndicator).units;
            this.plotFAOIndicator(chartData, units, this.chosenIndicator, this.chosenYear);
        }).trigger("click");
    }

    plotFAOIndicator = (chartData, units, indicator, year) => {
        if(chartData.length){
            Highcharts.chart(this.chartFAOId, {
                chart: {type: "bar"},
                title: {text: null},
                subtitle: {text: null},
                credits: {enabled: true, text: "FAO"},
                xAxis: {
                    categories: chartData.map(a => a.name),
                    title: {text: units}
                },
                yAxis: {
                    title: {text: indicator}
                },
                series: [{
                    name: `${indicator} (${year})`,
                    data: chartData.map(a => a.value),
                    color: "#ffe59a"
                }]

            })
        } else{
            $(`div#${this.chartFAOId}`).empty().html(`<div class="my-5 text-center">Data unavailable</div>`);
        }
    }

    enableOAApply = () => {
        this.filterOACrop.unbind("change").on("change", e => {
            let chosenCrop = $(e.currentTarget).val();
            // Area
            let areaData = this.oaArea.map(b => {
                return {"region_id": b.region_id, "year": b.year, "value": b[chosenCrop]};
            });
            let areaUqYears = this.uqArray(areaData.map(b => b.year));
            let chartAreaData = this.regionId 
                ? areaData.filter(b => b.region_id == this.regionId)
                    .map(b => {return {"year": b.year, "value": b.value}})
                : areaUqYears.map(y => {
                    let yearTotal = this.sumArray(areaData.filter(b => b.year == y).map(b => b.value));
                    return {"year": y, "value": yearTotal}
                });
            this.plotOAIndicators(chartAreaData, "chart-oa-area", "Area", "Ha");
            // Production
            let productionData = this.oaProduction.map(b => {
                return {"region_id": b.region_id, "year": b.year, "value": b[chosenCrop]};
            });
            let productionUqYears = this.uqArray(productionData.map(b => b.year));
            let chartProductionData = this.regionId
                ? productionData.filter(b => b.region_id == this.regionId)
                    .map(b => {return {"year": b.year, "value": b.value}})
                : productionUqYears.map(y => {
                    let yearTotal = this.sumArray(productionData.filter(b => b.year == y).map(b => b.value));
                    return {"year": y, "value": yearTotal}
                });
            this.plotOAIndicators(chartProductionData, "chart-oa-production", "Production", "Ton");
            // Yield
            let yieldData = this.oaYield.map(b => {
                return {"region_id": b.region_id, "year": b.year, "value": b[chosenCrop]};
            });
            let yieldUqYears = this.uqArray(yieldData.map(b => b.year));
            let chartYieldData = this.regionId
                ? yieldData.filter(b => b.region_id == this.regionId)
                    .map(b => {return {"year": b.year, "value": b.value}})
                : yieldUqYears.map(y => {
                    let yearTotal = this.sumArray(yieldData.filter(b => b.year == y).map(b => b.value));
                    return {"year": y, "value": yearTotal}
                });
            this.plotOAIndicators(chartYieldData, "chart-oa-yield", "Yield", "Kg/Ha");
        }).trigger("change");
    }

    plotOAIndicators = (chartData, chartContainerId, indicator, units) => {
        if(chartData.length){
            Highcharts.chart(chartContainerId, {
                chart: {type: "line"},
                title: {text: null},
                subtitle: {text: null},
                credits: {enabled: true, text: "OpenAfrica"},
                legend: {enabled: false},
                xAxis: {
                    categories: chartData.map(a => a.year),
                    title: {text: "Year"}
                },
                yAxis: {
                    title: {text: `${indicator} (${units})`}
                },
                series: [{
                    name: `${indicator}`,
                    data: chartData.map(a => a.value),
                    color: "#ffe59a"
                }]
            })
        } else{
            $(`div#${chartContainerId}`).empty().html(`<div class="my-5 text-center">Data unavailable</div>`);
        }
    }

    plotRegions = () => {
        this.reloadSvgHolder();
        let tooltip;
        let polygons = L.d3SvgOverlay((selection, projection) => {
            let pScale = projection.scale;
            let locationGroup = selection.selectAll("path").data(this.geoData.features);
            locationGroup.enter()
                .append("path")
                .attr("d", d => projection.pathFromGeojson(d))
                .attr("id", d => `region_${d.properties.region_id}`)
                .attr("style", "z-index:2000;pointer-events:visiblePainted !important")
                .attr("fill", "#ffe59a")
                .attr("fill-opacity", 0.5)
                .attr("stroke", "black")
                .attr("stroke-width", "0.5px")
                .attr("class", "oa_region")
                .on("mouseenter", (e, d) => {
                    d3.select(`path#oa_region_${d.properties.region_id}`).attr("cursor", "pointer");
                    let tooltipContent = `${d.properties.region}`
                    tooltip = projection.layer.bindTooltip(tooltipContent).openTooltip(
                        L.latLng(projection.layerPointToLatLng(projection.pathFromGeojson.centroid(d)))
                    );
                })
                .on("mouseleave", (e, d) => tooltip.closeTooltip())
                .on("click", (e, d) => {
                    this.filterRegion.val(`${d.properties.region_id}`).trigger("change")
                    d3.select(`path#oa_region_${d.properties.region_id}`).attr("fill-opacity", 0.9);
                    d3.selectAll(`path:not(#oa_region_${d.properties.region_id})`).attr("fill-opacity", 0.5);
                })
            locationGroup.transition().duration(10).attr("stroke-width", `${0.5/pScale}px`);
        }, {id: `oa_regions`});
        polygons.addTo(this.oaMap);
        this.oaMap.setView([17.5707, -3.9962], 5.25);
    }

    reloadSvgHolder = () => {
        this.oaMap.eachLayer((l) => {
            if(l.options.id && l.options.id.indexOf("regions") === 0) this.oaMap.removeLayer(l);
        });
    }

    loadExcelFile = (fileName) => new Promise((resolve, reject) => {
        startWaiting();
        fetch(`./assets/datasets/${fileName}`).then(res => res.blob()).then(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const bstr= e.target.result;
                resolve(bstr)
            }
            reader.readAsBinaryString(file);
        }).catch(err => reject(err))
    });

    excelToArray = (file, ...sheets) => {
        let wb = XLSX.read(file, {type: 'binary'});
        return sheets.map(sheet => {
            let rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, raw: false });
            let header = rows[0];
            let body = rows.slice(1,);
            let data = body.map(a => {
                let result = {};
                header.forEach((b, i) => result[b] = ["NULL", undefined, null].includes(a[i]) ? null : (isNaN(a[i]) ? a[i].replace(/\"/g, "") : this.num(a[i])));
                return result;
            });
            return data;
        })
    }

    loadMapFile = () => {
        return new Promise((resolve, reject) => {
            $.ajax({
                "type": "GET",
                "url": `./assets/maps/${this.mapFile}`,
                "success": response => typeof(response) == "string" ? resolve(JSON.parse(response)) : resolve(response),
                "error": err => reject(err)
            })
        });
    }

    uqArray = (arr) => [...new Set(arr)];
    sumArray = (arr) => arr.reduce((a, b) => a + b, 0);
    num = (val) => !isNaN(val) ? parseFloat(val) : 0;
}