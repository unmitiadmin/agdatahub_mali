
$(document).ready(function () {
  $("#submit-ward").click(function (e) {
    e.preventDefault();
    weather_current_rainfall_api();
  });

  $("input[name='currentRainfall_radio']").on("change", function () {
    const value = $(this).val();
    $("#loading-icon").show();
    weather_current_rainfall_api(value);
  });

  // $("#item-id-2").on("click", function () {
  //   $("#loading-icon").show();
  //   weather_current_rainfall_api();
  // });

  $("#current_rainfall_submit").click(function () {
    $("#loading-icon").show();
    weather_current_rainfall_api();
  });

  function weather_current_rainfall_api(value_ = "1") {
    let from_value = 0;
    let to_value = 0;
    if (selectedOption != "days") {
      from_value = $("#filter-crf-hm-m1").val();
      to_value = $("#filter-crf-hm-m2").val();
    } else {
      from_value = $("#from-date").val();
      to_value = $("#to-date").val();
    }
    let type_ =
      selectedOption == "weeks"
        ? "weekly"
        : selectedOption == "months"
        ? "monthly"
        : "daily";
    let from_ =
      selectedOption == "weeks"
        ? "Week"
        : selectedOption == "months"
        ? "Month"
        : "Date";
    let forecast_payload = {
      districtId: districtSelect.val(),
      dataSrcId: value_,
      ["from" + from_]: from_value,
      ["to" + from_]: to_value,
    };

    forecast_payload = replaceEmptyWithZero(forecast_payload);

    var request1 = $.ajax({
      type: "POST",
      url: `${weatherApiUrl}/current_${type_}_rainfall`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
    });

    var request2 = $.ajax({
      type: "POST",
      url: `${weatherApiUrl}/historic_${type_}_rainfall`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
    });

    $.when(request1, request2).then(function (response1, response2) {
      var data1 = response1[0].data;
      var data2 = response2[0].data;
      current_rainfall_charts(data1, data2);
      $("#loading-icon").hide();
    });
  }

  function current_rainfall_charts(response, response2) {
    Highcharts.chart("current_rainfall_bar_line_chart", {
      chart: {
        type: "column",
      },
      title: {
        text: "",
      },
      subtitle: {
        text: "",
      },
      xAxis: {
        categories: response.monthly_rf_vals?.map((item) => {
          return item.month_text;
        }),
        crosshair: true,
      },
      credit: {
        enabled: false,
      },
      yAxis: {
        min: 0,
        title: {
          text: "Rainfall ",
        },
      },
      tooltip: {
        headerFormat:
          '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat:
          '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
          '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
        footerFormat: "</table>",
        shared: true,
        useHTML: true,
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
        },
      },
      series: [
        {
          name: "Mean Rainfall",
          type: "line",
          data: response.monthly_rf_vals?.map((item) => {
            return item.mean_rf;
          }),
        },
        {
          name: "Cumulative Rainfall",
          type: "line",
          data: response.monthly_rf_vals?.map((item) => {
            return item.cumulative_rf;
          }),
        },
        {
          name: "Rainfall",
          data: response.monthly_rf_vals?.map((item) => {
            return item.rainfall;
          }),
        },
      ],
    });

    let customTicks =
      response.monthly_rf_stats.total > response2.hist_rf_avg * 2
        ? [
            0,
            response2.hist_rf_avg,
            response2.hist_rf_avg * 2,
            response2.hist_rf_avg * 3,
          ]
        : [0, response2.hist_rf_avg, response2.hist_rf_avg * 2];

    let plotBands =
      response.monthly_rf_stats.total > response2.hist_rf_avg * 2
        ? [
            {
              from: 0,
              to: response2.hist_rf_avg,
              color: "red",
              zIndex: -1,
            },
            {
              from: response2.hist_rf_avg,
              to: response2.hist_rf_avg * 2,
              color: "orange",
              zIndex: -1,
            },
            {
              from: response2.hist_rf_avg * 2,
              to: response2.hist_rf_avg * 3,
              color: "green",
              zIndex: -1,
            },
          ]
        : [
            {
              from: 0,
              to: response2.hist_rf_avg,
              color: "red",
              zIndex: -1,
            },
            {
              from: response2.hist_rf_avg,
              to: response2.hist_rf_avg * 2,
              color: "green",
              zIndex: -1,
            },
          ];

    Highcharts.chart("current_rainfall_circular_chart", {
      chart: {
        type: "gauge",
        plotBackgroundColor: null,
        plotBackgroundImage: null,
        plotBorderWidth: 0,
        plotShadow: false,
      },
      credits: { enabled: true, text: this.selectedSource },
      // exporting: { enabled: false },
      title: {
        text: current_circular_text(
          response.monthly_rf_stats.total,
          response2.hist_rf_avg
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
          max:
            response2.hist_rf_avg *
            (response.monthly_rf_stats.total > response2.hist_rf_avg * 2
              ? 3
              : 2),

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
          data: [response.monthly_rf_stats.total],
          color: "#69ccc3",
          tooltip: {
            valueSuffix: " mm",
          },
        },
      ],
    });

    var html = "";
    html += "<tr>";
    html += "<td>" + response.monthly_rf_stats.count + "</td>";
    html += "<td>" + response.monthly_rf_stats.min + "</td>";
    html += "<td>" + response.monthly_rf_stats.max + "</td>";
    html += "<td>" + response.monthly_rf_stats.mean + "</td>";
    html += "<td>" + response.monthly_rf_stats.total + "</td>";
    html += "<td>" + response.monthly_rf_stats.cov + "</td>";
    html += "<td>" + response.monthly_rf_stats.std_dev + "</td>";
    html += "</tr>";

    $("#table-crf-hm-st tbody").html(html);
  }

  function current_circular_text(value1, value2) {
    const difference = value1 - value2;
    const percentage = (Math.abs(difference) / value2) * 100;
    let result = "";

    if (difference > 0) {
      result = `${percentage.toFixed(2)}% greater than last 30 years avg`;
    } else if (difference < 0) {
      result = `${percentage.toFixed(2)}% less than last 30 years avg`;
    } else {
      result = "equal to last 30 years avg";
    }

    const finalResult = `${result}<br>(Historical average being ${value2})`;

    return finalResult;
  }

  $("#current_rainfall_options").change(function () {
    current_rainfall_weather_api();
  });

  current_rainfall_weather_api();

  function current_rainfall_weather_api() {
    selectedOption = $("#current_rainfall_options").val();

    const fromLabel = $("#from-label");
    const toLabel = $("#to-label");
    const graphlabel = $('#crf-hm-temporal-label')

    if (selectedOption === "months") {
      fromLabel.text("From Month");
      toLabel.text("To Month");
      $("#from-date, #to-date").show();
    }
    const fromMonthSelect = $("#filter-crf-hm-m1");
    const toMonthSelect = $("#filter-crf-hm-m2");

    if (selectedOption === "months") {
      fromLabel.text("From Month");
      toLabel.text("To Month");
      graphlabel.text("Monthly rainfall for the current year")
      fromMonthSelect.show();
      toMonthSelect.show();
      $("#from-date, #to-date").hide();
    } else if (selectedOption === "weeks") {
      fromLabel.text("From Week");
      toLabel.text("To Week");
      graphlabel.text("Weekly rainfall for the current year")
      fromMonthSelect.show();
      toMonthSelect.show();
      $("#from-date, #to-date").hide();
    } else {
      fromLabel.text("From Date");
      toLabel.text("To Date");
      fromMonthSelect.hide();
      toMonthSelect.hide();
      graphlabel.text("Daily rainfall for the current year")
      $("#from-date, #to-date").show();
    }

    if (selectedOption === "months" || selectedOption === "weeks") {
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

  function replaceEmptyWithZero(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (
          obj[key] === null ||
          obj[key] === undefined ||
          isNaN(obj[key]) ||
          obj[key] === ""
        ) {
          obj[key] = 0;
        }
      }
    }
    return obj;
  }
});