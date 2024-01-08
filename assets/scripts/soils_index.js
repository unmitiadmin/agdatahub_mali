class SoilsIndex{
    constructor(){
        this.map = null;
        this.mapContainerId = "map-soils";
        this.mapServerHost = "http://34.204.66.237:8080";
        this.streetLayerTilesUrl = `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`;
        this.mapFile = "mali.geojson";
        this.soilsOptionsIndexFile = "soils_layers.csv";
        this.soilsOptionsIndex = [];
        this.soilPointsIndexFile = "soil_points_layers.csv";
        this.soilPointsOptionsIndex = [];
        
        // Main filters
        this.filterRegion = $("select#filter-region");
        this.filterCercle = $("select#filter-cercle");
        this.filterCommune = $("select#filter-commune");
        this.submitCommune = $("button#submit-commune");
        this.mapFile = "mali.geojson";
        this.layerIndexFile = "fao_sat_layers.csv";
        this.layerIndex = [];
        this.optionTabL1 = $("div#soils-level1-options");
        this.mapLegend = $("div#map-soils-legend");
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
            this.loadCSVData(this.soilPointsIndexFile),
            this.loadCSVData(this.soilsOptionsIndexFile)
        ])
        .then(([mapResponse, pointsResponse, optionsResponse]) => {
            this.geoData = mapResponse;
            this.plotRegions();
            this.soilPointsOptionsIndex = this.csvToArray(pointsResponse);
            this.soilsOptionsIndex = this.csvToArray(optionsResponse);
            this.fillSoilsOptions(); // both classes and points
        })
        .then(() => this.enableLocationFilter())
        .then(() => this.enableSoilOptions())
        .then(() => $("input.form-check-input[type='checkbox'][data-level='0']").trigger("change"))
        .catch(err => {
            console.log(err)
            alert("Check console for error");
        })
        .finally(stopWaiting)
    }

    fillSoilsOptions = () => {
        // Classes options - checkbox
        let level1Options = this.soilsOptionsIndex.filter(a => a.status && a.level == 1).map(a => {
            let acronym = a.acronym ? ` (${a.acronym})` : "";
            return `<div class="form-check ms-3">
                <input class="form-check-input" type="checkbox" data-level="1" data-workspace="${a.workspace}" data-layer="${a.layer}">
                <label class="form-check-label text-brighter">${a.layer_label}${acronym}</label>
            </div>`;
        }).join("\n");
        let level1All = `<div class="form-check">
            <input class="form-check-input" type="checkbox" data-level="0" checked />
            <label class="form-check-label text-brighter">ALL CLASSES</label>
        </div>`;
        // Classes options - radio button (guised as checkbox)
        let level2Options = this.soilPointsOptionsIndex.filter(a => a.status).map(a => {
            return `<div class="form-check ms-3">
                <input class="form-check-input" type="checkbox" data-level="2" data-workspace="${a.workspace}" data-layer="${a.layer}" data-layer-id="${a.id}">
                <label class="form-check-label text-brighter">${a.layer_label}</label>
            </div>`;
        }).join("\n");
        let level2All = `<div>
            <label class="form-check-label text-brighter">SOIL PARAMETERS</label>
        </div>`;
        // Fill the div
        this.optionTabL1.empty().html(level1All + level1Options + level2All + level2Options);
    }

    enableSoilOptions = () => {
        // 1. All classes
        $("input.form-check-input[type='checkbox'][data-level='0']").unbind("change").on("change", e => {
            let checked = $(e.currentTarget).prop("checked");
            $("input.form-check-input[type='checkbox'][data-level='1']").prop("checked", checked).trigger("change");
        });
        // 2. Individual Classes
        $("input.form-check-input[type='checkbox'][data-level='1']").unbind("change").on("change", e => {
            let workspace = $(e.currentTarget).data("workspace");
            let layer = $(e.currentTarget).data("layer");
            let checked = $(e.currentTarget).prop("checked");
            let wmsLayer = $(e.currentTarget).data("wmsLayer");
            // Remove the layer if it exists
            if (wmsLayer) {
                wmsLayer.off('layerremove'); // Remove the previous event handler
                this.map.removeLayer(wmsLayer);
            }
            let checkedOptions = $("input.form-check-input[type='checkbox'][data-level='1']:checked").map((index, element) => $(element).data()).get();
            let checkedOptionsLegendHtml = checkedOptions.length
                ? checkedOptions.map(a => {
                    let baseWMSLegendUrl = `${this.mapServerHost}/geoserver/${a.workspace}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${a.workspace}:${a.layer}`;
                    return `<div class="leaflet-control-wms-legend leaflet-control"><img class="wms-legend" src="${baseWMSLegendUrl}"/></div>`;
                }).join("\n")
                : "";
            this.mapLegend.empty().html(checkedOptionsLegendHtml);
            if (checked) {
                setTimeout(() => {
                    $("input.form-check-input[type='checkbox'][data-level='2']").prop("checked", false).trigger("change");
                    let newWmsLayer = this.fetchRasterLayer(workspace, layer);
                    newWmsLayer.addTo(this.map);
                    $(e.currentTarget).data("wmsLayer", newWmsLayer);
                }, 0);
            }
            let allSiblingsChecked = $("input.form-check-input[type='checkbox'][data-level='1']").get().every(option => $(option).prop("checked"));
            $("input.form-check-input[type='checkbox'][data-level='0']").prop("checked", allSiblingsChecked);
        });

        // 3. Individual points
        $("input.form-check-input[type='checkbox'][data-level='2']").unbind("change").on("change", e => {
            let workspace = $(e.currentTarget).data("workspace");
            let layer = $(e.currentTarget).data("layer");
            let layerId = $(e.currentTarget).data("layer-id");
            let checked = $(e.currentTarget).prop("checked");
            if(checked){
                $(`input.form-check-input[type='checkbox'][data-level='2']:not([data-layer-id='${layerId}'])`).prop("checked", false).trigger("change");
                $("input.form-check-input[type='checkbox'][data-level='1']").prop("checked", false).trigger("change");
                let wmsLayer = this.fetchRasterLayer(workspace, layer);
                wmsLayer.addTo(this.map);
                $(e.currentTarget).data("wmsLayer", wmsLayer);
                let baseWMSLegendUrl = `${this.mapServerHost}/geoserver/${workspace}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${workspace}:${layer}`;
                this.mapLegend.empty().html(`<div class="leaflet-control-wms-legend leaflet-control"><img class="wms-legend" src="${baseWMSLegendUrl}"/></div>`);
            } else{
                let wmsLayer = $(e.currentTarget).data("wmsLayer");
                if(wmsLayer) this.map.removeLayer(wmsLayer);
            }
        });
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

    fetchRasterLayer = (workspace, layer) => {
        let mapServerBaseUrl = `${this.mapServerHost}/geoserver/${workspace}`;
        let baseWMSUrl = `${mapServerBaseUrl}/wms`;
        let wmsLayer = L.tileLayer.betterWms(baseWMSUrl, {
            layers: `${layer}`,
            transparent: true,
            format: 'image/png',
            opacity: 2/3
        });
        return wmsLayer;
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
                .attr("id", d => `soils_region_${d.properties.region_id}`)
                .attr("style", "z-index:2000;pointer-events:visiblePainted !important")
                .attr("fill", "transparent")
                .attr("stroke", "black")
                .attr("stroke-width", "0.5px")
                .attr("class", "soils_region")
                .on("mouseenter", (e, d) => {
                    d3.select(`path#soils_region_${d.properties.region_id}`).attr("cursor", "pointer");
                    let tooltipContent = `${d.properties.region}`
                    tooltip = projection.layer.bindTooltip(tooltipContent).openTooltip(
                        L.latLng(projection.layerPointToLatLng(projection.pathFromGeojson.centroid(d)))
                    );
                })
                .on("mouseleave", (e, d) => tooltip.closeTooltip())

            locationGroup.transition().duration(10).attr("stroke-width", `${0.5/pScale}px`);
        }, {id: `soils_regions`});
        polygons.addTo(this.map);
        this.map.setView([17.5707, -3.9962], 5.25);
    }

    reloadSvgHolder = () => {
        this.map.eachLayer((l) => {
            if(l.options.id && l.options.id.indexOf("soils_regions") === 0) this.map.removeLayer(l);
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

    num = (val) => !isNaN(val) ? parseFloat(val) : 0;
}