
$(document).ready(function () {
  $("#submit-ward").click(function (e) {
    e.preventDefault();
    let data = {};
    const betweenOption = $("#historic_between_options").val();
    if (betweenOption == "months") {
      data.fromMonth = parseInt($("#filter-hrf-hm-m1").val());
      data.toMonth = parseInt($("#filter-hrf-hm-m2").val());
      (data.fromWeek = 0), (data.toWeek = 0);
    } else {
      data.fromWeek = parseInt($("#filter-hrf-hm-m1").val());
      data.toWeek = parseInt($("#filter-hrf-hm-m2").val());
      (data.fromMonth = 0), (data.toMonth = 0);
    }
    data.rfGte = parseInt($("#hrf_more_than").val());
    data.rfLt = parseInt($("#hrf_less_than").val());
    historic_rainfall_api(data, "/historic_yearly_rainfall");
    historic_how_dry_rainfall_api(data, "/historic_dry_spells");
    historic_how_wet_rainfall_api(data, "/historic_wet_spells");
    historic_crop_stress_api(data, "/historic_crop_stress");
    historic_temp_weather_api(data, "/historic_yearly_temperature");
  });

  // $("#item-id-3").on("click", function () {
  //   $("#loading-icon").show();
  //   let data = {};
  //   const betweenOption = $("#historic_between_options").val();
  //   if (betweenOption == "months") {
  //     data.fromMonth = parseInt($("#filter-hrf-hm-m1").val());
  //     data.toMonth = parseInt($("#filter-hrf-hm-m2").val());
  //     (data.fromWeek = 0), (data.toWeek = 0);
  //   } else {
  //     data.fromWeek = parseInt($("#filter-hrf-hm-m1").val());
  //     data.toWeek = parseInt($("#filter-hrf-hm-m2").val());
  //     (data.fromMonth = 0), (data.toMonth = 0);
  //   }
  //   data.rfGte = parseInt($("#hrf_more_than").val());
  //   data.rfLt = parseInt($("#hrf_less_than").val());
  //   historic_rainfall_api(data, "/historic_yearly_rainfall");
  // });

  $("input[name='historicRainfall_radio']").on("change", function () {
    historic_radio_value = $(this).val();
    $("#loading-icon").show();
    let data = {};
    const betweenOption = $("#historic_between_options").val();
    if (betweenOption == "months") {
      data.fromMonth = parseInt($("#filter-hrf-hm-m1").val());
      data.toMonth = parseInt($("#filter-hrf-hm-m2").val());
      (data.fromWeek = 0), (data.toWeek = 0);
    } else {
      data.fromWeek = parseInt($("#filter-hrf-hm-m1").val());
      data.toWeek = parseInt($("#filter-hrf-hm-m2").val());
      (data.fromMonth = 0), (data.toMonth = 0);
    }
    data.rfGte = parseInt($("#hrf_more_than").val());
    data.rfLt = parseInt($("#hrf_less_than").val());

    const tabId = $("#pills-tab .nav-link").attr("aria-controls");
    if (tabId == "pills-Howmuch") {
      historic_rainfall_api(data, "/historic_yearly_rainfall");
    } else if (tabId == "pills-Howdry") {
      historic_how_dry_rainfall_api(data, "/historic_dry_spells");
    } else if (tabId == "pills-Howwet") {
      historic_how_wet_rainfall_api(data, "/historic_wet_spells");
    } else {
      historic_crop_stress_api(data, "/historic_crop_stress");
    }
  });

  historic_rainfall_weather_api();

  $("#historic_between_options").change(function () {
    historic_rainfall_weather_api();
  });

  function historic_rainfall_weather_api() {
    selectedOption = $("#historic_between_options").val();
    const fromLabel = $("#from-label_1");
    const toLabel = $("#to-label_1");
    const fromMonthSelect = $("#filter-hrf-hm-m1");
    const toMonthSelect = $("#filter-hrf-hm-m2");

    if (selectedOption === "months") {
      fromLabel.text("From Month");
      toLabel.text("To Month");
      fromMonthSelect.show();
      toMonthSelect.show();
    } else {
      fromLabel.text("From Week");
      toLabel.text("To Week");
      fromMonthSelect.show();
      toMonthSelect.show();
    }

    let text_ = selectedOption === "months" ? "month" : "week";
    $.ajax({
      url: `${weatherApiUrl}/${selectedOption}`,
      method: "GET",
      success: function (response) {
        updateSelectOptions(fromMonthSelect, response.data, text_);
        updateSelectOptions(toMonthSelect, response.data, text_);
        $("#loading-icon").hide();
      },
    });
  }

  function updateSelectOptions(selectElement, data, text_) {
    selectElement.empty();
    selectElement.append(
      $("<option>", {
        value: "",
        text: "---------",
      })
    );
    $.each(data, function (index, option) {
      selectElement.append(
        $("<option>", {
          value: option[text_ + "_id"],
          text: option[text_],
        })
      );
    });
  }

  function historic_rainfall_how_much_probability_chart(data, type) {
    const chartConfig = {
      chart: {
        type: "spline",
      },
      title: {
        text: "",
      },
      subtitle: {
        text: "",
      },
      xAxis: {
        categories: data[`${type}_poe`].map((item) => {
          return item.rainfall;
        }),
      },
      yAxis: {
        title: {
          text: "Probability (%)",
        },
      },
      tooltip: {
        crosshairs: true,
        shared: true,
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        spline: {},
        pointPadding: 0,
        groupPadding: 0.2,
        pointWidth: 15,
        padding: 5,
      },
      series: [
        {
          name: "Rainfall (mm)",
          color: "#FA6400",
          data: data[`${type}_poe`].map((item) => {
            return item.probability;
          }),
        },
      ],
    };

    Highcharts.chart("chart-4", chartConfig);
    Highcharts.chart("elnino_prob_graph", chartConfig);
    Highcharts.chart("lanino_prob_graph", chartConfig);
  }

  function historic_rainfall_how_much_chart(data, type) {
    data[`${type}_rf_vals`].forEach(e => {e.color = e.range_match ? "#FFE27E" : "grey";});
    const chartConfig = {
      chart: {
        zoomType: "xy",
      },
      title: {
        text: "",
        align: "left",
      },
      subtitle: {
        text: "",
      },
      xAxis: [
        {
          categories: data[`${type}_rf_vals`].map((item) => {
            return item.year;
          }),
          crosshair: true,
        },
      ],
      yAxis: {
        title: {
          text: "Rainfall in mm",
        },
      },
      tooltip: {
        shared: true,
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        series: {
          pointPadding: 0,
          groupPadding: 0.2,
          pointWidth: 15,
          padding: 5,
        },
      },
      series: [
        {
          name: "Actual rainfall",
          type: "column",
          color: "#FFE27E",
          data: data[`${type}_rf_vals`].map((item) => ({
            y: item.rainfall,
            color: item.color,
          })),
        },
        {
          name: "Average rainfall",
          type: "spline",
          color: "#FA6400",
          data: Array(data[`${type}_rf_vals`].length).fill(
            data[`${type}_rf_stats`]["mean"]
          ),
        },
      ],
    };

    Highcharts.chart("chart-3", chartConfig);
    Highcharts.chart("chart_3", chartConfig);
    Highcharts.chart("chart_3_", chartConfig);
  }

  function how_much_gauge_graph(data, type) {
    let customTicks = [
      0,
      data.all_years_rf_stats.mean,
      data.all_years_rf_stats.mean * 2,
    ];

    let plotBands = [
      {
        from: 0,
        to: data.all_years_rf_stats.mean,
        color: "red",
        zIndex: -1,
      },
      {
        from: data.all_years_rf_stats.mean,
        to: data.all_years_rf_stats.mean * 2,
        color: "green",
        zIndex: -1,
      },
    ];

    const chartConfig = {
      chart: {
        type: "gauge",
        plotBackgroundColor: null,
        plotBackgroundImage: null,
        plotBorderWidth: 0,
        plotShadow: false,
      },
      credits: { enabled: true, text: this.selectedSource },
      exporting: { enabled: false },
      title: {
        text: current_circular_text(
          data.all_years_rf_stats.mean,
          data[`${type}_rf_stats`].mean
        ),
        style: {
          fontSize: "12px",
          fontWeight: "normal",
          marginTop: "25px",
        },
      },
      pane: {
        startAngle: -135,
        endAngle: 135,
        background: [],
      },
      yAxis: [
        {
          min: 0,
          max: data.all_years_rf_stats.mean * 2,

          minorTickInterval: null,
          tickPositions: customTicks,
          tickLength: 0,
          labels: {
            step: 1,
            distance: 15,
            style: {
              fontSize: "12px",
            },
            formatter: function () {},
          },
          title: {
            text: "",
          },
          plotBands: plotBands,
        },
      ],
      series: [
        {
          name: "Selected period's rainfall",
          data: [data[`${type}_rf_stats`].mean],
          color: "#69ccc3",
          tooltip: {
            valueSuffix: " mm",
          },
        },
      ],
    };

    Highcharts.chart("how_much_elnino_gauge", chartConfig);
    Highcharts.chart("how_much_lanino_gauge", chartConfig);
  }

  // $("#pills-tab .nav-link").click(function () {
  //   const tabId = $(this).attr("aria-controls");
  //   let data = {};
  //   if (tabId == "pills-Howmuch") {
  //     historic_rainfall_api(data, "/historic_yearly_rainfall");
  //   } else if (tabId == "pills-Howdry") {
  //     historic_how_dry_rainfall_api(data, "/historic_dry_spells");
  //   } else if (tabId == "pills-Howwet") {
  //     historic_how_wet_rainfall_api(data, "/historic_wet_spells");
  //   } else {
  //     historic_crop_stress_api(data, "/historic_crop_stress");
  //   }
  // });

  $("#historic_how_much_submit").on("click", function (e) {
    e.preventDefault();
    let data = {};
    const betweenOption = $("#historic_between_options").val();
    if (betweenOption == "months") {
      data.fromMonth = parseInt($("#filter-hrf-hm-m1").val());
      data.toMonth = parseInt($("#filter-hrf-hm-m2").val());
      (data.fromWeek = 0), (data.toWeek = 0);
    } else {
      data.fromWeek = parseInt($("#filter-hrf-hm-m1").val());
      data.toWeek = parseInt($("#filter-hrf-hm-m2").val());
      (data.fromMonth = 0), (data.toMonth = 0);
    }
    data.rfGte = parseInt($("#hrf_more_than").val());
    data.rfLt = parseInt($("#hrf_less_than").val());
    $("#loading-icon").show();
    historic_rainfall_api(data, "/historic_yearly_rainfall");
  });

  $("#apply-hrf-hd").on("click", function (e) {
    e.preventDefault();
    let data = {};
    data.fromWeek = parseInt($("#filter-hrf-hd-w1").val());
    data.toWeek = parseInt($("#filter-hrf-hd-w2").val());
    data.rfLt = parseInt($("#filter-hrf-hd-lt").val());
    $("#loading-icon").show();
    historic_how_dry_rainfall_api(data, "/historic_dry_spells");
  });

  $("#apply-hrf-wet-hd").on("click", function (e) {
    e.preventDefault();
    let data = {};
    data.fromWeek = parseInt($("#filter-hrf-hd-wet1").val());
    data.toWeek = parseInt($("#filter-hrf-hd-wet2").val());
    data.rfGte = parseInt($("#filter-hrf-hd-wet-mt").val());
    $("#loading-icon").show();
    historic_how_wet_rainfall_api(data, "/historic_wet_spells");
  });

  $("#apply-hrf-cs").on("click", function (e) {
    e.preventDefault();
    let data = {};
    data.fromWeek = parseInt($("#filter-hrf-cs-w1").val());
    data.cropId = parseInt($("#filter-hrf-cs-crop").val());
    data.rfLt = parseInt($("#filter-hrf-cs-lt").val());
    (data.districtId = districtSelect.val()),
      (data.dataSrcId = historic_radio_value),
      $("#loading-icon").show();
    historic_crop_stress_api(data, "/historic_crop_stress");
  });

  function historic_rainfall_api(data, url_) {
    let forecast_payload = {
      districtId: districtSelect.val(),
      dataSrcId: historic_radio_value,
      fromMonth: parseInt(data.fromMonth, 10) || 0,
      toMonth: parseInt(data.toMonth, 10) || 0,
      toWeek: parseInt(data.toWeek, 10) || 0,
      rfGte: parseFloat(data.rfGte) || 0,
      rfLt: parseFloat(data.rfLt) || 0,
      fromWeek: parseInt(data.fromWeek, 10) || 0,
    };
    forecast_payload = replaceEmptyWithZero(forecast_payload);

    $.ajax({
      type: "POST",
      url: `${weatherApiUrl}${url_}`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
      success: function (response) {
        historic_rainfall_how_much_data = response.data;
                $("#loading-icon").hide();
        check_which_history_how_much();
      },
    });
  }

  function check_which_history_how_much() {
    const activeButton = $("#how_much_historic .nav-link.active");
    const activeTarget = activeButton.attr("data-bs-target");
    if (activeTarget === "#hrf-hm-all") {
      historic_rainfall_how_much_chart(
        historic_rainfall_how_much_data,
        "all_years"
      );
      historic_rainfall_how_much_probability_chart(
        historic_rainfall_how_much_data,
        "all_years"
      );

      var html = "";
      html += "<tr>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.all_years_rf_stats.count +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.all_years_rf_stats.min +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.all_years_rf_stats.max +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.all_years_rf_stats.mean +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.all_years_rf_stats.cov +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.all_years_rf_stats.std_dev +
        "</td>";
      html += "</tr>";
      $("#table-hrf-hm-all-st tbody").html(html);
    } else if (activeTarget === "#hrf-hm-elnino") {
      historic_rainfall_how_much_chart(
        historic_rainfall_how_much_data,
        "elnino_year"
      );
      historic_rainfall_how_much_probability_chart(
        historic_rainfall_how_much_data,
        "elnino_years"
      );
      how_much_gauge_graph(
        historic_rainfall_how_much_data,
        "elnino_year"
      );

      var html = "";
      html += "<tr>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.elnino_year_rf_stats.count +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.elnino_year_rf_stats.min +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.elnino_year_rf_stats.max +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.elnino_year_rf_stats.mean +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.elnino_year_rf_stats.cov +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.elnino_year_rf_stats.std_dev +
        "</td>";
      html += "</tr>";
      $("#table-hrf-hm-elnino-st tbody").html(html);
    } else if (activeTarget === "#hrf-hm-lanina") {
      historic_rainfall_how_much_chart(
        historic_rainfall_how_much_data,
        "lanina_year"
      );
      historic_rainfall_how_much_probability_chart(
        historic_rainfall_how_much_data,
        "lanina_years"
      );
      how_much_gauge_graph(
        historic_rainfall_how_much_data,
        "lanina_year"
      );

      var html = "";
      html += "<tr>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.lanina_year_rf_stats.count +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.lanina_year_rf_stats.min +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.lanina_year_rf_stats.max +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.lanina_year_rf_stats.mean +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.lanina_year_rf_stats.cov +
        "</td>";
      html +=
        "<td>" +
        historic_rainfall_how_much_data.lanina_year_rf_stats.std_dev +
        "</td>";
      html += "</tr>";
      $("#table-hrf-hm-lanina-st tbody").html(html);
    }
  }

  $("#how_much_historic li button").click(function () {
    check_which_history_how_much();
  });

  function replaceEmptyWithZero(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (
          obj[key] === null ||
          obj[key] === undefined ||
          isNaN(obj[key])
        ) {
          obj[key] = 0;
        }
      }
    }
    return obj;
  }

  function current_circular_text(value1, value2) {
    const difference = value1 - value2;
    const percentage = (Math.abs(difference) / value2) * 100;
    let result = "";
    if (difference > 0) {
      result = `${percentage.toFixed(2)}% greater than all year mean`;
    } else if (difference < 0) {
      result = `${percentage.toFixed(2)}% less than all year mean`;
    } else {
      result = "equal to all year mean";
    }
    return result;
  }

  function historic_table_rainfall(tableData, table_id) {
    let vertCell = "writing-mode: tb-rl; transform: rotate(-180deg);";
    let weekHeader = tableData.week_rf_probabilities
      .map((e) => `<td class="text-white">${e.week}</td>`)
      .join("");
    let weekTextHeader = tableData.week_rf_probabilities
      .map(
        (e) =>
          `<td class="text-white" style="${vertCell}"><small>${e.week_text}</small></td>`
      )
      .join("");
    let probabilityHeader = tableData.week_rf_probabilities
      .map(
        (e) => `<td class="text-white">${Math.round(e.probability)}</td>`
      )
      .join("");
    let tableHeader = `<thead style="top: 0; position: sticky; inset-block-start: 0;">
            <tr style="background-color: #07689c;">
              <td class="text-white" rowspan="2">Year/Met week</td>
              <td class="text-white" rowspan="2">ENSO Type</td>
              <td class="text-white" rowspan="2">Number of dry weeks</td>
              <td class="text-white" rowspan="2">Longest dry period (weeks)</td>
              ${weekHeader}
            </tr>
            <tr style="background-color: #07689c;">${weekTextHeader}</tr>
            <tr style="background-color: #07689c;"><td class="text-white" colspan="4">Probability (%)</td>${probabilityHeader}</tr>
          </thead>`;

    let allYearsList = Array.from(
      new Set(tableData.week_year_rf_vals.map((e) => e.year))
    );
    allYearsList.sort((a, b) => (a > b ? -1 : 0));
    let tableBody =
      `<tbody>` +
      allYearsList
        .map((yr) => {
          let yrRF = tableData.week_year_rf_vals
            .filter((e) => e.year == yr)
            .map((e, i) => {
              return { wi: i + 1, ...e };
            });
          let yrDws = tableData.week_year_rf_vals.filter(
            (e) => e.year == yr && e.range_match
          );
          let yrEnso = tableData.week_year_rf_vals.filter(
            (e) => e.year == yr
          )[0].enso;
          let dryWeeks = yrRF
            .filter((e) => e.range_match)
            .map((e) => {
              return { wi: e.wi, week: e.week };
            });
          let dryPeriodsFn = (arr, expected = 0, group = []) =>
            arr
              .reduce(
                (acc, c, i) => (
                  c === expected
                    ? (group.push(c), expected++)
                    : (acc.push(group), (group = [c]), (expected = ++c)),
                  i === arr.length - 1 && acc.push(group),
                  acc
                ),
                []
              )
              .filter((e) => e.length);
          let dryPeriods = dryPeriodsFn(dryWeeks.map((a) => a.wi));
          dryPeriods.sort((a, b) => (a.length > b.length ? -1 : 0));
          const findWeekByIndex = (dryPeriod) => {
            let fromWk = dryWeeks.find(
              (a) => a.wi == Math.min(...dryPeriod)
            ).week;
            let toWk = dryWeeks.find(
              (a) => a.wi == Math.max(...dryPeriod)
            ).week;
            return `<small>${fromWk} to ${toWk}</small>`;
          };
          let longestDryPeriod = dryPeriods.length
            ? findWeekByIndex(dryPeriods[0])
            : `<small>N/A</small>`;
          let yrRFRow =
            `<tr><th>${yr}</th><th><small>${yrEnso}</small></th><td>${yrDws.length}</td><td>${longestDryPeriod}</td>` +
            yrRF
              .map((e) => {
                return e.range_match && table_id == "table#table-hrf-hd"
                  ? `<th style="color: red; background-color:pink">${int(
                      e.rainfall
                    )}</th>`
                  : e.range_match && table_id == "table#table-hrf-hw"
                  ? `<th style="color: green; background-color: lightgreen">${int(
                      e.rainfall
                    )}</th>`
                  : `<td>${int(e.rainfall)}</td>`;
              })
              .join("") +
            `</tr>`;
          return yrRFRow;
        })
        .join("") +
      `</tbody>`;
    $(table_id)
      .empty()
      .html(tableHeader + tableBody);
  }

  const int = (num) => (!isNaN(num) ? Number(parseInt(num)) : null);

  function historic_how_dry_rainfall_api(data, url_) {
    let forecast_payload = {
      districtId: districtSelect.val(),
      dataSrcId: historic_radio_value,
      toWeek: parseInt(data.toWeek, 10) || 3,
      rfLt: parseFloat(data.rfLt) || 500,
      fromWeek: parseInt(data.fromWeek, 10) || 1,
    };
    forecast_payload = replaceEmptyWithZero(forecast_payload);

    $.ajax({
      type: "POST",
      url: `${weatherApiUrl}${url_}`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
      success: function (response) {
        historic_rainfall_how_dry = response.data;
        $("#loading-icon").hide();
        historic_table_rainfall(
          historic_rainfall_how_dry,
          `table#table-hrf-hd`
        );
      },
    });
  }

  function historic_how_wet_rainfall_api(data, url_) {
    let forecast_payload = {
      districtId: districtSelect.val(),
      dataSrcId: historic_radio_value,
      toWeek: parseInt(data.toWeek, 10) || 3,
      rfGte: parseFloat(data.rfGte) || 10,
      fromWeek: parseInt(data.fromWeek, 10) || 1,
    };
    forecast_payload = replaceEmptyWithZero(forecast_payload);
    $.ajax({
      type: "POST",
      url: `${weatherApiUrl}${url_}`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
      success: function (response) {
        $("#loading-icon").hide();
        historic_table_rainfall(response.data, `table#table-hrf-hw`);
      },
    });
  }

  function historic_crop_stress_api(data, url_) {
    let forecast_payload = {
      cropId: 1,
      districtId: districtSelect.val(),
      dataSrcId: historic_radio_value,
      rfLt: parseFloat(data.rfLt) || 500,
      fromWeek: parseInt(data.fromWeek, 10) || 1,
    };
    forecast_payload = replaceEmptyWithZero(forecast_payload);
    $.ajax({
      type: "POST",
      url: `${weatherApiUrl}${url_}`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
      success: function (response) {
        $("#loading-icon").hide();
        generate_crop_stress_table(response.data, `table#table-hrf-cs`);
      },
    });
  }

  function generate_crop_stress_table(tableData, table_id) {
    let sowStages = Array.from(
      new Set(tableData.week_rf_probabilities.map((e) => e.stage))
    );
    let sowStageHead =
      `<tr style="background-color: #07689c;"><th class="text-white">Crop Stage</th>` +
      sowStages
        .map((s) => {
          let stageSpan = tableData.week_rf_probabilities.filter(
            (t) => t.stage == s
          ).length;
          return `<th  class="text-white" colspan="${stageSpan}">${s}</th>`;
        })
        .join("") +
      `</tr>`;
    let weekHead =
      `<tr style="background-color: #07689c;"><th class="text-white">Met Week</th>` +
      tableData.week_rf_probabilities.map(
        (e) => `<th class="text-white">${e.week}</th>`
      ) +
      `</tr>`;
    let weekTextHead =
      `<tr style="background-color: #07689c;"><th class="text-white">(During)</th>` +
      tableData.week_rf_probabilities.map(
        (e) => `<th class="text-white"><small>${e.week_text}</small></th>`
      ) +
      `</tr>`;
    let tableHead = `<thead>${sowStageHead}${weekHead}${weekTextHead}</thead>`;
    let tableBody =
      `<tbody><tr><th>Probability (%)</th>` +
      tableData.week_rf_probabilities
        .map((t) => {
          return t.prob_match
            ? `<th style="background-color:pink; color:red;">${Math.round(
                t.probability
              )}</th>`
            : `<th style="background-color:lightgreen; color:green;">${Math.round(
                t.probability
              )}</th>`;
        })
        .join("") +
      `</tr></tbody>`;
    $(table_id).empty().html(`${tableHead}${tableBody}`);
  }

  // historic temperature logic
  historic_temp_options_api()

  $("#historic_temp_between_options").change(function () {
    historic_temp_options_api();
  });  

  function historic_temp_options_api() {
    let selectedOption = $("#historic_temp_between_options").val();
    const fromLabel = $("#temp-from-label_1");
    const toLabel = $("#temp-to-label_1");
    const fromMonthSelect = $("#filter-hrf-temp-m1");
    const toMonthSelect = $("#filter-hrf-temp-m2");

    if (selectedOption === "months") {
      fromLabel.text("From Month");
      toLabel.text("To Month");
      fromMonthSelect.show();
      toMonthSelect.show();
    } else {
      fromLabel.text("From Week");
      toLabel.text("To Week");
      fromMonthSelect.show();
      toMonthSelect.show();
    }

    let text_ = selectedOption === "months" ? "month" : "week";
    $.ajax({
      url: `${weatherApiUrl}/${selectedOption}`,
      method: "GET",
      success: function (response) {
        updateSelectOptions(fromMonthSelect, response.data, text_);
        updateSelectOptions(toMonthSelect, response.data, text_);
      },
    });
  } 

  $("#historic_temp_submit").on("click", function (e) {
    e.preventDefault();
    let data = {};
    const betweenOption = $("#historic_temp_between_options").val();
    if (betweenOption == "months") {
      data.fromMonth = parseInt($("#filter-hrf-temp-m1").val());
      data.toMonth = parseInt($("#filter-hrf-temp-m2").val());
      (data.fromWeek = 0), (data.toWeek = 0);
    } else {
      data.fromWeek = parseInt($("#filter-hrf-temp-m1").val());
      data.toWeek = parseInt($("#filter-hrf-temp-m2").val());
      (data.fromMonth = 0), (data.toMonth = 0);
    }
    $("#loading-icon").show();
    historic_temp_weather_api(data, "/historic_yearly_temperature");
  });

  function historic_temp_weather_api(data, url_){
    let forecast_payload = {
      districtId: parseInt(districtSelect.val()),
      dataSrcId: "3",
      toWeek: parseInt(data.toWeek, 10) || 52,
      fromWeek: parseInt(data.fromWeek, 10) || 1,
      toMonth: parseInt(data.toMonth, 10) || 12,
      fromMonth: parseInt(data.fromMonth, 10) || 1,
    };
    forecast_payload = replaceEmptyWithZero(forecast_payload);

    $.ajax({
      type: "POST",
      url: `${weatherApiUrl}${url_}`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
      success: function (response) {
        $("#loading-icon").hide();    
        let data = response.data;
        drawHTMBar("hist_avg_temp_chart", data.yearly_temps, "3");
        // drawHTMBarTable("hist_avg_temp_table", data.yearly_temps, "3"); 
        drawHTMTable("hist_avg_temp_table", [data.max_temp_stats, data.min_temp_stats, data.avg_temp_stats]);
      },
    });

  }

  function drawHTMBar(container, chartData, dataSrc) {
    if (chartData.length) {
      let chart = Highcharts.chart(container, {
        chart: { zoomType: "xy" },
        title: { text: "" },
        subtitle: { text: "" },
        credits: { enabled: true, text: dataSrc },
        xAxis: {
          categories: chartData.map((e) => e.year),
          crosshair: true,
          title: { text: "Year" },
        },
        yAxis: [
          {
            labels: { format: "{value}" },
            title: { text: "Temperature (°C)" },
          },
          { title: { text: "" }, opposite: false },
          { title: { text: "" }, opposite: false },
        ],
        tooltip: { shared: true },
        credits: {
          enabled: false,
        },
        series: [
          {
            name: "Maximum Temperature",
            type: "column",
            color: "orange",
            tooltip: { valueSuffix: " °C" },
            data: chartData.map((e) => e.max_temp),
          },
          {
            name: "Mininum Temperature",
            type: "column",
            color: "lightblue",
            tooltip: { valueSuffix: " °C" },
            data: chartData.map((e) => e.min_temp),
          },
          {
            name: "Average Temperature",
            type: "spline",
            color: "black",
            tooltip: { valueSuffix: " °C" },
            data: chartData.map((e) => e.avg_temp),
          },
        ],
      });
      $(`#dwn-${container}`).on("click", () =>
        chart.exportChart({ filename: `${district}-allyear-temperature` })
      );
    } else {
      $(`#${container}`)
        .empty()
        .html(
          `<div class="text-center my-3">Unavailable data from the source</div>`
        );
    }
  }

  function drawHTMBarTable(container, tableData) {
    if (tableData.length) {
      let tableHead =
        `<thead><tr style="background-color: #05336b;">` +
        Object.keys(tableData[0])
          .map((e) => `<th class="text-white">${e}</th>`)
          .join("") +
        `</tr></thead>`;
      let tableBody =
        `<tbody>` +
        tableData.map(
          (e) =>
            `<tr>` +
            Object.values(e)
              .map((f) => `<td>${f}</td>`)
              .join("") +
            `</tr>`
        ) +
        `</tbody>`;
      $(`#${container}`).html(`${tableHead}${tableBody}`);
    } else {
      $(`#${container}`).html(`<thead></thead><tbody></tbody>`);
    }
  }

  
