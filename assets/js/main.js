var map, brewSearch = [];

/* Basemap Layers */
var woodcutOSM = L.tileLayer("http://{s}.tiles.mapbox.com/v3/examples.xqwfusor/{z}/{x}/{y}.png", {
  maxZoom: 21,
  subdomains: ["a", "b", "c", "d"],
  attribution: 'Tiles <a href="http://www.mapbox.com" target="_blank">Mapbox</a>| Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a>'
});
var mapboxTer = L.tileLayer("http://{s}.tiles.mapbox.com/v3/examples.map-i875mjb7/{z}/{x}/{y}.png", {
  maxZoom: 21,
  subdomains: ["a", "b", "c", "d"],
  attribution: 'Tiles <a href="http://www.mapbox.com" target="_blank">Mapbox</a>| Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a>'
});
var mapboxSat = L.tileLayer("http://{s}.tiles.mapbox.com/v3/examples.map-2k9d7u0c/{z}/{x}/{y}.png", {
  maxZoom: 17,
  subdomains: ["a", "b", "c", "d"],
  attribution: 'Tiles <a href="http://www.mapbox.com" target="_blank">Mapbox</a>| Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a>'
});

/* Overlay Layers */
var brew = L.geoJson(null, {
  style: function (feature) {
    if (feature.properties.type === "Brewpub") {
      return {
        color: "#f00a19",
        weight: 5,
        opacity: 0.9
      };
    };
    if (feature.properties.type === "Contract") {
      return {
        color: "#f26e09",
        weight: 5,
        opacity: 0.9
      };
    };
    if (feature.properties.type === "Micro") {
      return {
        color: "#00cc00",
        weight: 5,
        opacity: 0.9
      };
    };
    if (feature.properties.type === "Other") {
      return {
        color: "#f00a19",
        weight: 5,
        opacity: 0.9
      };
    };
    if (feature.properties.type === "Planning") {
      return {
        color: "#f00a19",
        weight: 5,
        opacity: 0.9
      };
    };
    if (feature.properties.type === "Regional") {
      return {
        color: "#f00a19",
        weight: 5,
        opacity: 0.9
      };
    };
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content =   "<table class='table table-striped table-bordered table-condensed'>"+
                "<tr><th>Trail</th><td>" + feature.properties.name + "</td></tr>"+
                "<tr><th>SubTitle</th><td>" + feature.properties.address + "</td></tr>"+
                "<tr><th>Designation</th><td>" + feature.properties.url + "</td></tr>"
              "<table>";
      if (document.body.clientWidth <= 767) {
        layer.on({
          click: function(e) {
            $("#feature-title").html(feature.properties.name);
            $("#feature-info").html(content);
            $("#featureModal").modal("show");
          }
        });

      } else {
        layer.bindPopup(content, {
          maxWidth: "400",
          closeButton: false
        });
      }; */
    }
    layer.on({
      mouseover: function(e) {
        var layer = e.target;
        layer.setStyle({
          weight: 3,
          color: "#00ffff",
          opacity: 1
        });
        if (!L.Browser.ie && !L.Browser.opera) {
          layer.bringToFront();
        }
      },
      mouseout: function(e) {
        brew.resetStyle(e.target);
      }
    });
    /* Search Auto-complete */
    brewSearch.push({
      name: layer.feature.properties.name,
      source: "brew",
      id: L.stamp(layer),
      bounds: layer.getBounds()
    });
  }
});
$.getJSON("breweries_MA_v10.geojson", function (data) {
  brew.addData(data);
});

/* Create map */
map = L.map("map", {
  zoom: 10,
  center: [42.48814, -71.25861],
  layers: [woodcutOSM, brew]
});

/* Setup URL hash */
var hash = L.hash(map);

/* Larger screens get expanded layer control */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
};

/* Group layers for layer control */
var baseLayers = {
  "Woodcut": woodcutOSM,
  "Terrain": mapboxTer,
  "Satellite": mapboxSat
};

