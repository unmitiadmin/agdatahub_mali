
$(document).ready(function () {
  $("#submit-ward").click(function (e) {
    e.preventDefault();
    get_spatial_analysis_api();
  });

  let dateRangeDisplay = $("div#filter-sadms-date span");
  // let startDate = new Date(new Date().getFullYear(), 0, 1);
  // let endDate = new Date(new Date().getFullYear(), 0, 2);
  let today = new Date();
  let oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  let startDate = oneYearAgo;
  let endDate = today;
  let imageUrl = "";
  let parameterFilter = $("select#filter-sadms-parameter");
  let aggregationFilter = $("select#filter-sadms-aggregation");

  var map = L.map("spatial_map", { fullscreenControl: true }).setView(
    [-12.479915, 28.259003],
    6
  );
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);

  setDates(startDate, endDate);
  let dateFormat = "YYYY-MM-DD";

  let baseUrl = "https://dmsdemo.iwmi.org:8443";
  let authKey = "Api-Key EssDq7Br.fGHWnEolWmmaN0350MCcWC2hosjo7ns1";

  let selectedStartDate = moment(startDate, dateFormat);
  let selectedEndDate = moment(endDate, dateFormat);

  let parameterUrlPoints = {
    NDVI: "agriculture/ndvi",
    EVI: "agriculture/evi",
  };

  dateRangeDisplay.daterangepicker(
    {
      showDropdowns: true,
      startDate: startDate,
      endDate: endDate,
      ranges: {
        Today: [moment(), moment()],
        Yesterday: [
          moment().subtract(1, "days"),
          moment().subtract(1, "days"),
        ],
        "Last 7 Days": [moment().subtract(6, "days"), moment()],
        "Last 30 Days": [moment().subtract(29, "days"), moment()],
        "This Year": [
          moment("2022-01-01", dateFormat),
          moment("2022-12-31", dateFormat),
        ],
        "Last Year": [
          moment("2021-01-01", dateFormat),
          moment("2021-12-31", dateFormat),
        ],
      },
    },
    setDates
  );

  function setDates(start, end) {
    startDate = moment(start);
    endDate = moment(end);
    dateRangeDisplay
      .empty()
      .html(
        moment(start).format("MMMM D, YYYY") +
          " - " +
          moment(end).format("MMMM D, YYYY")
      );
  }
  let selectedParameter = parameterFilter.val();
  let selectedParameterURL = parameterUrlPoints[selectedParameter];
  let selectedAggregation = aggregationFilter.val();

  parameterFilter.on("change", () => {
    selectedParameter = parameterFilter.val();
    selectedParameterURL = parameterUrlPoints[selectedParameter];
  });
  aggregationFilter.on(
    "change",
    () => (selectedAggregation = aggregationFilter.val())
  );

  dateRangeDisplay.on("apply.daterangepicker", () => {
    selectedStartDate = moment(
      dateRangeDisplay.data("daterangepicker").startDate
    ).format(dateFormat);
    selectedEndDate = moment(
      dateRangeDisplay.data("daterangepicker").endDate
    ).format(dateFormat);
  });

  $("#button-addon2, #button-addon1").on("click", function () {
    $("#loading-icon").show();
    get_spatial_analysis_api();
  });

  function get_spatial_analysis_api() {
    let map_payload = {
      country_name: "Zambia",
      temporal_aggregation: selectedAggregation,
      start_date: date_converter(selectedStartDate),
      end_date: date_converter(selectedEndDate),
    };

    var request1 = $.ajax({
      type: "POST",
      url: `${baseUrl}/${selectedParameterURL}/map`,
      headers: {
        "Content-Type": "application/json",
        Authorization: authKey,
      },
      data: JSON.stringify(map_payload),
    });

    let time_payload = {
      country_name: "Zambia",
      spatial_aggregation: selectedAggregation,
      start_date: date_converter(selectedStartDate),
      end_date: date_converter(selectedEndDate),
    };

    var request2 = $.ajax({
      type: "POST",
      url: `${baseUrl}/${selectedParameterURL}/timeseries`,
      headers: {
        "Content-Type": "application/json",
        Authorization: authKey,
      },
      data: JSON.stringify(time_payload),
    });

    $.when(request1, request2).then(function (response1, response2) {
      $("#loading-icon").hide();
      var data1 = response1[0].result;
      var data2 = response2[0].result;
      imageUrl = data1.map_data.map_url;

      map?.remove();
      map?.off();
      let mapContainerElement = L.DomUtil.get("spatial_map");
      if (mapContainerElement != null)
        mapContainerElement._leaflet_id = null;

      map = L.map("spatial_map", {
        fullscreenControl: true,
      }).setView([-15.416667, 28.283333], 6);
      let streetLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 15 }
      );
      streetLayer.addTo(map);
      L.tileLayer(imageUrl, { maxZoom: 15 }).addTo(map);      

      $("#spatial-tab").on("click", function () {
        map.invalidateSize();
      });

      Highcharts.chart("chart-production-yield", {
        chart: {
          type: "column",
          backgroundColor: "rgba(0,0,0,0)",
        },
        credits: { enabled: false },
        exporting: { enabled: false },
        legend: { enabled: false },
        title: { text: selectedParameter },
        xAxis: {
          categories: response2[0].result.graph_data.millis.map((a) =>
            moment(new Date(a)).format(dateFormat)
          ),
          title: { text: "Date" },
        },
        yAxis: {
          min: 0,
          title: { text: selectedParameter, align: "middle" },
          labels: { overflow: "justify" },
          tickInterval: 1,
          min: 0,
        },
        plotOptions: {
          bar: {
            allowPointSelect: true,
            cursor: "pointer",
            dataLabels: { enabled: true },
          },
        },
        series: [
          {
            name: selectedParameter,
            data: response2[0].result.graph_data.data,
            color: "green",
          },
        ],
      });
    });
  }

  function date_converter(isoDateString) {
    const date = new Date(isoDateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based, so add 1
    const day = date.getDate().toString().padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  }
});