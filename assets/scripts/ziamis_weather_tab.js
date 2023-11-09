$(document).ready(function () {
    $("#short_range_tabs").click(function () {
      $("#item-id-0").toggleClass("show");
    });
    
    $.ajax({
      type: "GET",
      url: `${weatherApiUrl}/provinces`,
      success: function (response) {
        if (Array.isArray(response.data)) {
          let provinces = response.data;
          provinces.forEach(function (item) {
            const option = `<option value="${item.province}">${item.province}</option>`;
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
      const selectedProvince = $(this).val();
      if (selectedProvince !== "Select your Province") {
        $.ajax({
          type: "GET",
          url: `${weatherApiUrl}/districts`,
          data: { province: toTitleCase(selectedProvince) },
          success: function (response) {
            if (Array.isArray(response.data)) {
              districtSelect.empty();
              let districts = response.data;
              const option = `<option value="" selected>Select your District</option>`;
              districtSelect.append(option);
              districts.forEach(function (item) {
                const option = `<option value="${item.id}">${item.district}</option>`;
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