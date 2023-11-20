const weatherApiUrl = "http://15.206.6.122:8085";

const startWaiting = () => {
    let loadingIcon = `<div class="text-center"><div class="fa-3x mb-1"><i class="fa fa-spinner fa-pulse" aria-hidden="true"></i></div><span>Loading</span></div>`;
    $("#loading-modal-container").empty().html(loadingIcon);
    $('#loading-modal').modal('show');
}

const stopWaiting = () => {
    $("#loading-modal-container").empty();
    $("#loading-modal").modal("hide");
}