var overlays = {
  "Breweries": brew
};

var layerControl = L.control.layers(baseLayers, overlays, {
  collapsed: isCollapsed
}).addTo(map);

/* Legend Control */
var legendControl = L.control({
  position: 'bottomright'
});
legendControl.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'legend');
  this.update();
  return this._div;
};
legendControl.update = function (box) {
  this._div.innerHTML = "<img src='assets/img/legend.png' width='142' height='100'>";
};
if (document.body.clientWidth >= 768) {
  legendControl.addTo(map);
};

/* Leaflet Locate Control */
var lc = L.control.locate({
  follow: true,
  locateOptions: {
    maxZoom: 16}
}).addTo(map);

map.on('startfollowing', function() {
  map.on('dragstart', lc.stopFollowing);
}).on('stopfollowing', function() {
  map.off('dragstart', lc.stopFollowing);
});

/* Highlight search box text on click */
$("#searchbox").click(function () {
  $(this).select();
});

/* Typeahead search functionality */
$(document).one("ajaxStop", function () {
  map.fitBounds(brew.getBounds());
  $("#loading").hide();

  var brewBH = new Bloodhound({
    name: "brew",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: brewSearch,
    limit: 5
  });

  var geonamesBH = new Bloodhound({
    name: "GeoNames",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
      url: "http://api.geonames.org/searchJSON?username=dmofot&featureClass=P&maxRows=5&countryCode=US&name_startsWith=%QUERY",
      filter: function (data) {
        return $.map(data.geonames, function (result) {
          return {
            name: result.name + ", " + result.adminCode1,
            lat: result.lat,
            lng: result.lng,
            source: "GeoNames"
          };
        });
      },
      ajax: {
        beforeSend: function (jqXhr, settings) {
          settings.url += "&east=" + map.getBounds().getEast() + "&west=" + map.getBounds().getWest() + "&north=" + map.getBounds().getNorth() + "&south=" + map.getBounds().getSouth();
          $("#searchicon").removeClass("fa-search").addClass("fa-refresh fa-spin");
        },
        complete: function (jqXHR, status) {
          $('#searchicon').removeClass("fa-refresh fa-spin").addClass("fa-search");
        }
      }
    },
    limit: 10
  });
  brewBH.initialize();
  geonamesBH.initialize();

  /* instantiate the typeahead UI */
  $("#searchbox").typeahead({
    minLength: 3,
    highlight: true,
    hint: false
  }, {
    name: "brew",
    displayKey: "name",
    source: bctBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'>brew</h4>"
    }
  }, {
    name: "GeoNames",
    displayKey: "name",
    source: geonamesBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/globe.png' width='25' height='25'>&nbsp;GeoNames</h4>"
    }
  }).on("typeahead:selected", function (obj, datum) {
    if (datum.source === "brew") {
      map.fitBounds(datum.bounds);
    };
    if (datum.source === "GeoNames") {
      map.setView([datum.lat, datum.lng], 14);
    };
    if ($(".navbar-collapse").height() > 50) {
      $(".navbar-collapse").collapse("hide");
    };
  }).on("typeahead:opened", function () {
    $(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
    $(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
  }).on("typeahead:closed", function () {
    $(".navbar-collapse.in").css("max-height", "");
    $(".navbar-collapse.in").css("height", "");
  });
  $(".twitter-typeahead").css("position", "static");
  $(".twitter-typeahead").css("display", "block");
});

/* Placeholder hack for IE */
if (navigator.appName == "Microsoft Internet Explorer") {
  $("input").each(function () {
    if ($(this).val() === "" && $(this).attr("placeholder") !== "") {
      $(this).val($(this).attr("placeholder"));
      $(this).focus(function () {
        if ($(this).val() === $(this).attr("placeholder")) $(this).val("");
      });
      $(this).blur(function () {
        if ($(this).val() === "") $(this).val($(this).attr("placeholder"));
      });
    }
  });
}
