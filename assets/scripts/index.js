
const weatherApiUrl = "http://15.206.6.122:8084";

Highcharts.setOptions({ lang: { thousandsSep: "," } });
$(window).on("load", () => new Index().init());

class Index {
  constructor() {}

  init = () => {};
}