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
var brewLayer = L.geoJson(null);
var brew = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "assets/img/whiskey_barrel.png",
        iconSize: [24, 28],
        iconAnchor: [12, 28],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.name,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.name + "</td></tr>" + "<tr><th>Address</th><td>" + feature.properties.address + "</td></tr>" + "<tr><th>Type</th><td>" + feature.properties.type + "</td></tr>" + "<tr><th>Website</th><td><a class='url-break' href='" + feature.properties.url + "' target='_blank'>" + feature.properties.url + "</a></td></tr>" + "<table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.name);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
            stroke: false,
            fillColor: "#00FFFF",
            fillOpacity: 0.7,
            radius: 10
          }));
        }
      });
      $("#brew-table tbody").append('<tr style="cursor: pointer;" onclick="sidebarClick('+L.stamp(layer)+'); return false;"><td class="brew-name">'+layer.feature.properties.name+'<i class="fa fa-chevron-right pull-right"></td></tr>');
      brewSearch.push({
        name: layer.feature.properties.name,
        address: layer.feature.properties.address,
        source: "Breweries",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
});
$.getJSON("data/Breweries_MA_v10.geojson", function (data) {
  brew.addData(data);
  map.addLayer(brewLayer);
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
    source: brewBH.ttAdapter(),
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
