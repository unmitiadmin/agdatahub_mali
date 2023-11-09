
$(document).ready(function () {
  $("#submit-ward").click(function (e) {
    e.preventDefault();
    let district = districtSelect.val();
    if (district == "") {
      alert("Please select your district");
      $("#loading-icon").hide();
      return;
    }
    $("#notice").hide();
    $("#non-notice").show();
    $("#loading-icon").show();
    const ward = $("#ward-input").val();
    forecast_short_range_tomorrow_api();
    forecast_short_range_GFS_api();
    forecast_medium_range_iri_cfs_api();
    forecast_medium_range_iri_esrl_api();
    forecast_medium_range_iri_gfs_api();
    forecast_temperature_api();
  });

  function forecast_short_range_tomorrow_api() {
    let forecast_payload = {
      districtId: districtSelect.val(),
      dataSrcId: "4",
    };
    $.ajax({
      type: "POST",
      url: `${weatherApiUrl}/forecast_collective`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
      success: (response) => {
        forecast_data = response.data;
        forecast_precipitation_chart();
        forecast_temperature_chart();
        const data = response.data;
        const container = $("#climate-temperature");
        container.empty();
        data.forEach(function (item) {
          const card = $(
            "<div class='card card-shadow ms-1 me-1 mt-1 mb-1 p-3'></div>"
          );
          card.html(`
    <p style="text-align: center">
      <img src="assets/images/tomorrownow-icons/${
        item.weather_code
      }.png" title="Clear, Sunny">
    </p>
    <p class="mb-2 mt-2"><b>Date: ${item.date}</b></p>
    <p class="mb-0 box-details"><b>Min Temp:</b> ${item.temp_min} °C</p>
    <p class="mb-0 box-details"><b>Max Temp:</b> ${item.temp_max} °C</p>
    <p class="mb-0 box-details"><b>Precipitation:</b> ${
      item.rainfall_chance
    }%</p>
    <p class="mb-0 box-details"><b>Rainfall:</b> ${
      item.rainfall ?? 0
    } mm</p>
    <p class="mb-0 box-details"><b>Humidity:</b> ${item.humidity}%</p>
    <p class="mb-0 box-details"><b>Wind Speed:</b> ${
      item.wind_speed
    } m/s</p>
  `);
          container.append(card);
        });
        $("#loading-icon").hide();
      },
    });
  }

  function forecast_short_range_GFS_api() {
    let forecast_payload = {
      districtId: districtSelect.val(),
      dataSrcId: "5",
    };
    $.ajax({
      type: "POST",
      url: `${weatherApiUrl}/forecast_collective`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
      success: (response) => {
        forecast_gfs_data = response.data;
        forecast_rainfall_chart(
          "GFS_rainfall_forecast",
          forecast_gfs_data
        );
        const data = response.data;
        const container1 = $("#climate-gfs");
        container1.empty();
        data.forEach(function (item) {
          const card1 = $(
            "<div class='card card-shadow ms-1 me-1 mt-1 mb-1 p-3' style='background-color: #dffffc33'></div>"
          );
          card1.html(`
    <p class="mb-2 mt-1"><b>Date: ${item.date}</b></p>
    <p class=""><b>Rainfall: ${
      Math.round(item.rainfall * 100) / 100
    } mm</b></p>
    `);
          container1.append(card1);
        });
      },
    });
  }

  function forecast_temperature_api() {
    let forecast_payload = {
      districtId: districtSelect.val(),
      dataSrcId: "4",
    };
    $.ajax({
      type: "POST",
      url: `${weatherApiUrl}/forecast_temperature`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
      success: (response) => {
        let tempe_data = response.data;

        Highcharts.chart("temperature-forecast", {
          chart: {
            type: "column",
          },
          title: {
            text: "",
          },
          xAxis: {
            categories: tempe_data.map((item) => item["date"]),
          },
          yAxis: {
            title: {
              text: "Temperature (°C)",
            },
          },
          credits: {
            enabled: false,
          },
          plotOptions: {
            column: {
              borderRadius: "25%",
            },
          },
          series: [
            {
              name: "Max Temperature",
              color: "#ffa500",
              data: tempe_data.map((item) => item["temp_max"]),
            },
            {
              name: "Min Temperature",
              color: "#add8e6",
              data: tempe_data.map((item) => item["temp_min"]),
            },
          ],
        });
      },
    });
  }

  $("input[name='short_range_radio']").on("click", function () {
    selected_short_range = $("input[name='short_range_radio']:checked");
    if (selected_short_range.length > 0) {
      const selectedValue = selected_short_range.val();
      $(`#content${selectedValue}`).show();
    }
  });

  $("input[name='short_range_radio']").each(function () {
    selected_short_range = $("input[name='short_range_radio']:checked");
    if (selected_short_range.length > 0) {
      const selectedValue = selected_short_range.val();
      $(`#content${selectedValue}`).show();
    }
  });

  $("input[name='short_range_radio']").on("change", function () {
    $(".content").hide();
    const value = $(this).val();
    $(`#content${value}`).show();
  });

  $("#item-id-0").on("click", function () {
    selected_short_range = $("input[name='short_range_radio']:checked");
    if (selected_short_range.length > 0) {
      const selectedValue = selected_short_range.val();
      $(`#content${selectedValue}`).show();
    }
  });

  $("input[name='medium_range_radio']").on("click", function () {
    selected_medium_range = $("input[name='medium_range_radio']:checked");
    if (selected_medium_range.length > 0) {
      const selectedValue = selected_medium_range.val();
      $(`#content${selectedValue}`).show();
    }
  });

  $("input[name='medium_range_radio']").each(function () {
    selected_medium_range = $("input[name='medium_range_radio']:checked");
    if (selected_medium_range.length > 0) {
      const selectedValue = selected_medium_range.val();
      $(`#content${selectedValue}`).show();
    }
  });

  $("input[name='medium_range_radio']").on("change", function () {
    $(".content").hide();
    const value = $(this).val();
    $(`#content${value}`).show();
  });

  $("#item-id-1").on("click", function () {
    selected_medium_range = $("input[name='medium_range_radio']:checked");
    if (selected_medium_range.length > 0) {
      const selectedValue = selected_medium_range.val();
      $(`#content${selectedValue}`).show();
    }
  });

  function forecast_medium_range_iri_cfs_api() {
    let forecast_payload = {
      districtId: districtSelect.val(),
      dataSrcId: "6",
    };
    $.ajax({
      type: "POST",
      url: `${weatherApiUrl}/forecast_collective`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
      success: (response) => {
        forecast_iri_cfs_data = response.data;
        forecast_rainfall_chart(
          "iri_cfs_rainfall_forecast",
          forecast_iri_cfs_data
        );
        const data = response.data;
        const container = $("#climate-iri-cfs");
        container.empty();
        data.forEach(function (item) {
          const card = $(
            "<div class='card card-shadow ms-1 me-1 mt-1 mb-1 p-3' style='background-color: #dffffc33'></div>"
          );
          card.html(`
    <p class="mb-2 mt-1"><b>Date: ${item.date}</b></p>
    <p class=""><b>Rainfall: ${
      Math.round(item.rainfall * 100) / 100
    } mm</b></p>
    `);
          container.append(card);
        });
      },
    });
  }

  function forecast_medium_range_iri_esrl_api() {
    let forecast_payload = {
      districtId: districtSelect.val(),
      dataSrcId: "7",
    };
    $.ajax({
      type: "POST",
      url: `${weatherApiUrl}/forecast_collective`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
      success: (response) => {
        forecast_iri_esrl_data = response.data;
        forecast_rainfall_chart(
          "iri_esrl_rainfall_forecast",
          forecast_iri_esrl_data
        );
        const data = response.data;
        const container = $("#climate-iri-esrl");
        container.empty();
        data.forEach(function (item) {
          const card = $(
            "<div class='card card-shadow ms-1 me-1 mt-1 mb-1 p-3' style='background-color: #dffffc33'></div>"
          );
          card.html(`
      <p class="mb-2 mt-1"><b>Date: ${item.date}</b></p>
      <p class=""><b>Rainfall: ${
        Math.round(item.rainfall * 100) / 100
      } mm</b></p>
  `);
          container.append(card);
        });
      },
    });
  }

  function forecast_medium_range_iri_gfs_api() {
    let forecast_payload = {
      districtId: districtSelect.val(),
      dataSrcId: "8",
    };
    $.ajax({
      type: "POST",
      url: `${weatherApiUrl}/forecast_collective`,
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(forecast_payload),
      success: (response) => {
        forecast_iri_gfs_data = response.data;
        forecast_rainfall_chart(
          "iri_gfs_rainfall_forecast",
          forecast_iri_gfs_data
        );
        const data = response.data;
        const container = $("#climate-iri-gfs");
        container.empty();
        data.forEach(function (item) {
          const card = $(
            "<div class='card card-shadow ms-1 me-1 mt-1 mb-1 p-3' style='background-color: #dffffc33'></div>"
          );
          card.html(`
      <p class="mb-2 mt-1"><b>Date: ${item.date}</b></p>
      <p class=""><b>Rainfall: ${
        Math.round(item.rainfall * 100) / 100
      } mm</b></p>
  `);
          container.append(card);
        });
      },
    });
  }

  $("#from-date, #to-date").hide();

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

  function forecast_rainfall_chart(chart_name, forecast_data) {
    Highcharts.chart(chart_name, {
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
        categories: forecast_dates(forecast_data),
        crosshair: true,
      },
      yAxis: {
        min: 0,
        title: {
          text: "Rainfall (mm)",
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
          name: "Rainfall",
          color: "#F2A422",
          data: forecast_rainfall_info(forecast_data),
        },
      ],
    });
  }

  function forecast_dates(forecast_data) {
    return forecast_data.map((item) => {
      return item.date;
    });
  }

  function forecast_rainfall_info(forecast_data) {
    return forecast_data.map((item) => {
      return item.rainfall;
    });
  }

  function forecast_temperature_chart() {
    Highcharts.chart("temparature-forecast", {
      title: {
        text: "",
        align: "left",
      },
      subtitle: {
        text: "",
      },
      yAxis: {
        title: {
          text: "Temperature in  degrees",
        },
      },
      exporting: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        series: {
          label: {
            connectorAllowed: true,
          },
        },
      },
      series: [
        {
          name: "Max temperature",
          color: "#fa6400",
          data: forecast_data.map((item) => {
            return [item.date, item.temp_max];
          }),
        },
        {
          name: "Min temperature",
          color: "#ffe27e",
          data: forecast_data.map((item) => {
            return [item.date, item.temp_min];
          }),
        },
      ],
    });
  }

  function forecast_precipitation_chart() {
    Highcharts.chart("precipitation-forecast", {
      title: {
        text: "",
        align: "left",
      },
      subtitle: {
        text: "",
      },
      yAxis: {
        title: {
          text: "Rainfall unit (mm)",
        },
      },
      plotOptions: {
        series: {
          label: {
            connectorAllowed: true,
          },
        },
      },
      exporting: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      tooltip: {
        formatter: function () {
          var date = Highcharts.dateFormat(
            "%Y-%m-%d",
            this.points[0].point.x
          );

          var tooltipContent = "";
          this.points.forEach(function (point) {
            tooltipContent = "<b>Date:</b> " + point.key + "<br>";

            tooltipContent +=
              "<b>" + point.series.name + ":</b> " + point.y + " mm<br>";
          });

          return tooltipContent;
        },
        shared: true,
      },
      series: [
        {
          name: "Rainfall",
          color: "#fa6400",
          data: forecast_data.map((item) => {
            return [item.date, item.rainfall];
          }),
        },
        {
          name: "Precipitation",
          color: "#ffe27e",
          data: forecast_data.map((item) => {
            return [item.date, item.rainfall_chance];
          }),
        },
        {
          name: "Humidity",
          color: "green",
          data: forecast_data.map((item) => {
            return [item.date, item.humidity];
          }),
        },
      ],
    });
  }

  $("#precipitation-forecast-screenshot").click(function () {
    var chartID = "precipitation-forecast";
    var chart = Highcharts.charts.find(
      (chart) => chart.renderTo.id === chartID
    );
    if (chart) {
      chart.exportChart({
        type: "image/png",
        filename: "chart-image-" + chartID,
      });
    } else {
      alert("Cannot download for data that's unavailable");
    }
  });

  $("#precipitation-forecast-data").click(function () {
    var chartID = "precipitation-forecast";
    var chart = Highcharts.charts.find(
      (chart) => chart.renderTo.id === chartID
    );
    if (chart) {
      var data = chart.series.map(function (series) {
        return series.data.map(function (point) {
          return [point.name, point.y];
        });
      });

      var csvContent = "Date,Rainfall,Precipitation,Humidity\n";

      for (var i = 0; i < data[0].length; i++) {
        var row = [data[0][i][0]];
        for (var j = 0; j < data.length; j++) {
          row.push(data[j][i][1] ?? 0);
        }
        csvContent += row.join(",") + "\n";
      }

      var blob = new Blob([csvContent], { type: "text/csv" });

      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "chart-data.csv";
      link.click();
    } else {
      alert("Cannot download for data that's unavailable");
    }
  });

  $("#temparature-forecast-screenshot").click(function () {
    var chartID = "temparature-forecast";
    var chart = Highcharts.charts.find(
      (chart) => chart.renderTo.id === chartID
    );
    if (chart) {
      chart.exportChart({
        type: "image/png",
        filename: "chart-image-" + chartID,
      });
    } else {
      alert("Cannot download for data that's unavailable");
    }
  });

  $("#temparature-forecast-data").click(function () {
    var chartID = "temparature-forecast";
    var chart = Highcharts.charts.find(
      (chart) => chart.renderTo.id === chartID
    );
    if (chart) {
      var data = chart.series.map(function (series) {
        return series.data.map(function (point) {
          return [point.name, point.y];
        });
      });

      var csvContent = "Date,Max temperature,Min temperature\n";

      for (var i = 0; i < data[0].length; i++) {
        var row = [data[0][i][0]];
        for (var j = 0; j < data.length; j++) {
          row.push(data[j][i][1] ?? 0);
        }
        csvContent += row.join(",") + "\n";
      }

      var blob = new Blob([csvContent], { type: "text/csv" });

      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "chart-data.csv";
      link.click();
    } else {
      alert("Cannot download for data that's unavailable");
    }
  });
});