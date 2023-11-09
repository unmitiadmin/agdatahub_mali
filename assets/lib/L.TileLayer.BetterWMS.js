L.TileLayer.BetterWMS = L.TileLayer.WMS.extend({
  
  onAdd: function (map) {
    // Triggered when the layer is added to a map.
    //   Register a click listener, then do all the upstream WMS things
    L.TileLayer.WMS.prototype.onAdd.call(this, map);
    map.on('mousemove', this.getFeatureInfo, this);
  },
  
  onRemove: function (map) {
    // Triggered when the layer is removed from a map.
    //   Unregister a click listener, then do all the upstream WMS things
    L.TileLayer.WMS.prototype.onRemove.call(this, map);
    map.off('mousemove', this.getFeatureInfo, this);
  },
  
  getFeatureInfo: function (evt) {
    // Make an AJAX request to the server and hope for the best
    var url = this.getFeatureInfoUrl(evt.latlng),
        // showResults = L.Util.bind(this.showGetFeatureInfo, this);
        showResults = L.Util.bind(this.showJSONFeatureInfo, this);
    $.ajax({
      url: url,
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Access-Control-Allow-Credentials': 'true'
      },
      success: function (data, status, xhr) {
        var err = typeof data === 'string' ? null : data;
        showResults(err, evt.latlng, data);
      },
      error: function (xhr, status, error) {
        showResults(error);  
      }
    });
  },
  
  getFeatureInfoUrl: function (latlng) {
    // Construct a GetFeatureInfo request URL given a point
    var point = this._map.latLngToContainerPoint(latlng, this._map.getZoom()),
        size = this._map.getSize(),
        
        params = {
          request: 'GetFeatureInfo',
          service: 'WMS',
          srs: 'EPSG:4326',
          styles: this.wmsParams.styles,
          transparent: this.wmsParams.transparent,
          version: this.wmsParams.version,      
          format: this.wmsParams.format,
          bbox: this._map.getBounds().toBBoxString(),
          height: size.y,
          width: size.x,
          layers: this.wmsParams.layers,
          query_layers: this.wmsParams.layers,
          info_format: 'application/json'
        };
    
    // params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
    // params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;
    params[params.version === '1.3.0' ? 'i' : 'x'] = Math.round(point.x);
    params[params.version === '1.3.0' ? 'j' : 'y'] = Math.round(point.y);
    
    return this._url + L.Util.getParamString(params, this._url, true);
  },
  
  showGetFeatureInfo: function (err, latlng, content) {
    // if (err) { console.log(err); return; } // do nothing if there's an error
    
    // Otherwise show the content in a popup, or something.
    // L.popup({ maxWidth: 800})
    //   .setLatLng(latlng)
    //   .setContent(content)
    //   .openOn(this._map);
    // console.log(content);

    // // text/html
    // let contentBody = new DOMParser().parseFromString(content, "text/xml").getElementsByTagName("td");
    // let tdCells = [].slice.call(contentBody);
    // if(tdCells.length > 1){
    //   let value = tdCells[1];
    //   $("#parameter-value").empty().html(value.innerHTML);
    // } else{
    //   $("#parameter-location").empty();
    //   $("#parameter-value").empty();
    // }

    

  },

  showJSONFeatureInfo: function(content, latlng) {
      // application/json
      // if(content?.features?.length){
      //   let values = Object.values(content?.features[0]?.properties);
      //   if(values.length){
      //     console.log(`${values[0]} @ ${JSON.stringify(latlng)}`);
      //   } else{
          
      //   }
      // }
  }
});

L.tileLayer.betterWms = function (url, options) {
  // console.log(url, options);
  return new L.TileLayer.BetterWMS(url, options);  
};