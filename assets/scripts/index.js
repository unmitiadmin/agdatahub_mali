Highcharts.setOptions({lang: {thousandsSep: ','}});
$(window).on("load", () => new Index().init());


class Index{
    constructor(){
        // Page objects
        this.weatherIndex = new WeatherIndex();
        this.agricultureIndex = new AgricultureIndex();
        this.soilsIndex = new SoilsIndex();
        this.satImgIndex = new FaoSatImg();
        this.newsIndex = new NewsIndex();
        // Filters for locations
        this.filterRegion = $("select#filter-region");
        this.filterCercle = $("select#filter-cercle");
        this.filterCommune = $("select#filter-commune");
        this.filterWaitRegion = $("i#filter-wait-region");
        this.filterWaitCercle = $("i#filter-wait-cercle");
        this.filterWaitCommune = $("i#filter-wait-commune");
        this.submitCommune = $("button#submit-commune");
    }

    init = () => {
        this.enablePages();
    }


    enablePages = () => {
        // Keep weather tab active and load the filters first
        // 1. Weather tab
        $("button.nav-link.site-menu[data-bs-target='#weather']").unbind("click").on("click", () => {
            this.weatherIndex.init();
            this.filterCercle.prop("disabled", false);
            this.filterCommune.prop("disabled", false);
        }).trigger("click");

        // 2. Agriculture tab
        $("button.nav-link.site-menu[data-bs-target='#agriculture']").unbind("click").on("click", () => {
            this.agricultureIndex.init();
        });

        // 3. Soils tab
        $("button.nav-link.site-menu[data-bs-target='#soils']").unbind("click").on("click", () => {
            this.soilsIndex.init();
        });

        // 4. Satellite Imagery tab
        $("button.nav-link.site-menu[data-bs-target='#satelliteimagery']").unbind("click").on("click", () => {
            this.satImgIndex.init();
        });

        // 5. News Tab
        $("button.nav-link.site-menu[data-bs-target='#news']").unbind("click").on("click", () => {
            this.newsIndex.init();
        });
    }
}