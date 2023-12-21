class WeatherIndex{
    constructor(){
        // Filters for locations
        this.filterRegion = $("select#filter-region");
        this.filterCercle = $("select#filter-cercle");
        this.filterCommune = $("select#filter-commune");
        this.filterWaitRegion = $("i#filter-wait-region");
        this.filterWaitCercle = $("i#filter-wait-cercle");
        this.filterWaitCommune = $("i#filter-wait-commune");
        this.submitCommune = $("button#submit-commune");
        // Current selection
        this.regionId = null;
        this.cercleId = null;
        this.communeId = null;
        this.selectedRegion = null;
        this.selectedCercle = null;
        this.selectedCommune = null;
        // Location label
        this.locationLabel = $("span#weather-location-label");
        // Main section
        this.noticeSection = $("div#notice");
        this.noticeText = $("div#notice-text");
        this.mainSection = $("div#non-notice");
        // Root URL
        this.rootUrl = weatherApiUrl;
        // Common lookups
        this.months = null;
        this.weeks = null;
        this.crops = null;
    }

    init = () => {
        this.noticeText.empty().html(`<p>Please select a commune (above) to proceed.</p>`)
        this.noticeSection.show();
        this.mainSection.hide();
        this.loadCommonLookups();
    }

    loadCommonLookups = () => {
        startWaiting();
        Promise.all([this.get("months"), this.get("weeks"), this.get("crops")])
        .then(([months, weeks, crops]) => {
            if(months.status && weeks.status && crops.status){
                this.months = months.data;
                this.weeks = weeks.data;
                this.crops = crops.data;
            } else alert("Unable to load the common lookups, please check the service");
        })
        .then(this.retainLocationHierarchy)
        .then(this.submitCommuneId)
        .then(this.enableTabs)
        .catch(err => {
            alert("Unable to load the common lookups, please check the service");
            console.error(err);
        })
        .finally(stopWaiting);
    }

    retainLocationHierarchy = () => {
        let prevRegionId = this.locationLabel.attr("data-region-id");
        let prevCercleId = this.locationLabel.attr("data-cercle-id");
        let prevCommuneId = this.locationLabel.attr("data-commune-id");
        if(prevRegionId && prevCercleId && prevCommuneId){
            let retainedLocation = {
                "regionId": prevRegionId,
                "cercleId": prevCercleId,
                "communeId": prevCommuneId
            }
            this.loadRegions(retainedLocation);
            this.noticeSection.hide();
            this.mainSection.show();
        } else{
            this.loadRegions({})
        }
    }

    loadRegions = (retainedLocation) => {
        this.filterWaitRegion.show();
        this.filterRegion.prop("disabled", true);
        this.filterCercle.empty().html(`<option value="">SELECT A CERCLE</option>`).prop("disabled", true);
        this.filterCommune.empty().html(`<option value="">SELECT A COMMUNE</option>`).prop("disabled", true);
        this.get("regions")
        .then(response => {
            if(response.status){
                let regionsHtml = response.data.map(a => `<option value=${a.region_id}>${a.region}</option>`).join("\n");
                this.filterRegion.empty()
                    .html(`<option value="">SELECT A REGION</option>\n` + regionsHtml)
                    .on("change", e => {
                        this.filterCercle.empty().html(`<option value="">SELECT A CERCLE</option>`).prop("disabled", true);
                        this.filterCommune.empty().html(`<option value="">SELECT A COMMUNE</option>`).prop("disabled", true);
                        let selectedRegionId = $(e.currentTarget).val();
                        if(selectedRegionId){
                            this.loadCercles(selectedRegionId, retainedLocation);
                            this.regionId = selectedRegionId;
                        } else{    
                            alert("Please choose a region");
                            this.regionId = null;
                        };
                        this.cercleId = null;
                        this.communeId = null;
                    })
                    .prop("disabled", false);
            } else{
                this.filterWaitRegion.hide();
                this.filterRegion.empty().html(`<option value="">SELECT A REGION</option>`).prop("disabled", true);
                this.filterCercle.empty().html(`<option value="">SELECT A CERCLE</option>`).prop("disabled", true);
                this.filterCommune.empty().html(`<option value="">SELECT A COMMUNE</option>`).prop("disabled", true);
                this.regionId = null;
                this.communeId = null;
                this.cercleId = null;
                alert("Unable to load the regions, please check the service");
            }
        })
        .then(() => {
            if(retainedLocation.regionId){
                this.regionId = retainedLocation.regionId;
                this.filterRegion.val(retainedLocation.regionId).trigger("change");
            }
        })
        .catch(err => {
            this.filterCercle.empty().html(`<option value="">SELECT A CERCLE</option>`).prop("disabled", true);
            this.filterWaitRegion.hide();
            console.error(err);
            alert("Unable to load the regions, please check the service");
        })
        .finally(() => this.filterWaitRegion.hide());
    }


    loadCercles = (regionId, retainedLocation) => {
        this.filterWaitCercle.show();
        this.filterCercle.prop("disabled", true);
        this.filterCommune.empty().html(`<option value="">SELECT A COMMUNE</option>`).prop("disabled", true);
        this.get(`cercles?regionId=${regionId}`)
        .then(response => {
            if(response.status){
                let cerclesHtml = response.data.map(a => `<option value=${a.cercle_id}>${a.cercle}</option>`).join("\n");
                this.filterCercle.empty().unbind("change")
                    .html(`<option value="">SELECT A CERCLE</option>\n` + cerclesHtml)
                    .on("change", e => {
                        this.filterCommune.empty().html(`<option value="">SELECT A COMMUNE</option>`).prop("disabled", true);
                        let selectedCercleId = $(e.currentTarget).val();
                        if(selectedCercleId){
                            this.loadCommunes(regionId, selectedCercleId, retainedLocation);
                            this.cercleId = selectedCercleId;
                        } else{
                            this.cercleId = null;
                        }
                        this.communeId = null;
                    })
                    .prop("disabled", false);
            } else{
                this.filterWaitCercle.hide();
                this.filterCercle.empty().html(`<option value="">SELECT A CERCLE</option>`).prop("disabled", true);
                this.filterCommune.empty().html(`<option value="">SELECT A COMMUNE</option>`).prop("disabled", true);
                this.cercleId = null;
                this.communeId = null;
                alert("Unable to load the cercles for selected region, please check the service");
            }
        })
        .then(() => {
            if(retainedLocation.cercleId){
                this.cercleId = retainedLocation.cercleId;
                this.filterCercle.val(retainedLocation.cercleId).trigger("change");
            }
        })
        .catch(err => {
            this.filterWaitCercle.hide();
            alert("Unable to load the cercles for selected region, please check the service");
            console.error(err);
        })
        .finally(() => this.filterWaitCercle.hide());
    }


    loadCommunes = (regionId, cercleId, retainedLocation) => {
        this.filterWaitCommune.show();
        this.get(`communes?regionId=${regionId}&cercleId=${cercleId}`)
        .then(response => {
            if(response.status){
                let communesHtml = response.data.map(a => `<option value="${a.commune_id}">${a.commune}</option>`).join("\n");
                this.filterCommune.empty().unbind("change")
                    .on("change", e => {
                        let selectedCommuneId = $(e.currentTarget).val();
                        if(selectedCommuneId){
                            this.communeId = selectedCommuneId;
                        } else{
                            this.communeId = null;
                        }
                    })
                    .html("<option>SELECT A COMMUNE</option>\n" + communesHtml);
                this.filterCommune.prop("disabled", false);
            } else{
                this.communeId = null;
                this.filterWaitCommune.hide();
                this.filterCommune.empty().html(`<option value="">SELECT A COMMUNE</option>`).prop("disabled", true);
                alert("Unable to load the communes for selected cercle, please check the service");
            }
        })
        .then(() => {
            if(retainedLocation.communeId){
                this.filterCommune.val(retainedLocation.communeId).trigger("change");
            }
        })
        .catch(err => {
            this.filterWaitCommune.hide();
            alert("Unable to load the cercles for selected region, please check the service");
            console.error(err);
        })
        .finally(() => this.filterWaitCommune.hide());
    }

    
    submitCommuneId = () => {
        this.submitCommune.unbind("click").on("click", () => {
            this.communeId = this.filterCommune.val()
            if(this.communeId && !isNaN(this.communeId)){
                this.enableTabs();
                $("a.nav-link.weather-menu.active").trigger("click");
                this.noticeSection.hide();
                this.mainSection.show();
            } else{
                this.noticeSection.show();
                this.mainSection.hide();
            }
        })
    }

    enableTabs = () => {
        // Short Range Forecast
        $("a.nav-link.weather-menu[href='#fcollshort']").unbind("click").on("click", () => {
            this.selectedRegion = $("select#filter-region option:selected").text();
            this.selectedCercle = $("select#filter-cercle option:selected").text();
            this.selectedCommune = $("select#filter-commune option:selected").text();
            let locationDetails = {
                "region": this.selectedRegion,
                "cercle": this.selectedCercle,
                "commune": this.selectedCommune,
                "regionId": parseInt(this.regionId),
                "cercleId": parseInt(this.cercleId),
                "communeId": parseInt(this.communeId),
            };
            let commonLookupDetails = {"months": this.months, "weeks": this.weeks, "crops": this.crops};
            if(this.communeId){
                new ForecastCollectiveShort(this.communeId, locationDetails, commonLookupDetails).execute();
            } else alert("Please choose a commune to view weather data");

        });

        // Medium Range Forecast
        $("a.nav-link.weather-menu[href='#fcollmedium']").unbind("click").on("click", () => {
            this.selectedRegion = $("select#filter-region option:selected").text();
            this.selectedCercle = $("select#filter-cercle option:selected").text();
            this.selectedCommune = $("select#filter-commune option:selected").text();
            let locationDetails = {
                "region": this.selectedRegion,
                "cercle": this.selectedCercle,
                "commune": this.selectedCommune,
                "regionId": parseInt(this.regionId),
                "cercleId": parseInt(this.cercleId),
                "communeId": parseInt(this.communeId),
            };
            let commonLookupDetails = {"months": this.months, "weeks": this.weeks, "crops": this.crops};
            if(this.communeId){
                new ForecastCollectiveMedium(this.communeId, locationDetails, commonLookupDetails).execute();
            } else alert("Please choose a commune to view weather data");
        });

        // Seasonal forecast
        $("a.nav-link.weather-menu[href='#fcollseasonal']").unbind("click").on("click", () => {
            this.selectedRegion = $("select#filter-region option:selected").text();
            this.selectedCercle = $("select#filter-cercle option:selected").text();
            this.selectedCommune = $("select#filter-commune option:selected").text();
            let locationDetails = {
                "region": this.selectedRegion,
                "cercle": this.selectedCercle,
                "commune": this.selectedCommune,
                "regionId": parseInt(this.regionId),
                "cercleId": parseInt(this.cercleId),
                "communeId": parseInt(this.communeId),
            };
            let commonLookupDetails = {"months": this.months, "weeks": this.weeks, "crops": this.crops};
            if(this.communeId){
                new ForecastCollectiveSeasonal(this.communeId, locationDetails, commonLookupDetails).execute();
            } else alert("Please choose a commune to view weather data");
        });

        // Current Rainfall
        $("a.nav-link.weather-menu[href='#crf']").unbind("click").on("click", () => {
            this.selectedRegion = $("select#filter-region option:selected").text();
            this.selectedCercle = $("select#filter-cercle option:selected").text();
            this.selectedCommune = $("select#filter-commune option:selected").text();
            let locationDetails = {
                "region": this.selectedRegion,
                "cercle": this.selectedCercle,
                "commune": this.selectedCommune,
                "regionId": parseInt(this.regionId),
                "cercleId": parseInt(this.cercleId),
                "communeId": parseInt(this.communeId),
            };
            let commonLookupDetails = {"months": this.months, "weeks": this.weeks, "crops": this.crops};
            if(this.communeId){
                new CurrentRainfall(this.communeId, locationDetails, commonLookupDetails).execute();
            } else alert("Please choose a commune to view weather data");
        });
        
        // Historic Rainfall
        $("a.nav-link.weather-menu[href='#hrf']").unbind("click").on("click", () => {
            this.selectedRegion = $("select#filter-region option:selected").text();
            this.selectedCercle = $("select#filter-cercle option:selected").text();
            this.selectedCommune = $("select#filter-commune option:selected").text();
            let locationDetails = {
                "region": this.selectedRegion,
                "cercle": this.selectedCercle,
                "commune": this.selectedCommune,
                "regionId": parseInt(this.regionId),
                "cercleId": parseInt(this.cercleId),
                "communeId": parseInt(this.communeId),
            };
            let commonLookupDetails = {"months": this.months, "weeks": this.weeks, "crops": this.crops};
            if(this.communeId){
                new HistoricRainfall(this.communeId, locationDetails, commonLookupDetails).execute();
            } else alert("Please choose a commune to view weather data");
        });
    }

    get = (path) => new Promise((resolve, reject) => {
        $.ajax({
            "type": "GET",
            "url": `${this.rootUrl}/${path}`,
            "crossDomain": true,
            "success": response => resolve(response),
            "error": err => reject(err)
        });
    });
    
}