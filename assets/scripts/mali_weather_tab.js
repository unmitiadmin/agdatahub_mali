$(document).ready(function () {
    $("#short_range_tabs").click(function () {
      $("#item-id-0").toggleClass("show");
    });
    
    $.ajax({
      type: "GET",
      url: `${weatherApiUrl}/regions`,
      success: function (response) {
        if (Array.isArray(response.data)) {
          let regions = response.data;
          regions.forEach(function (item) {
            const option = `<option value="${item.region_id}">${item.region}</option>`;
            provinceSelect.append(option);
          });
        } else {
          console.error("Invalid response format");
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", status, error);
      },
    });
    
    $("#province-select").change(function () {
      const selectedRegion = $(this).val();
      if (selectedRegion !== "Select your Province") {
        $.ajax({
          type: "GET",
          url: `${weatherApiUrl}/cercles`,
          data: { regionId: toTitleCase(selectedRegion) },
          success: function (response) {
            if (Array.isArray(response.data)) {
              districtSelect.empty();
              let districts = response.data;
              const option = `<option value="" selected>Select your Cercle</option>`;
              districtSelect.append(option);
              districts.forEach(function (item) {
                const option = `<option value="${item.cercle_id}">${item.cercle}</option>`;
                districtSelect.append(option);
              });
            } else {
              console.error("Invalid response format");
            }
          },
          error: function (xhr, status, error) {
            console.error("Error:", status, error);
          },
        });
      }
    }); 

    function toTitleCase(str) {
      return str
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }    

})