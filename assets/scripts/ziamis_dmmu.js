
$(document).ready(function () {
  let map = null;
  let mapContainerId = "dmmu-map";
  let mapFile = "zambia.topojson";
  let mapLegend = null;
  let geoData = null;
  let mapType = "heat";
  let heatColumn = "count";
  let bubbleColumn = "count";
  let provinceFilter = $("select#province-select");
  let districtFilter = $("select#filter-dmmu-subcounty");
  let dateRangeFilter = $("div#reportrange");
  let dateRangeFilterDisplay = $("div#reportrange span");
  let provinceLabel = $("small#label-province");
  let submit = $("button#button-search");
  let dateFormat = "YYYY-MM-DD";
  let provinces = [];
  let districts = [];
  let all_districts = []
  let incidents = [];
  // let startDate = new Date(new Date().getFullYear(), 0, 1);
  // let endDate = new Date(new Date().getFullYear(), 0, 2);
  let today = new Date();
  let oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  let startDate = oneYearAgo;
  let endDate = today;
  let surveyData = [];
  let selectedProvince = 0;
  let selectedDistrict = 0;
  let availableDateRange = [];
  let apiUrl = "http://44.231.57.147/unmiti/api/data";
  let lookupRequest = { purpose: "get_lookups" };
  let dataRequest = {
    purpose: "get_surveydata",
    survey_id: 437,
    state_id: [],
    district_id: [],
    start_date: null,
    end_date: null,
  };
  let incidentsChart = null;
  let incidentsChartId = "chart-hazard-disaster-incident";
  let monthlyIncidentsChart = null;
  let monthlyIncidentsChartId = "chart-hazard-disaster-incident-1";
  let monthIndex = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
  };
  let selectedDistricts = [];

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
  heatButton = L.easyButton(
    `<button type="button" title="Heat Map" class="btn btn-light"><img src="assets/images/Heat_map_Unelected.svg" height="14px"></button>`,
    () => {
      mapType = "heat";
      drawMap(geoData);
    },
    { position: "topright" }
  );
  map.addControl(heatButton);
  bubbleButton = L.easyButton(
    `<button type="button" title="Bubble Map" class="btn btn-light"><img src="assets/images/Bubble_Unselected.svg"></button>`,
    () => {
      mapType = "bubble";
      drawMap(geoData);
    },
    { position: "topright" }
  );
  map.addControl(bubbleButton);

  map.invalidateSize();

  dateRangeFilterDisplay.daterangepicker(
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
          moment("2022-01-01", "YYYY-MM-DD"),
          moment("2022-12-31", "YYYY-MM-DD"),
        ],
        "Last Year": [
          moment("2021-01-01", "YYYY-MM-DD"),
          moment("2021-12-31", "YYYY-MM-DD"),
        ],
        "Year 2020": [
          moment("2020-01-01", "YYYY-MM-DD"),
          moment("2020-12-31", "YYYY-MM-DD"),
        ],
      },
    },
    setDates
  );

  loadSources();
  setDates(startDate, endDate);

  dateRangeFilterDisplay.on("apply.daterangepicker", () => {
    startDate = moment(
      dateRangeFilterDisplay.data("daterangepicker").startDate
    ).format(dateFormat);
    endDate = moment(
      dateRangeFilterDisplay.data("daterangepicker").endDate
    ).format(dateFormat);
    loadFilters();
  });

  function loadSources() {
    dataRequest = {
      purpose: "get_surveydata",
      survey_id: 437,
      state_id: [],
      district_id: [],
      start_date: null,
      end_date: null,
    };
    Promise.all([
      loadMapFile(mapFile),
      post(apiUrl, lookupRequest),
      post(apiUrl, dataRequest),
    ])
      .then(([topoInput, apiLookups, apiData]) => {
        if (apiData.status) {
          let topoData = JSON.parse(topoInput);
          geoData = topojson.feature(
            topoData,
            topoData.objects.collection
          );
          provinces = apiLookups.lkp_state
            .filter((a) => a.country_id == 17)
            .map((a) => {
              return { province_id: a.state_id, province: a.state_name };
            });
            all_districts = apiLookups.lkp_district
          districts = apiLookups.lkp_district
            .filter((a) => a.country_id == 17 && a.state_id == getProvinceId(provinceFilter.val(), provinces))
            .map((a) => {
              return {
                province_id: a.state_id,
                district_id: a.district_id,
                district: a.district_name,
              };
            });

          districtFilter.empty();
          const option = `<option value="all" selected>All</option>`;
          districtFilter.append(option);
          districts.forEach(function (item) {
            const option = `<option value="${item.district_id}">${item.district}</option>`;
            districtFilter.append(option);
          });
          incidents = apiLookups.lkp_incident.map((a) => {
            return { incident_id: a.id, incident: a.incident_name };
          });
          surveyData = apiData.surveydata
            .map((a) => JSON.parse(a.form_data))
            .map((a) => {
              return {
                province_id: a["field_11008"],
                district_id: a["field_11009"],
                incident_id: a["field_11012"],
                incident_date: `${a["field_11011"]}`.trim(),
              };
            });

          availableDateRange = uniqueArray(
            surveyData
              .map((a) => a["incident_date"])
              .map((a) => new Date(a))
          );
          availableDateRange.sort((a, b) => (a > b ? 0 : -1));
          startDate = availableDateRange[0];
          endDate = availableDateRange[availableDateRange.length - 1];
          loadFilters();
        } else {
          alert("Unable to fetch data/map files");
        }
      })
      .then(() => submit.trigger("click"))
      .catch((err) => {
        console.error(err);
      });
  }

  function loadFilters() {
    selectedProvince = getProvinceId(provinceFilter.val(), provinces);
    selectedDistrict = districtFilter.val();
    selectedDistricts =
      selectedDistrict === "all"
        ? districts.map((item) => item.district_id)
        : [selectedDistrict];
    setDates(startDate, endDate);
    provinceLabel.empty();
    let data = surveyData.filter((a) => {
      const incidentDate = new Date(a["incident_date"]);
      return incidentDate >= startDate && incidentDate <= endDate;
    });

    if (provinces.length && districts.length) {
      // 1. Bar chart
      let incidentData = incidents
        .map((a) => {
          let filteredData = data.filter((b) => {
            const condition =
              a.incident_id == b.incident_id &&
              selectedProvince == b.province_id &&
              selectedDistricts.includes(b.district_id);

            return condition;
          });
          let count = filteredData.length || 0;
          return { name: a.incident, value: count };
        })
        .filter((a) => a.value);
      drawIncidentsChart(incidentData);

      // 2. Line chart
      let monthlyIncidentsData = Object.keys(monthIndex).map((a) => {
        let filteredData = data.filter((b) => {
          const condition =
            new Date(b["incident_date"]).getMonth() + 1 == a &&
            selectedProvince == b.province_id &&
            selectedDistricts.includes(b.district_id);
          return condition;
        });
        let count = filteredData.length || 0;
        return { name: monthIndex[a], value: count };
      });
      drawMonthlyIncidentsChart(monthlyIncidentsData);

      // 3. Spatial Map
      let provinceIncidentsData = provinces.map((a) => {
        let filteredData = data.filter((b) => {
          const condition =
            a.province_id == b.province_id &&
            selectedProvince == b.province_id &&
            selectedDistricts.includes(b.district_id);
          return condition;
        });
        let count = filteredData.length || 0;
        return { id: a.province_id, value: count };
      });
      geoData.features.forEach((a) => {
        let count =
          provinceIncidentsData.find(
            (b) => parseInt(b.id) === a.properties.province_id
          )?.value || 0;

        a.properties["count"] = count;
      });
      drawMap(geoData);
    } else {
      if(selectedProvince){
        alert("Choose at least one district");
      }
    }
  }

  function setDates(start, end) {
    startDate = moment(start);
    endDate = moment(end);
    dateRangeFilterDisplay
      .empty()
      .html(
        moment(start).format("MMMM D, YYYY") +
          " - " +
          moment(end).format("MMMM D, YYYY")
      );
  }

  function drawIncidentsChart(chartData) {
    if (incidentsChart) {
      incidentsChart.destroy();
      incidentsChart = null;
    }
    if (chartData.length) {
      incidentsChart = Highcharts.chart(incidentsChartId, {
        chart: { type: "bar" },
        credits: { enabled: false },
        title: { text: null },
        xAxis: {
          categories: chartData.map((a) => a.name),
          title: { text: "Incident Type" },
        },
        yAxis: {
          min: 0,
          title: { text: "Occurrences", align: "middle" },
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
            name: "Hazard/Disaster/Incident",
            data: chartData.map((a) => a.value),
            color: "#369DC2",
          },
        ],
      });
    } else {
      $(`#${incidentsChartId}`)
        .empty()
        .html(
          `<div class="mt-5 text-center">Data is unavailable for the selections</div>`
        );
    }
  }

  function drawMonthlyIncidentsChart(chartData) {
    if (monthlyIncidentsChart) {
      monthlyIncidentsChart.destroy();
      monthlyIncidentsChart = null;
    }
    if (chartData.length) {
      monthlyIncidentsChart = Highcharts.chart(monthlyIncidentsChartId, {
        chart: { type: "spline" },
        credits: { enabled: false },
        title: { text: null },
        xAxis: {
          categories: chartData.map((a) => a.name),
          title: { text: "Month" },
        },
        yAxis: {
          title: { text: "Occurrences" },
        },
        plotOptions: {
          spline: {
            marker: {
              radius: 4,
              lineColor: "#666666",
              lineWidth: 1,
            },
          },
        },
        series: [
          {
            name: "Hazard/Disaster/Incident",
            data: chartData.map((a) => a.value),
            color: "#369DC2",
          },
        ],
      });
    } else {
      $(`#${monthlyIncidentsChartId}`)
        .empty()
        .html(
          `<div class="mt-5 text-center">Data is unavailable for the selections</div>`
        );
    }
  }

  function drawMap(geoData) {
    map.eachLayer((l) => {
      if (l.options.id && l.options.id.indexOf("zambia-") === 0)
        map.removeLayer(l);
    });
    if (mapType == "heat") {
      drawHeatMap(geoData);
    } else if (mapType == "bubble") {
      drawBubbleMap(geoData);
    }
  }

  function drawHeatMap(geoData) {
    let tooltip;
    let bounds = L.geoJson(geoData, {}).getBounds();
    let vals = scaleVals(geoData.features);
    let polygons = L.d3SvgOverlay(
      (selection, projection) => {
        const heatScale = d3
          .scaleSequential(d3.interpolateBlues)
          .domain([vals.min, vals.max]);
        let locationGroup = selection
          .selectAll("path")
          .data(geoData.features);
        locationGroup
          .enter()
          .append("path")
          .attr("d", (d) => projection.pathFromGeojson(d))
          .attr("id", (d) =>
            d.properties[heatColumn]
              ? `heat_${d.properties.province.replace(" ", "")}`
              : null
          )
          .attr(
            "style",
            "z-index:2000;pointer-events:visiblePainted !important"
          )
          .attr("fill", (d) =>
            d.properties[heatColumn]
              ? heatScale(d.properties[heatColumn])
              : "lightgrey"
          )
          .attr("fill-opacity", (d) =>
            d.properties[heatColumn] ? 3 / 4 : 1 / 4
          )
          .attr("stroke", "black")
          .attr("stroke-width", "0")
          // .attr("stroke-width", "0.1px")
          .on("mouseenter", (e, d) => {
            if (d.properties[heatColumn]) {
              d3.select(
                `#heat_${d.properties.province.replace(" ", "")}`
              ).attr("cursor", "pointer");
              let tooltipContent = `${d.properties.province} (${d.properties[heatColumn]})`;
              tooltip = projection.layer
                .bindTooltip(tooltipContent)
                .openTooltip(
                  L.latLng(
                    projection.layerPointToLatLng(
                      projection.pathFromGeojson.centroid(d)
                    )
                  )
                );
            }
          })
          .on("mouseleave", (e, d) =>
            d.properties[heatColumn] ? tooltip.closeTooltip() : null
          )
          .on("click", (e, d) => {
            if (d.properties[heatColumn]) {
              provinceLabel
                .empty()
                .html(
                  `&nbsp;&nbsp;(for ${d.properties.province} province)`
                );
              let data = surveyData.filter((a) => {
                const incidentDate = new Date(a["incident_date"]
                );
                return (
                  incidentDate >= startDate &&
                  incidentDate <= endDate &&
                  a.province_id == d.properties.province_id
                );
              });

              let incidentData = incidents
                .map((a) => {
                  let count =
                    data.filter(
                      (b) =>
                        b.incident_id == a.incident_id &&
                        selectedProvince == b.province_id &&
                        selectedDistricts.includes(b.district_id)
                    ).length || 0;
                  return { name: a.incident, value: count };
                })
                .filter((a) => a.value);
              drawIncidentsChart(incidentData);

              let monthlyIncidentsData = Object.keys(monthIndex).map(
                (a) => {
                  let count =
                    data.filter(
                      (b) =>
                        moment(b["incident_date"], "YYYY-MM-DD").format(
                          "M"
                        ) == a &&
                        selectedProvince == b.province_id &&
                        selectedDistricts.includes(b.district_id)
                    ).length || 0;
                  return { name: monthIndex[a], value: count };
                }
              );
              drawMonthlyIncidentsChart(monthlyIncidentsData);
            }
          });
      },
      { id: "zambia-heat" }
    );
    polygons.addTo(map);
    map.fitBounds(bounds);
  }

  function drawBubbleMap(geoData) {
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
          .attr("fill", "lightgrey")
          .attr("stroke", "black")
          .attr("stroke-width", "0.2px")
          .attr("fill-opacity", 3 / 5);
      },
      { id: "zambia-bg" }
    );
    polygons.addTo(map);
    map.fitBounds(bounds);
    let tooltip;
    let vals = scaleVals(geoData.features);
    let bubbles = L.d3SvgOverlay(
      (selection, projection) => {
        let pScale = projection.scale > 1 ? projection.scale : 1;
        const bubbleScale = d3
          .scaleLinear()
          .range([5, 25])
          .domain([vals.min, vals.max]);
        let locationGroup = selection
          .selectAll("circle")
          .data(geoData.features);
        locationGroup
          .enter()
          .append("circle")
          .attr("d", (d) => projection.pathFromGeojson(d))
          .attr("id", (d) =>
            d.properties[bubbleColumn]
              ? `circle_${d.properties.province.replace(" ", "")}`
              : null
          )
          .attr(
            "style",
            "z-index:2000;pointer-events:visiblePainted !important"
          )
          .attr("fill", "#43608a")
          .attr("fill-opacity", 3 / 5)
          .attr("cx", (d) => projection.pathFromGeojson.centroid(d)[0])
          .attr("cy", (d) => projection.pathFromGeojson.centroid(d)[1])
          .attr("r", (d) =>
            d.properties[bubbleColumn]
              ? bubbleScale(d.properties[bubbleColumn]) / pScale
              : null
          )
          .on("mouseenter", (e, d) => {
            if (d.properties[bubbleColumn]) {
              d3.select(
                `#circle_${d.properties.province.replace(" ", "")}`
              ).attr("cursor", "pointer");
              let tooltipContent = `${d.properties.province} (${d.properties[bubbleColumn]})`;
              tooltip = projection.layer
                .bindTooltip(tooltipContent)
                .openTooltip(
                  L.latLng(
                    projection.layerPointToLatLng(
                      projection.pathFromGeojson.centroid(d)
                    )
                  )
                );
            }
          })
          .on("mouseleave", (e, d) =>
            d.properties[heatColumn] ? tooltip.closeTooltip() : null
          )
          .on("click", (e, d) => {
            if (d.properties[heatColumn]) {
              provinceLabel
                .empty()
                .html(
                  `&nbsp;&nbsp;(for ${d.properties.province} province)`
                );
              let data = surveyData.filter((a) => {
                const incidentDate = new Date(a["incident_date"]
                );
                return (
                  incidentDate >= startDate &&
                  incidentDate <= endDate &&
                  a.province_id == d.properties.province_id
                );
              });

              let incidentData = incidents
                .map((a) => {
                  let count =
                    data.filter(
                      (b) =>
                        b.incident_id == a.incident_id &&
                        selectedProvince == b.province_id &&
                        selectedDistricts.includes(b.district_id)
                    ).length || 0;
                  return { name: a.incident, value: count };
                })
                .filter((a) => a.value);
              drawIncidentsChart(incidentData);

              let monthlyIncidentsData = Object.keys(monthIndex).map(
                (a) => {
                  let count =
                    data.filter(
                      (b) =>
                        moment(b["incident_date"], "YYYY-MM-DD").format(
                          "M"
                        ) == a &&
                        selectedProvince == b.province_id &&
                        selectedDistricts.includes(b.district_id)
                    ).length || 0;
                  return { name: monthIndex[a], value: count };
                }
              );
              drawMonthlyIncidentsChart(monthlyIncidentsData);
            }
          });
        locationGroup
          .transition()
          .duration(200)
          .attr("r", (d) =>
            d.properties[bubbleColumn]
              ? bubbleScale(d.properties[bubbleColumn]) / pScale
              : null
          );
      },
      { id: "zambia-bubble" }
    );
    bubbles.addTo(map);
  }

  function scaleVals(features) {
    d3.select("svg.legend-svg")?.remove("*");
    let values = features
      .map((d) => d.properties[heatColumn])
      .filter(Boolean);
    values.sort((a, b) => (a > b ? 0 : -1));
    let valObj = {
      min: Math.min(...values),
      max: Math.max(...values),
      all: values,
    };

    if (mapType == "heat") {
      drawHeatLegend(valObj.min, valObj.max);
    } else if (mapType == "bubble") {
      drawBubbleLegend(valObj.min, valObj.max);
    }
    return valObj;
  }

  function drawHeatLegend(min, max) {
    const [w, h] = [20, 180];
    mapLegend?.selectAll("*").remove();
    mapLegend = d3
      .select("#dmmu-map-legend")
      .append("svg")
      .attr("class", "legend-svg")
      .attr("height", "100%");
    let gradient = mapLegend
      .append("defs")
      .append("svg:linearGradient")
      .attr("id", "gradient")
      .attr("x1", "100%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%")
      .attr("spreadMethod", "pad");
    let lowColor = d3.interpolateBlues(0);
    let highColor = d3.interpolateBlues(1);
    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", highColor)
      .attr("stop-opacity", 1);
    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", lowColor)
      .attr("stop-opacity", 1);
    const legend = mapLegend.append("g").attr("id", "map-legend-svg");
    legend
      .append("rect")
      .attr("width", w)
      .attr("height", h)
      .style("fill", "url(#gradient");
    const axisScale = d3
      .scaleSequential()
      .range([h + 5, 5])
      .domain([0, max + 1]);
    const axis = d3.axisRight(axisScale);
    axis.ticks(5);
    legend
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${w}, ${0})`)
      .call(axis);
  }

  function drawBubbleLegend(min, max) {
    mapLegend?.selectAll("*").remove();
    mapLegend = d3
      .select("#dmmu-map-legend")
      .append("svg")
      .attr("class", "legend-svg")
      .attr("bottom", "10px");
    let size = d3.scaleLinear().domain([min, max]).range([5, 25]);
    let valuesToShow = [min, parseInt((min + max) / 2), max];
    valuesToShow.sort((a, b) => (a > b ? 0 : -1));

    mapLegend
      .selectAll("legend")
      .data(valuesToShow)
      .enter()
      .append("circle")
      .attr("cx", 35)
      .attr("cy", (d) => size(d))
      .attr("r", (d) => size(d))
      .style("fill", "#f6f6f5")
      .attr("stroke", "#262228")
      .attr("fill-opacity", 0.6);

    mapLegend
      .selectAll("legend")
      .data(valuesToShow)
      .enter()
      .append("line")
      .attr("x1", (d) => size(d) + 38)
      .attr("x2", 100)
      .attr("y1", (d) => size(d))
      .attr("y2", (d) => size(d))
      .attr("stroke", "black")
      .style("stroke-dasharray", "2,2");

    mapLegend
      .selectAll("legend")
      .data(valuesToShow)
      .enter()
      .append("text")
      .attr("x", 100)
      .attr("y", (d) => size(d))
      .text((d) => `\t${d}`)
      .style("font-size", 8)
      .style("margin", "5px")
      .attr("alignment-baseline", "middle");
  }

  function uniqueArray(array) {
    return Array.from(new Set(array));
  }

  function loadMapFile(mapFile) {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: "GET",
        url: `./assets/maps/${mapFile}`,
        success: (response) => resolve(response),
        error: (err) => reject(err),
      });
    });
  }

  function post(apiUrl, data) {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: "POST",
        url: apiUrl,
        data: JSON.stringify(data),
        success: (response) => resolve(response),
        error: (err) => reject(err),
      });
    });
  }

  $("#dmmu-tab").on("click", function () {
    /* for this dmmu-tab we are using different dropdowns for the districts */
    $("#dmmu-districts").show();
    $("#non-dmmu-districts").hide();
    $("#submit-dmmu-ward").show();
    $("#submit-ward").hide();
    loadFilters();
    map.invalidateSize();
    drawMap(geoData);
  });

  function getProvinceId(province, provinceData) {
    for (const entry of provinceData) {
      if (toTitleCase(entry.province) == province) {
        return entry.province_id;
      }
    }
    return null; // Return null if the province is not found
  }

  function toTitleCase(str) {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  $("#submit-dmmu-ward").click(function (e) {
    e.preventDefault();
    loadFilters();
  });

  $("#province-select").change(function () {
    const selectedProvince = $(this).val();
    if (selectedProvince !== "Select your Province") {      
      districts = all_districts
        .filter((a) => a.country_id == 17 && a.state_id == getProvinceId(provinceFilter.val(), provinces))
        .map((a) => {
          return {
            province_id: a.state_id,
            district_id: a.district_id,
            district: a.district_name,
          };
        });

      districtFilter.empty();
      const option = `<option value="all" selected>All</option>`;
      districtFilter.append(option);
      districts.forEach(function (item) {
        const option = `<option value="${item.district_id}">${item.district}</option>`;
        districtFilter.append(option);
      });
    }
  }); 
});