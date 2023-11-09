const weatherApiUrl = "http://15.206.6.122:8084";
// const weatherApiUrl = "http://localhost:8000";

Highcharts.setOptions({lang: {thousandsSep: ','}});
$(window).on("load", () => new Index().init()); //, new ZambiaDMMU().init()

class Index{
    constructor(){
        // this.weatherInfo = new WeatherAdvisories();
        // this.weatherIndex = new WeatherIndex();
        // this.kenyaKilimo = new KenyaKilimo();
        // this.soilsIndex = new SoilsIndex();
        // this.faoSatImg = new FaoSatImg();
        // this.cropSelector = new CropSelector();
        // this.kaznetMarketData = new KaznetMarketData();
        this.filterCounty = $("select#filter-county");
        this.filterSubCounty = $("select#filter-subcounty");
        this.filterWard = $("select#filter-ward");

        this.switchContents = $("input[type='checkbox']#tabs-switch");
        this.noticeSection = $("section.section-notice");
        this.visualSections = $("section.section-visuals");
    }

    init = () => {
        this.noticeSection.show();
        this.visualSections.hide();
        // as counties, sub-counties, wards are in druid
        this.switchContents.on("change", e => {
            let checked = e.currentTarget.checked;
            if(checked){
                $("div#tabs-info").hide();
                $("div#content-info").hide();
                $("div#tabs-datahub").show();
                $("div#content-datahub").show();
            } else{
                $("div#tabs-datahub").hide();
                $("div#content-datahub").hide();
                $("div#tabs-info").show();
                $("div#content-info").show();
            }
        });
        this.enableTabs();
    }

    enableTabs = () => {        
        $("button.nav-link.site-menu[data-bs-target='#weather']").unbind("click").on("click", () => {
            this.weatherIndex.init();
            this.filterSubCounty.attr("disabled", false);
            this.filterWard.attr("disabled", false);
        }).trigger("click");

        $("button.nav-link.site-menu[data-bs-target='#fao-sat']").unbind("click").on("click", () => {
            this.faoSatImg.init();
            this.filterSubCounty.val("").prop("disabled", true);
            this.filterWard.val("").prop("disabled", true);
        });

        $("button.nav-link.site-menu[data-bs-target='#agriculture']").unbind("click").on("click", () => {
            this.kenyaKilimo.init();
            this.filterSubCounty.val("").prop("disabled", true);
            this.filterWard.val("").prop("disabled", true);
        });

        $("button.nav-link.site-menu[data-bs-target='#soils']").unbind("click").on("click", () => {
            this.soilsIndex.init();
            this.filterSubCounty.val("").prop("disabled", true);
            this.filterWard.val("").prop("disabled", true);
        });

        $("button.nav-link.site-menu[data-bs-target='#crop-selector']").unbind("click").on("click", () => {
            this.cropSelector.init();
            this.filterSubCounty.val("").prop("disabled", false);
            this.filterWard.val("").prop("disabled", false);
        });

        $("button.nav-link.site-menu[data-bs-target='#kaznet']").unbind("click").on("click", () => {
            this.kaznetMarketData.init();
            this.filterSubCounty.val("").prop("disabled", true);
            this.filterWard.val("").prop("disabled", true);
        });
    }
}