function drawHTMTable(container, tableData){
  let tableHead = `<thead><tr style="background-color: #05336b;">
      <th class="text-white">Variable</th>
      <th class="text-white">Number of years</th>
      <th class="text-white">Min</th>
      <th class="text-white">Max</th>
      <th class="text-white">Mean</th>
      <th class="text-white">Standard Deviation</th>
      <th class="text-white">CV (%)</th></tr></thead>
  `;
  let tableBody = `<tbody>
      <tr><td>Maximum Temperature</td><td>${tableData[0].count}</td><td>${tableData[0].min}</td><td>${tableData[0].max}</td><td>${tableData[0].mean}</td><td>${tableData[0].std_dev}</td><td>${tableData[0].cov}</td></tr>
      <tr><td>Minimum Temperature</td><td>${tableData[1].count}</td><td>${tableData[1].min}</td><td>${tableData[1].max}</td><td>${tableData[1].mean}</td><td>${tableData[1].std_dev}</td><td>${tableData[1].cov}</td></tr>
      <tr><td>Average Temperature</td><td>${tableData[2].count}</td><td>${tableData[2].min}</td><td>${tableData[2].max}</td><td>${tableData[2].mean}</td><td>${tableData[2].std_dev}</td><td>${tableData[2].cov}</td></tr>
  </tbody>`
  $(`#${container}`).empty().html(tableHead+tableBody);
}
});