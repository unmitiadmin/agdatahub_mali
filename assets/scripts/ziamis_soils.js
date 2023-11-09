$(document).ready(function () {
    let map = null;
    let mapContainerId = "soils-map";
    let mapServerHost = "http://34.204.66.237:8080";
    let streetLayerTilesUrl = `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`;
    let mapFile = "zambia.topojson";
    let soilsOptionsIndexFile = "layer_index.csv";
    let soilsOptionsIndex = [];    
    let tabFilter = $("input[type='radio'][name='soil-choice-type']");
    let tabFilterL1 = $("input[type='radio'][name='soil-choice-type'][value='1']");
    let tabFilterL2 = $("input[type='radio'][name='soil-choice-type'][value='2']");
    let optionTabL1 = $("div#soils-level1-options");    
    let emptyOption = `<option value="">---------</option>\n`;
    let optionTabL2 = $("div#soils-level2-options");
    let filterClassL2 = $("select#soil-class-options");
    let optionListL2 = $("div#soil-type-options");
    let soilClassOptions = [];
    let soilOptions = [];

    
    if(map != undefined || map != null){
        map.remove();
        map.off();
    }
    mapContainerElement = L.DomUtil.get(mapContainerId);
    if(mapContainerElement != null) mapContainerElement._leaflet_id = null;
    map = L.map(mapContainerId, {fullscreenControl: true}).setView([-15.416667, 28.283333], 6);
    streetLayer = L.tileLayer(streetLayerTilesUrl, {maxZoom: 15, opacity: 1/3});
    streetLayer.addTo(map);
    // map.invalidateSize();
    // refreshMap();
    loadInitialData();
    
    function loadInitialData(){
        Promise.all([
            loadMapFile(),
            loadCSVData(soilsOptionsIndexFile)
        ])
        .then(([mapResponse, optionsResponse]) => {
            let topoData = JSON.parse(mapResponse);
            geoData = topojson.feature(topoData, topoData.objects.collection);
            drawMap();
            soilsOptionsIndex = csvToArray(optionsResponse);
            fillSoilsOptions(soilsOptionsIndex);
        })
        // .then(() => enableLocationFilter())
        .then(() => enableSoilTabOptions())
        .then(() => tabFilterL1.prop("checked", true).trigger("change"))
        .then(() => enableSoilClassOptions())
        .catch(err => {
            console.log(err)
            alert("Check console for error");
        })
        .finally(() => stopWaiting())
    }

    function fillSoilsOptions(soilsOptionsIndex){
        soilClassOptions = soilsOptionsIndex.filter(a => a.status && a.level == 1);
        soilOptions = soilsOptionsIndex.filter(a => a.status && a.level == 2);
        
        let level1Options = soilClassOptions.map(a => {
            let acronym = a.acronym ? ` (${a.acronym})` : "";
            return `<div class="form-check">
                <input class="form-check-input" type="checkbox" data-level="1" data-workspace="${a.workspace}" data-layer="${a.layer}">
                <label class="form-check-label text-brighter">${a.layer_label}${acronym}</label>
            </div>`;
        }).join("\n");
        let level1All = `<div class="form-check">
            <input class="form-check-input" type="checkbox" data-level="0" checked />
            <label class="form-check-label text-brighter">ALL CLASSES</label>
        </div>`;
        optionTabL1.empty().html(level1All + `<div style="height: 57vh; overflow-y: scroll;">` + level1Options + `</div>`);

        let level2ClassOptions = soilClassOptions.map(a => {
            return `<option value="${a.id}">${a.layer_label}</option>`;
        }).join("\n");
        filterClassL2.empty().html(level2ClassOptions);
    }

    function enableSoilClassOptions(){
        $("input.form-check-input[type='checkbox'][data-level='0']").unbind("change").on("change", e => {
            let checked = $(e.currentTarget).prop("checked");
            $("input.form-check-input[type='checkbox'][data-level='1']").prop("checked", checked).trigger("change");
        });
        
        $("input.form-check-input[type='checkbox'][data-level='1']").unbind("change").on("change", e => {
            let workspace = $(e.currentTarget).data("workspace");
            let layer = $(e.currentTarget).data("layer");
            let checked = $(e.currentTarget).prop("checked");

            if(checked){
                setTimeout(() => {
                    let [wmsLayer, baseWMSLegendUrl] = createLayerAndLegend(workspace, layer);
                    wmsLayer.addTo(map);
                    let wmsLegend = L.wmsLegend(baseWMSLegendUrl, map);
                    $(e.currentTarget).data("wmsLayer", wmsLayer);
                    $(e.currentTarget).data("wmsLegend", wmsLegend);
                }, 0)
                
            } else{
                let wmsLayer = $(e.currentTarget).data("wmsLayer");
                let wmsLegend = $(e.currentTarget).data("wmsLegend");
                if(wmsLayer) map.removeLayer(wmsLayer);
                if(wmsLegend) map.removeControl(wmsLegend);
            }

            let allSiblingsChecked = $("input.form-check-input[type='checkbox'][data-level='1']").get().every(option => $(option).prop("checked"));
            $("input.form-check-input[type='checkbox'][data-level='0']").prop("checked", allSiblingsChecked);
        });

        filterClassL2.on("change", e => {
            setTimeout(() => {
                map.eachLayer(layer => {if(layer instanceof L.TileLayer.WMS) map.removeLayer(layer);});
                let wmsLegends = document.querySelectorAll('.wms-legend');
                if(wmsLegends.length){
                    for (let i = 0; i < wmsLegends.length; i++) {
                        let control = wmsLegends[i];
                        map.removeControl(control);
                    }
                }
            }, 10);
            setTimeout(() => {
                let classId = $(e.currentTarget).val();
                
                if(classId && !isNaN(classId)){
                    let className = soilClassOptions.find(a => a.id == classId).workspace;
                    let soilTypes = soilOptions.filter(a => a.workspace == className);
                    let level2Options = soilTypes.map(a => {
                        let acronym = a.acronym ? ` (${a.acronym})` : "";
                        return `<div class="form-check">
                            <input class="form-check-input" type="checkbox" data-level="2" data-workspace="${a.workspace}" data-layer="${a.layer}">
                            <label class="form-check-label text-brighter">${a.layer_label}${acronym}</label>
                        </div>`;
                    }).join("\n");
                    optionListL2.empty().html(level2Options);
                    enableSoilTypeOptions();
                } else{
                    optionListL2.empty().html(`Please choose a class to view the underlying types`);
                }
            }, 250)
        })

    }
    
    function enableSoilTypeOptions(){
        $("input.form-check-input[type='checkbox'][data-level='2']").on("change", e => {
            let workspace = $(e.currentTarget).data("workspace");
            let layer = $(e.currentTarget).data("layer");
            let checked = $(e.currentTarget).prop("checked");
            if(checked){
                setTimeout(() => {
                    let [wmsLayer, baseWMSLegendUrl] = createLayerAndLegend(workspace, layer);
                    wmsLayer.addTo(map);
                    let wmsLegend = L.wmsLegend(baseWMSLegendUrl, map);
                    $(e.currentTarget).data("wmsLayer", wmsLayer);
                    $(e.currentTarget).data("wmsLegend", wmsLegend);
                }, 0)
                
            } else{
                let wmsLayer = $(e.currentTarget).data("wmsLayer");
                let wmsLegend = $(e.currentTarget).data("wmsLegend");
                if(wmsLayer) map.removeLayer(wmsLayer);
                if(wmsLegend) map.removeControl(wmsLegend);
            }
        });
        
        setTimeout(() => $("input.form-check-input[type='checkbox'][data-level='2']").prop("checked", true).trigger("change"), 10);
    }

    function enableSoilTabOptions(){
        tabFilter.on("change", e => {
            let optionsTabId = $(e.currentTarget).data("tab-id");
            let optionsTab = $(`div#${optionsTabId}`);
            optionsTab.siblings().hide();
            optionsTab.show();
            setTimeout(() => $("input.form-check-input[type='checkbox'][data-level='2']").prop("checked", false).trigger("change"), 1);
            if(optionsTabId == "soils-level2-options"){
                setTimeout(() =>  $("input.form-check-input[type='checkbox'][data-level='0']").prop("checked", false).trigger("change"), 10);
                filterClassL2.trigger("change");
            } else if (optionsTabId == "soils-level1-options"){
                setTimeout(() => $("input.form-check-input[type='checkbox'][data-level='0']").prop("checked", true).trigger("change"), 10);
            }
        });
    }

    function createLayerAndLegend(workspace, layer){
        let mapServerBaseUrl = `${mapServerHost}/geoserver/${workspace}`;
        let baseWMSUrl = `${mapServerBaseUrl}/wms`;
        let baseWMSLegendUrl = `${mapServerBaseUrl}/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${workspace}:${layer}`;
        let wmsLayer = L.tileLayer.betterWms(baseWMSUrl, {
            layers: `${layer}`,
            transparent: true,
            format: 'image/png',
            opacity: 2/3
        });        
        return [wmsLayer, baseWMSLegendUrl];
    }

    function refreshMap(){
        setTimeout(() => {
            map.invalidateSize();
        }, 500);
    }

    function drawMap(){
        reloadSvgHolder();
        let tooltip;
        let bounds = L.geoJson(geoData, {}).getBounds();
        let polygons = L.d3SvgOverlay((selection, projection) => {
            let pScale = projection.scale;
            let locationGroup = selection.selectAll("path").data(geoData.features);
            
            locationGroup.enter()
                .append("path")
                .attr("d", d => projection.pathFromGeojson(d))
                .attr("id", d => `soils_${d.properties.province_id}`)
                .attr("style", "z-index:2000;pointer-events:visiblePainted !important")
                .attr("fill", "transparent")
                .attr("stroke", "black")
                .attr("stroke-width", "0.5px")
                .on("mouseenter", (e, d) => {
                    d3.select(`path#soils_${d.properties.province_id}`).attr("cursor", "pointer");
                    let tooltipContent = `${d.properties.province}`
                    tooltip = projection.layer.bindTooltip(tooltipContent).openTooltip(
                        L.latLng(projection.layerPointToLatLng(projection.pathFromGeojson.centroid(d)))
                    );
                })
                .on("mouseleave", (e, d) => tooltip.closeTooltip())
            
            locationGroup.transition().duration(10).attr("stroke-width", `${0.5/pScale}px`);

        }, {id: `province`});
        polygons.addTo(map);
        map.fitBounds(bounds).setView([-15.416667, 28.283333], 6);
        // map.invalidateSize();
    }

    function reloadSvgHolder(){
        map.eachLayer((l) => {
            if(l.options.id && l.options.id.indexOf("province") === 0) map.removeLayer(l);
        });
    }

    function loadMapFile(){
        return new Promise((resolve, reject) => {
            $.ajax({
                "type": "GET",
                "url": `./assets/maps/${mapFile}`,
                "success": response => {
                    resolve(response);
                    // map.invalidateSize();
                },
                "error": err => reject(err)
            })
        });
    }

    function loadCSVData(fileName){
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "GET",
                url: `./assets/datasets/soils/${fileName}`,
                beforeSend: () => startWaiting(),
                success: response => {
                  resolve(response);
                //   map.invalidateSize();
                },
                error: err => reject(err)
              });              
        });        
    }

    function csvToArray(csvText){
        let wb = XLSX.read(csvText, {type:"binary"});
        let rows = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1, {header:1, raw:false});
        let header = rows[0];
        let body = rows.slice(1,);
        let data = body.map(a => {
            let result = {};
            header.forEach((b, i) => result[b] = ["", undefined, null].includes(a[i]) ? null : (isNaN(a[i]) ? a[i].replace(/\"/g, "") : num(a[i])));
            return result;
        });
        return data;
    }

    const uqArray = (arr) => [...new Set(arr)];
    const sumArray = (arr) => arr.reduce((a, b) => a + b, 0);
    const num = (val) => !isNaN(val) ? parseFloat(val) : 0;

    function startWaiting(){
        let loadingIcon = `<div class="text-center"><div class="fa-3x mb-1"><i class="fa fa-spinner fa-pulse" aria-hidden="true"></i></div><span>Loading</span></div>`;
        $("#loading-modal-container").empty().html(loadingIcon);
        $('#loading-modal').modal('show');
    }

    function stopWaiting(){
        $("#loading-modal-container").empty();
        $("#loading-modal").modal("hide");
    }
    
    $("#soils-tab").on("click", function () {
        map.invalidateSize();
    });

})
