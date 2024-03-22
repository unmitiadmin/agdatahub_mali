class FaoSatImg{
    constructor(){
        // Map
        this.map = null;
        this.mapContainerId = "map-fao-sat";
        this.mapLegend = $("div#map-fao-sat-legend");
        this.mapServerHost = "https://io.apps.fao.org/geoserver";
        this.streetLayerTilesUrl = `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`;
        // Main filters
        this.filterRegion = $("select#filter-region");
        this.filterCercle = $("select#filter-cercle");
        this.filterCommune = $("select#filter-commune");
        this.submitCommune = $("button#submit-commune");
        this.mapFile = "mali.geojson";
        this.layerIndexFile = "fao_sat_layers.csv";
        this.layerIndex = [];

        this.filterLayer = $("div#options-fao-sat");
        this.emptyOption = `<option value="">---------</option>\n`;
        this.startYear = 1984;
        this.currentYear = (new Date()).getFullYear()
        this.years =  Array.from({length: this.currentYear - this.startYear + 1}, (_, index) => this.startYear + index);
        this.filterYear = $("select#filter-fao-sat-year");
        this.filterDekad = $("select#filter-fao-sat-dekad");
        this.chosenYearDekad = "";
        this.dekadIndex = [
            {"dekad":1,"label":"January 1 to 10","month":1,"start_day":1,"end_day":10},
            {"dekad":2,"label":"January 11 to 20","month":1,"start_day":11,"end_day":20},
            {"dekad":3,"label":"January 21 to 31","month":1,"start_day":21,"end_day":31},
            {"dekad":4,"label":"February 1 to 10","month":2,"start_day":1,"end_day":10},
            {"dekad":5,"label":"February 11 to 20","month":2,"start_day":11,"end_day":20},
            {"dekad":6,"label":"February 21 to 28","month":2,"start_day":21,"end_day":28},
            {"dekad":6,"label":"February 21 to 29","month":2,"start_day":21,"end_day":29},
            {"dekad":7,"label":"March 1 to 10","month":3,"start_day":1,"end_day":10},
            {"dekad":8,"label":"March 11 to 20","month":3,"start_day":11,"end_day":20},
            {"dekad":9,"label":"March 21 to 31","month":3,"start_day":21,"end_day":31},
            {"dekad":10,"label":"April 1 to 10","month":4,"start_day":1,"end_day":10},
            {"dekad":11,"label":"April 11 to 20","month":4,"start_day":11,"end_day":20},
            {"dekad":12,"label":"April 21 to 30","month":4,"start_day":21,"end_day":30},
            {"dekad":13,"label":"May 1 to 10","month":5,"start_day":1,"end_day":10},
            {"dekad":14,"label":"May 11 to 20","month":5,"start_day":11,"end_day":20},
            {"dekad":15,"label":"May 21 to 31","month":5,"start_day":21,"end_day":31},
            {"dekad":16,"label":"June 1 to 10","month":6,"start_day":1,"end_day":10},
            {"dekad":17,"label":"June 11 to 20","month":6,"start_day":11,"end_day":20},
            {"dekad":18,"label":"June 21 to 30","month":6,"start_day":21,"end_day":30},
            {"dekad":19,"label":"July 1 to 10","month":7,"start_day":1,"end_day":10},
            {"dekad":20,"label":"July 11 to 20","month":7,"start_day":11,"end_day":20},
            {"dekad":21,"label":"July 21 to 31","month":7,"start_day":21,"end_day":31},
            {"dekad":22,"label":"August 1 to 10","month":8,"start_day":1,"end_day":10},
            {"dekad":23,"label":"August 11 to 20","month":8,"start_day":11,"end_day":20},
            {"dekad":24,"label":"August 21 to 31","month":8,"start_day":21,"end_day":31},
            {"dekad":25,"label":"September 1 to 10","month":9,"start_day":1,"end_day":10},
            {"dekad":26,"label":"September 11 to 20","month":9,"start_day":11,"end_day":20},
            {"dekad":27,"label":"September 21 to 30","month":9,"start_day":21,"end_day":30},
            {"dekad":28,"label":"October 1 to 10","month":10,"start_day":1,"end_day":10},
            {"dekad":29,"label":"October 11 to 20","month":10,"start_day":11,"end_day":20},
            {"dekad":30,"label":"October 21 to 31","month":10,"start_day":21,"end_day":31},
            {"dekad":31,"label":"November 1 to 10","month":11,"start_day":1,"end_day":10},
            {"dekad":32,"label":"November 11 to 20","month":11,"start_day":11,"end_day":20},
            {"dekad":33,"label":"November 21 to 30","month":11,"start_day":21,"end_day":30},
            {"dekad":34,"label":"December 1 to 10","month":12,"start_day":1,"end_day":10},
            {"dekad":35,"label":"December 11 to 20","month":12,"start_day":11,"end_day":20},
            {"dekad":36,"label":"December 21 to 31","month":12,"start_day":21,"end_day":31}
        ];
    }

    init = () => {
        // Filter change events unbind
        this.filterRegion.unbind("change");
        this.filterCercle.empty().html(`<option>---</option>`).prop("disabled", true);
        this.filterCommune.empty().html(`<option>---</option>`).prop("disabled", true);
        this.submitCommune.unbind("click");
        // Leaflet container
        if(this.map != undefined || this.map != null){
            this.map.remove();
            this.map.off();
        }
        this.mapContainerElement = L.DomUtil.get(this.mapContainerId);
        if(this.mapContainerElement != null) this.mapContainerElement._leaflet_id = null;
        this.map = L.map(this.mapContainerId, {fullscreenControl: true}).setView([17.5707, -3.9962], 5);
        this.streetLayer = L.tileLayer(this.streetLayerTilesUrl, {maxZoom: 15, opacity: 1/3});
        this.streetLayer.addTo(this.map);
        this.loadInitialData();
    }

    loadInitialData = () => {
        Promise.all([
            this.loadMapFile(),
            this.loadCSVData(this.layerIndexFile)
        ])
        .then(([mapResponse, optionsResponse]) => {
            this.fillTemporalOptions();
            this.geoData = mapResponse;
            this.plotRegions();
            this.layerIndex = this.csvToArray(optionsResponse);
            this.fillLayerOptions(this.layerIndex);
        })
        .then(() => this.enableLocationFilter())
        .then(() => this.enableLayerOptions())
        .then(() => this.enableTemporalOptions())
        .catch(err => {
            console.log(err)
            alert("Check console for error");
        })
        .finally(stopWaiting)
    }

    fillTemporalOptions = () => {
        let yearOptions = this.years.map(a => `<option value="${a}">${a}</option>`).join("\n");
        this.filterYear.empty().html(yearOptions).unbind("change");
    }

    enableTemporalOptions = () => {
        this.filterYear.on("change", () => {
            this.chosenYearDekad = `${this.filterYear.val()}-${this.filterDekad.val()}`
            $("input[type='radio'][name='option-fao-img']:checked").trigger("change");
            let selectedYear = parseInt(this.filterYear.val());
            let dekadIndex = selectedYear % 4
                ? this.dekadIndex.filter(a => a.label != "February 21 to 29")
                : this.dekadIndex.filter(a => a.label != "February 21 to 28");
            let dekadsToShow = dekadIndex.filter((item) => {
                let { start_day, end_day, month } = item;
                let dekadStart = moment(`${selectedYear}-${month}-${start_day}`, "YYYY-MM-DD");
                let dekadEnd = moment(`${selectedYear}-${month}-${end_day}`, "YYYY-MM-DD").endOf("day");
                // add february condition here
                let lastDayOfPreviousMonth = moment().subtract(1, "months").endOf("month");
                return dekadStart.isSameOrBefore(lastDayOfPreviousMonth) && dekadEnd.isSameOrBefore(lastDayOfPreviousMonth);
            });
            let dekadOptions = dekadsToShow.map((a) => `<option value="${this.zfill(a.dekad, 2)}">${a.label}</option>`).join("\n");
            this.filterDekad.empty().html(dekadOptions).unbind("change");
            this.filterDekad.on("change", () => {
                this.chosenYearDekad = `${this.filterYear.val()}-${this.filterDekad.val()}`;
                $("input[type='radio'][name='option-fao-img']:checked").trigger("change");
            });
        });
        this.filterYear.val(`${this.currentYear}`).trigger("change");
    }

    fillLayerOptions = (layerIndex) => {
        // let categories = this.uqArray(layerIndex.map(a => a.category));
        let optionsHtml = layerIndex.map(a => {
            return `<div class="form-check">
                <input class="form-check-input" type="radio" name="option-fao-img" data-workspace="${a.workspace}" data-layer="${a.layer}" data-path="${a.path}">
                <label class="form-check-label font-data-label ps-1">${a.layer_label}</label>
            </div>`;
        }).join("\n");
        this.filterLayer.empty().html(optionsHtml);
    }

    enableLayerOptions = () => {
        $("input[type='radio'][name='option-fao-img']").unbind("change").on("change", e => {
            setTimeout(() => {
                this.map.eachLayer(layer => {if(layer instanceof L.TileLayer.WMS) this.map.removeLayer(layer);});
                let wmsLegends = document.querySelectorAll('.wms-legend');
                if(wmsLegends.length){
                    for (let i = 0; i < wmsLegends.length; i++) {
                        let control = wmsLegends[i];
                        this.map.removeControl(control);
                    }
                }
            }, 10)
            
            setTimeout(() => {
                let workspace = $(e.currentTarget).data("workspace");
                let layer = $(e.currentTarget).data("layer");
                let serverPath = $(e.currentTarget).data("path");
                let checked = $(e.currentTarget).prop("checked");

                if(checked){
                    setTimeout(() => {
                        let [wmsLayer, legendWMSUrl] = this.createLayerAndLegend(workspace, layer, serverPath);
                        wmsLayer.addTo(this.map);
                        // let wmsLegend = L.wmsLegend(legendWMSUrl, this.map);
                        this.mapLegend.empty().html(`<img src="${legendWMSUrl}" />`);
                        $(e.currentTarget).data("wmsLayer", wmsLayer);
                        $(e.currentTarget).data("wmsLegend", wmsLegend);
                    }, 0)
                    
                } else{
                    let wmsLayer = $(e.currentTarget).data("wmsLayer");
                    let wmsLegend = $(e.currentTarget).data("wmsLegend");
                    if(wmsLayer) this.map.removeLayer(wmsLayer);
                    if(wmsLegend) this.map.removeControl(wmsLegend);
                }
            }, 100);
        })
    }

    createLayerAndLegend = (workspace, layer, path) => {
        this.chosenYearDekad = `${this.filterYear.val()}-${this.filterDekad.val()}`;
        workspace = workspace.replace("<year-dekad>", this.chosenYearDekad);
        let layerWMSUrl = `${this.mapServerHost}/wms/${path}/v1?version=1.3.0&layers=${workspace}:${layer}`;
        let wmsLayer = L.tileLayer.betterWms(layerWMSUrl, {
            transparent: true,
            format: 'image/png',
            opacity: 2/5
        });
        let legendWMSUrl = `${this.mapServerHost}/wms/${path}/v1?/wms?service=WMS&version=1.3.0&request=GetLegendGraphic&layer=${workspace}:${layer}&style=${layer}&format=image/png`;
        return [wmsLayer, legendWMSUrl];
    }

    enableLocationFilter = () => {
        this.filterRegion.on("change", e => {
            let regionId = $(e.currentTarget).val();
            if(regionId){
                let countySegGeoData = {
                    "type": "Feature",
                    "features": this.geoData.features.filter(b => b.properties.region_id == regionId)
                }
                let bounds = L.geoJson(countySegGeoData, {}).getBounds();
                this.map.fitBounds(bounds)
            } else{
                let bounds = L.geoJson(this.geoData, {}).getBounds();
                this.map.fitBounds(bounds).setView([17.5707, -3.9962], 5);
            }
        });
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
                .attr("id", d => `faosat_region_${d.properties.region_id}`)
                .attr("style", "z-index:2000;pointer-events:visiblePainted !important")
                .attr("fill", "transparent")
                .attr("stroke", "black")
                .attr("stroke-width", "0.5px")
                .attr("class", "faosat_region")
                .on("mouseenter", (e, d) => {
                    d3.select(`path#faosat_region_${d.properties.region_id}`).attr("cursor", "pointer");
                    let tooltipContent = `${d.properties.region}`
                    tooltip = projection.layer.bindTooltip(tooltipContent).openTooltip(
                        L.latLng(projection.layerPointToLatLng(projection.pathFromGeojson.centroid(d)))
                    );
                })
                .on("mouseleave", (e, d) => tooltip.closeTooltip())

            locationGroup.transition().duration(10).attr("stroke-width", `${0.5/pScale}px`);
        }, {id: `faosat_regions`});
        polygons.addTo(this.map);
        this.map.setView([17.5707, -3.9962], 5.25);
    }

    reloadSvgHolder = () => {
        this.map.eachLayer((l) => {
            if(l.options.id && l.options.id.indexOf("faosat_regions") === 0) this.map.removeLayer(l);
        });
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

    loadCSVData = (fileName) => new Promise((resolve, reject) => {
        $.ajax({
            "type": "GET",
            "url": `./assets/datasets/${fileName}`,
            "beforeSend": () => startWaiting(),
            "success": response => resolve(response),
            "error": err => reject(err)
        });
    });

    csvToArray = (csvText) => {
        let wb = XLSX.read(csvText, {type:"binary"});
        let rows = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1, {header:1, raw:false});
        let header = rows[0];
        let body = rows.slice(1,);
        let data = body.map(a => {
            let result = {};
            header.forEach((b, i) => result[b] = ["", undefined, null].includes(a[i]) ? null : (isNaN(a[i]) ? a[i].replace(/\"/g, "") : this.num(a[i])));
            return result;
        });
        return data;
    }

    zfill = (str, width) => str.toString().padStart(width, '0');
}