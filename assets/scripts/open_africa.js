
$(document).ready(function () {
  let map = null;
  let mapContainerId = "openafrica-map";
  let geoData = null;
  let mapFile = "zambia.topojson";
  let dataFile = "openafrica.csv";
  let data = [];
  let years = [2011, 2012, 2013, 2014, 2015, 2016, 2017];
  let indicators = [];
  let provinces = {};
  let crops = [];
  let filterCrop = $("select#filter-openafrica");
  let chosenCrop = filterCrop.val();
  let geoLevel = "country";
  let provinceId = null;
  let locationLabel = $("span#openafrica-location");

  let fao_data = [];

  if (map != undefined) {
    map.remove();
    map.off();
  }
  mapContainerElement = L.DomUtil.get(mapContainerId);
  if (mapContainerElement != null) mapContainerElement._leaflet_id = null;

  map = L.map(mapContainerId, { fullscreenControl: true }).setView(
    [-15.416667, 28.283333],
    6
  );
  streetLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { maxZoom: 15 }
  );
  streetLayer.addTo(map);
  satelliteLayer = L.tileLayer(
    "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    { subdomains: ["mt0", "mt1", "mt2", "mt3"], maxZoom: 15 }
  );
  bgLayers = {
    Street: streetLayer,
    Satellite: satelliteLayer,
  };
  L.control.layers(bgLayers).addTo(map);

  countryButton = L.easyButton(
    `<i class="fa fa-undo" aria-hidden="true"></i>`,
    () => getCountryData(),
    { position: "topright" }
  );
  map.addControl(countryButton);

  $("#zambiaopenafrica-tab").on("click", function () {
    map.invalidateSize();
  });

  loadSources();
  function loadSources() {
    Promise.all([loadCSVFile(dataFile), loadMapFile()])
      .then(([csvData, topoInput]) => {
        let topoData = JSON.parse(topoInput);
        geoData = topojson.feature(topoData, topoData.objects.collection);
        drawMap(geoData);
        data = parseCSVToJSON(csvData);
        arrangeData();
      })
      .catch((err) => {
        alert("Error loading data/map");
        console.error(err);
      });
  }

  function arrangeData() {
    // crop filter
    crops = uqArray(data.map((a) => a["Crop"]));
    filterCrop.html(
      crops.map((a) => `<option value="${a}">${a}</option>`).join("\n")
    );

    // indicators
    indicators = uqArray(
      data.map((a) => (a["Indicator"] ? a["Indicator"].trim() : null))
    );

    filterCrop.on("change", () => {
      chosenCrop = filterCrop.val();
      if (geoLevel == "country") {
        getCountryData();
      } else if (geoLevel == "province") {
        if (provinceId) getProvinceData(provinceId);
      }
    });
    filterCrop.trigger("change");
  }

  $("#submit-ward").click(function (e) {
    e.preventDefault();
    let province_name = $("#province-select").val();
    if (province_name) {
      getProvinceData(provinces[province_name]);
    }
  });

  const getProvinceData = (provinceId) => {
    $("[id^='$oa']").each(function () {
      $(this).attr("fill", "lightgrey");
    });
    const pathElement = document.getElementById(`$oa${provinceId}`);
    if (pathElement) {
      pathElement.setAttribute("fill", "red");
    }

    let provinceData = data.filter(
      (a) =>
        a.province_id &&
        a.province_id == provinceId &&
        a["Crop"] == chosenCrop
    );
    let provinceChartData = indicators.map((a) => {
      let indicatorData = provinceData.find((b) => b["Indicator"] == a);
      let chartData = years.map((b) => {
        return { year: b, value: indicatorData ? indicatorData[b] : 0 };
      });
      return { indicator: a, chartData: chartData };
    });
    drawCharts(provinceChartData);
  };

  function getCountryData() {
    let countryData = data.filter(
      (a) => !a.province_id && a["Crop"] == chosenCrop
    );

    let countryChartData = indicators.map((a) => {
      let indicatorData = countryData.find((b) => b["Indicator"] == a);
      let chartData = years.map((b) => {
        return { year: b, value: indicatorData ? indicatorData[b] : 0 };
      });
      return { indicator: a, chartData: chartData };
    });
    drawCharts(countryChartData);
    locationLabel.empty();
  }

  const drawCharts = (locationData) => {
    let areaChartData =
      locationData.find((a) => a.indicator == "Area Planted")
        ?.chartData || [];
    let productionChartData =
      locationData.find((a) => a.indicator == "Expected Production")
        ?.chartData || [];
    let yieldChartData =
      locationData.find((a) => a.indicator == "Yield Rate")?.chartData ||
      [];
    let salesChartData =
      locationData.find((a) => a.indicator == "Expected Sales")
        ?.chartData || [];

    drawLineChart(
      "openafrica-chart-area",
      areaChartData,
      "Ha",
      "Area Planted"
    );
    drawLineChart(
      "openafrica-chart-prod",
      productionChartData,
      "MT",
      "Expected Production"
    );
    drawLineChart(
      "openafrica-chart-yield",
      yieldChartData,
      "Mt/Ha",
      "Yield Rate"
    );
    drawLineChart(
      "openafrica-chart-sales",
      salesChartData,
      "MT",
      "Expected Sales"
    );
  };

  const drawLineChart = (containerId, chartData, units, seriesName) => {
    if (chartData && chartData.length) {
      Highcharts.chart(containerId, {
        chart: { type: "spline" },
        credits: { enabled: false },
        legend: { enabled: false },
        title: { text: null },
        xAxis: {
          categories: chartData.map((a) => a.year),
          title: { text: "Year" },
          dataLabels: false,
        },
        yAxis: {
          title: { text: `${seriesName} (${units})` },
        },
        plotOptions: {
          spline: {
            marker: {
              radius: 4,
              lineColor: "#666666",
              lineWidth: 1,
            },

            dataLabels: {
              enabled: true,
              formatter: function () {
                const y = this.point.y; // Access the 'y' value from the data point
                return Highcharts.numberFormat(y, 2);
              },
            },
          },
        },
        series: [
          {
            name: seriesName,
            data: chartData.map((a) => a.value),
            color: "#369DC2",
          },
        ],
      });
    } else {
      $(`div#${containerId}`)
        .empty()
        .html(`<div class="mt-4 text-center">Data unavailable</div>`);
    }
  };

  const drawMap = (geoData) => {
    reloadSvgHolder();
    let tooltip;
    let bounds = L.geoJson(geoData, {}).getBounds();
    let polygons = L.d3SvgOverlay(
      (selection, projection) => {
        let locationGroup = selection
          .selectAll("path")
          .data(geoData.features);
        locationGroup
          .enter()
          .append("path")
          .attr("d", (d) => projection.pathFromGeojson(d))
          .attr("id", (d) => {
            provinces[d.properties.province] = d.properties.province_id;
            return `$oa${d.properties.province_id}`;
          })
          .attr(
            "style",
            "z-index:2000;pointer-events:visiblePainted !important"
          )
          .attr("fill", "lightgrey")
          .attr("stroke", "black")
          .attr("stroke-width", "0.1px")
          .attr("fill-opacity", 3 / 5)
          .on("mouseenter", (e, d) => {
            d3.select(`path#oa${d.properties.province_id}`).attr(
              "cursor",
              "pointer"
            );
            let tooltipContent = `${d.properties.province}`;
            tooltip = projection.layer
              .bindTooltip(tooltipContent)
              .openTooltip(
                L.latLng(
                  projection.layerPointToLatLng(
                    projection.pathFromGeojson.centroid(d)
                  )
                )
              );
          })
          .on("mouseleave", (e, d) => tooltip.closeTooltip())
          .on("click", (e, d) => {
            if (d.properties.province_id) {
              geoLevel = "province";
              provinceId = d.properties.province_id;
              getProvinceData(provinceId);
              locationLabel
                .empty()
                .html(` (${d.properties.province} Province)`);
            }
          });
      },
      { id: `province` }
    );
    polygons.addTo(map);
    map.fitBounds(bounds).setView([-15.416667, 28.283333], 6);
  };

  function loadCSVFile(fileName) {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: "GET",
        url: `./assets/datasets/tempData/${fileName}`,
        success: (response) => resolve(response),
        error: (err) => reject(err),
      });
    });
  }

  function loadMapFile() {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: "GET",
        url: `./assets/maps/${mapFile}`,
        success: (response) => resolve(response),
        error: (err) => reject(err),
      });
    });
  }

  const reloadSvgHolder = () => {
    map.eachLayer((l) => {
      if (l.options.id && l.options.id.indexOf("province") === 0)
        map.removeLayer(l);
    });
  };

  function parseCSVToJSON(csvText) {
    const lines = csvText.split("\n");
    const header = lines[0].split(",");
    const data = [];

    for (let i = 1; i < lines.length - 1; i++) {
      const currentLine = lines[i].split(",");
      const rowData = {};

      for (let j = 0; j < header.length; j++) {
        let value = currentLine[j];

        if (typeof value === "undefined") {
          value = null;
        } else {
          value = value.trim();
        }
        if (header[j]) {
          const cleanedValue = ["NULL", undefined, null, ""].includes(
            value
          )
            ? null
            : isNaN(value)
            ? value.replace(/"/g, "")
            : parseFloat(value);
          rowData[`${header[j].trim()}`] = cleanedValue
            ? cleanedValue
            : null;
        }
      }
      data.push(rowData);
    }

    return data;
  }

  const uqArray = (arr) => [...new Set(arr)];
  const sumArray = (arr) => arr.reduce((a, b) => a + b, 0);
  const num = (val) => (!isNaN(val) ? parseFloat(val) : 0);

  // below is for the agriculture's FAO
  loadFAOData();
  function loadFAOData() {
    $.ajax({
      type: "GET",
      url: `./assets/datasets/agriculture_fao.json`,
      success: (response) => {
        fao_data = response;
        populateCropNames(response);
        populateYearValues(response);
        generate_yield_data();
      },
    });
  }

  function populateCropNames(crops) {
    const selectElement = $("#fao_crops");
    selectElement.append(
      $("<option>", {
        value: "all",
        text: "All crops",
      })
    );
    const uniqueCropNames = [
      ...new Set(crops.map((item) => item["Crop name"])),
    ];
    uniqueCropNames.forEach((cropName) => {
      selectElement.append(
        $("<option>", {
          value: cropName,
          text: cropName,
        })
      );
    });
  }

  function populateYearValues(years) {
    const selectElement = $("#fao_years");
    selectElement.append(
      $("<option>", {
        value: "all",
        text: "All years",
      })
    );
    const uniqueYears = [...new Set(years.map((item) => item["Year"]))];
    uniqueYears.forEach((year) => {
      selectElement.append(
        $("<option>", {
          value: year,
          text: year,
        })
      );
    });
  }

  $("#fao_filters").click(function (e) {
    e.preventDefault();
    generate_yield_data();
  });

  function generate_yield_data() {
    let filtered_fao_data = fao_data;
    if ($("#fao_years").val() != "all") {
      filtered_fao_data = fao_data.filter(
        (item) => item["Year"] == $("#fao_years").val()
      );
    }
    let selected_crops = [];
    if ($("#fao_crops").val() == "all") {
      selected_crops = [
        ...new Set(filtered_fao_data.map((item) => item["Crop name"])),
      ];
    } else {
      selected_crops = [$("#fao_crops").val()];
      filtered_fao_data = filtered_fao_data.filter(
        (item) => item["Crop name"] == $("#fao_crops").val()
      );
    }
    let yield_series = [];
    if ($("#fao_indicators").val() == "all") {
      const summedData = {};
      filtered_fao_data.forEach((item) => {
        const cropName = item["Crop name"];
        if (summedData[cropName]) {
          summedData[cropName] += Math.round(
            item["Yield"] + item["Area harvested"] + item["Production"]
          );
        } else {
          summedData[cropName] = Math.round(
            item["Yield"] + item["Area harvested"] + item["Production"]
          );
        }
      });
      yield_series = [
        {
          name: "Production, Yield, Area Harvested",
          data: Object.values(summedData),
          color: "#ffe59a",
        },
      ];
    } else {
      const summedData = {};
      filtered_fao_data.forEach((item) => {
        const cropName = item["Crop name"];
        if (summedData[cropName]) {
          summedData[cropName] += Math.round(
            item[$("#fao_indicators").val()]
          );
        } else {
          summedData[cropName] = Math.round(
            item[$("#fao_indicators").val()]
          );
        }
      });
      yield_series = [
        {
          name: $("#fao_indicators").val(),
          data: Object.values(summedData),
          color: "#ffe59a",
        },
      ];
    }
    generate_fao_bar_graph(selected_crops, yield_series);
    generate_fao_line_graph(selected_crops, yield_series);
  }

  function generate_fao_bar_graph(yield_categories, yield_series) {
    Highcharts.chart("Production_yield_bar", {
      chart: { type: "bar" },
      title: { text: null },
      subtitle: { text: null },
      xAxis: {
        categories: yield_categories,
        title: { text: null },
      },
      yAxis: {
        min: 0,
        title: { text: null, align: "high" },
        labels: { overflow: "justify" },
      },
      tooltip: { valueSuffix: null },
      plotOptions: {
        bar: {
          dataLabels: { enabled: true },
        },
      },
      credits: { enabled: false },
      series: yield_series,
    });
  }

  function generate_fao_line_graph(yield_categories, yield_series) {
    Highcharts.chart("harvested_line_graph", {
      chart: { type: "line" },
      title: { text: null },
      subtitle: { text: null },
      xAxis: {
        categories: yield_categories,
        title: { text: null },
      },
      yAxis: {
        min: 0,
        title: { text: null, align: "high" },
        labels: { overflow: "justify" },
      },
      tooltip: { valueSuffix: null },
      plotOptions: {
        line: {
          dataLabels: {
            enabled: true,
          },
          enableMouseTracking: true,
        },
      },
      credits: { enabled: false },
      series: yield_series,
    });
  }

  // FAO ends
});