
$(document).ready(function () {
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
      const uniqueCropNames = [
        ...new Set(crops.map((item) => item["crop"])),
      ];

      uniqueCropNames.forEach((cropName) => {
        const option = $("<option>", {
          value: cropName,
          text: cropName,
          selected: true,
          title: cropName
        });
        selectElement.append(option);
      });
      selectElement.selectpicker("refresh");
    }

    function populateYearValues(years) {
      const selectElement = $("#fao_years");
      const uniqueYears = [...new Set(years.map((item) => item["year"]))];
      uniqueYears.forEach((year) => {
        selectElement.append(
          $("<option>", {
            value: year,
            title: year,
            selected: true,
            text: year
          })
        );
      });
      selectElement.selectpicker("refresh");
    }

    $("#fao_filters").click(function (e) {
      e.preventDefault();
      generate_yield_data();
    });

    function generate_yield_data() {
      let filtered_fao_data = fao_data;
      let selected_crops = [];
      let selected_years = [];

      selected_crops = $("#fao_crops").val();
      filtered_fao_data = filtered_fao_data.filter((item) =>
        $("#fao_crops").val().includes(item["crop"])
      );     

      selected_years = $("#fao_years").val();
      filtered_fao_data = filtered_fao_data.filter((item) =>
        $("#fao_years").val().includes(item["year"])
      );

      let prod_series = [];
      let yield_series = [];
      let harvested_series = [];

      let summedData = {};

      filtered_fao_data.forEach((item) => {
        const cropName = item["crop"];
        if (summedData[cropName]) {
          summedData[cropName] += Math.round(item["production"]);
        } else {
          summedData[cropName] = Math.round(item["production"]);
        }
      });
      prod_series = [
        {
          name: "Production",
          data: Object.values(summedData),
          color: "#ffe59a",
        },
      ];
      summedData = {};

      filtered_fao_data.forEach((item) => {
        const cropName = item["crop"];
        if (summedData[cropName]) {
          summedData[cropName] += Math.round(item["yield"]);
        } else {
          summedData[cropName] = Math.round(item["yield"]);
        }
      });
      yield_series = [
        {
          name: "Yield",
          data: Object.values(summedData),
          color: "#ffe59a",
        },
      ];

      summedData = {};

      filtered_fao_data.forEach((item) => {
        const cropName = item["crop"];
        if (summedData[cropName]) {
          summedData[cropName] += Math.round(item["area"]);
        } else {
          summedData[cropName] = Math.round(item["area"]);
        }
      });
      harvested_series = [
        {
          name: "Area harvested",
          data: Object.values(summedData),
          color: "#ffe59a",
        },
      ];

      generate_fao_bar_graph(
        "production_bar",
        selected_crops,
        prod_series,
        "t"
      );
      generate_fao_bar_graph(
        "yield_bar",
        selected_crops,
        yield_series,
        "100 g/ha"
      );
      generate_fao_bar_graph(
        "harvested_bar",
        selected_crops,
        harvested_series,
        "ha"
      );
    }

    function generate_fao_bar_graph(
      chart_id,
      yield_categories,
      yield_series,
      units
    ) {
      Highcharts.chart(chart_id, {
        chart: { type: "bar" },
        title: { text: null },
        subtitle: { text: null },
        xAxis: {
          categories: yield_categories,
          title: { text: `units: ${units}`},
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
  });