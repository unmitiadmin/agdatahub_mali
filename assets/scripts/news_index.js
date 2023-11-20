class NewsIndex{
    constructor(){
        // Main filters
        this.filterRegion = $("select#filter-region");
        this.filterCercle = $("select#filter-cercle");
        this.filterCommune = $("select#filter-commune");
        this.submitCommune = $("button#submit-commune");

    }

    init = () => {
        // Filter change events unbind
        this.filterRegion.unbind("change");
        this.filterCercle.empty().html(`<option>---</option>`).prop("disabled", true);
        this.filterCommune.empty().html(`<option>---</option>`).prop("disabled", true);
        this.submitCommune.unbind("click");
    }
}