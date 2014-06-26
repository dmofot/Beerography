var map, issues, newIssue, marker, bctSearch = [];

issues = new L.MarkerClusterGroup({spiderfyOnMaxZoom: true, showCoverageOnHover: false, zoomToBoundsOnClick: true});
newIssue = new L.LayerGroup();

// Basemap Layers
var woodcutOSM = L.tileLayer("http://{s}.tiles.mapbox.com/v3/examples.xqwfusor/{z}/{x}/{y}.png", {  // Woodcut base layer by Eleanor at Mapbox
    maxZoom: 21,
    subdomains: ["a", "b", "c", "d"],
    attribution: 'Tiles courtesy of <a href="http://www.mapbox.com" target="_blank">Mapbox</a>. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a>.'
});
var mapboxTer = L.tileLayer("http://{s}.tiles.mapbox.com/v3/examples.map-9ijuk24y/{z}/{x}/{y}.png", {  // Terrain base layer by Mapbox
    maxZoom: 21,
    subdomains: ["a", "b", "c", "d"],
    attribution: 'Tiles courtesy of <a href="http://www.mapbox.com" target="_blank">Mapbox</a>. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a>.'
});
var mapboxSat = L.tileLayer("http://{s}.tiles.mapbox.com/v3/examples.map-2k9d7u0c/{z}/{x}/{y}.png", {  // Satellite base layer by Mapbox
    maxZoom: 17,
    subdomains: ["a", "b", "c", "d"],
    attribution: 'Tiles courtesy of <a href="http://www.mapbox.com" target="_blank">Mapbox</a>. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a>.'
});
/**  // Other free base layer options
var stamenTerrain = L.tileLayer("http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg", {  // Terrain base layer by Stamen (not used)
    maxZoom: 18,
    subdomains: ["a", "b", "c", "d"],
    attribution: 'Tiles courtesy of <a href="http://www.stamen.com" target="_blank">Stamen</a>.'
});
var mapquestHYB = L.layerGroup([L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {  // Creates a hybrid base layer from Mapquest Satellite and Streets (note used)
    maxZoom: 18,
    subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"]
}), L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png", {
    maxZoom: 19,
    subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
    attribution: 'Labels courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a>.'
})]);
*/

// Overlay Layers
var bct = L.geoJson(null, {  // bct is the trail layer
    style: function (feature) {
        if (feature.properties.desig === "Dedicated") {
            return {
                color: "#f00a19",
                weight: 5,
                opacity: 0.9
                // smoothFactor: 2,  // uncomment to simplify line segments
                // clickable: false  // comment out to get popup for trail features
            };
        };
        if (feature.properties.desig === "Temporary") {
            return {
                color: "#f26e09",
                weight: 5,
                opacity: 0.9,
                // smoothFactor: 2,  // uncomment to simplify line segments
                clickable: false  // comment out to get popup for trail features
                // dashArray: "5, 5"  // uncomment to make temporary segments dashed lines
            };
        };
    },
    onEachFeature: function (feature, layer) {
        if (feature.properties) {
            var content =   "<table class='table table-striped table-bordered table-condensed'>"+
                                "<tr><th>Trail</th><td>" + feature.properties.name + "</td></tr>"+
                                "<tr><th>SubTitle</th><td>" + feature.properties.other + "</td></tr>"+
                                "<tr><th>Designation</th><td>" + feature.properties.desig + "</td></tr>"+
                                "<tr><th>Length</th><td>" + feature.properties.leng_miles + "</td></tr>"
                            "<table>";
/**            if (document.body.clientWidth <= 767) {
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
                    color: "#00FFFF",
                    opacity: 1
                });
                // layer.openPopup();
                if (!L.Browser.ie && !L.Browser.opera) {
                    layer.bringToFront();
                }
            },
            mouseout: function(e) {
                bct.resetStyle(e.target);
                e.layer.closePopup();
            }
        });
        bctSearch.push({
            name: layer.feature.properties.name,
            source: "BCT",
            id: L.stamp(layer),
            bounds: layer.getBounds()
        });
    }
});
$.getJSON("data/bctmin.geojson", function (data) {
    bct.addData(data);
});

// Create map
map = L.map("map", {
    zoom: 10,
    center: [42.48814, -71.25861],
    layers: [woodcutOSM, bct, issues, newIssue]
});

$(document).ready(function() {
    $.ajaxSetup({cache:false});
    getIssues();
});

// Hack to preserver layer order in Layer control
map.removeLayer(issues);

// Larger screens get expanded layer control
if (document.body.clientWidth <= 767) {
    var isCollapsed = true;
} else {
    var isCollapsed = false;
};

// Group layers for layer control
var baseLayers = {
    "Woodcut": woodcutOSM,
    "Terrain": mapboxTer,
    "Satellite": mapboxSat
    // "Terrain": stamenTerrain,
    // "Hybrid": mapquestHYB
};

var overlays = {
    "<img src='assets/img/bct.png' width='24' height='28'>&nbsp;Bay Circuit Trail": bct,
    "&nbsp;Trouble Reports": issues
};

var layerControl = L.control.layers(baseLayers, overlays, {
    collapsed: isCollapsed
}).addTo(map);

// Legend Control
var legendControl = L.control({
    position: 'bottomright'
});
legendControl.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'legend'); // create a div with class legend
    this.update();
    return this._div;
};
legendControl.update = function (box) {
    this._div.innerHTML = "<img src='assets/img/legend.png' width='142' height='100'>";
};
if (document.body.clientWidth >= 768) {
    legendControl.addTo(map);
};

// Leaflet Locate Control
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

// Highlight search box text on click
$("#searchbox").click(function () {
    $(this).select();
});

// Typeahead search functionality
$(document).one("ajaxStop", function () {
    map.fitBounds(bct.getBounds());
    $("#loading").hide();

    var bctBH = new Bloodhound({
        name: "BCT",
        datumTokenizer: function (d) {
            return Bloodhound.tokenizers.whitespace(d.name);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: bctSearch,
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
    bctBH.initialize();
    geonamesBH.initialize();

    // instantiate the typeahead UI
    $("#searchbox").typeahead({
        minLength: 3,
        highlight: true,
        hint: false
    }, {
        name: "BCT",
        displayKey: "name",
        source: bctBH.ttAdapter(),
        templates: {
            header: "<h4 class='typeahead-header'>BCT</h4>"
        }
    }, {
        name: "GeoNames",
        displayKey: "name",
        source: geonamesBH.ttAdapter(),
        templates: {
            header: "<h4 class='typeahead-header'><img src='assets/img/globe.png' width='25' height='25'>&nbsp;GeoNames</h4>"
        }
    }).on("typeahead:selected", function (obj, datum) {
        if (datum.source === "BCT") {
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

// initialize issue registration
function initRegistration() {
    bct.addEventListener('click', onMapClick);
    map.addEventListener('click', onMapClick);
    $('#map').css('cursor', 'crosshair');
    return false;
}

// cancel issue registration
function cancelRegistration() {
    newIssue.clearLayers();
    $('#map').css('cursor', '');
    map.removeEventListener('click', onMapClick);
    bct.removeEventListener('click', onMapClick);
}

// get all issues from the sqlite database and add to map
function getIssues() {
    $.getJSON("get_issues.php", function (data) {
        for (var i = 0; i < data.length; i++) {
            var location = new L.LatLng(data[i].lat, data[i].lng);
            var name = data[i].name;
            var website = data[i].website;
            if (data[i].website.length > 7) {
                var title = "<div style='font-size: 18px; color: #0078A8;'><a href='"+ data[i].website +"' target='_blank'>"+ data[i].name + "</a></div>";
            }
            else {
                var title = "<div style='font-size: 18px; color: #0078A8;'>"+ data[i].name +"</div>";
            }
            if (data[i].issue.length > 0) {
                var issue = "<div style='font-size: 14px;'>"+ data[i].issue +"</div>";
            }
            else {
                var issue = "";
            }
            var marker = new L.Marker(location, {
                title: name
            });
            marker.bindPopup("<div style='text-align: center; margin-left: auto; margin-right: auto;'>"+ title + issue +"</div>", {maxWidth: '400'});
            issues.addLayer(marker);
        }
    });
}

// inserts trouble issue into sqlite database after Submit is clicked
function insertIssue() {
    $("#loading-mask").show();
    $("#loading").show();
    var name = $("#name").val();
    var email = $("#email").val();
    var website = $("#website").val();
    var issue = $("#issue").val();
    var lat = $("#lat").val();
    var lng = $("#lng").val();
    if (name.length == 0) {
        alert("Name is required!");
        return false;
    }
    if (email.length == 0) {
        alert("Email is required!");
        return false;
    }
    if (issue.length == 0) {
        alert("Issue is required!");
        return false;
    }
    var dataString = 'name='+ name + '&email=' + email + '&website=' + website + '&issue=' + issue + '&lat=' + lat + '&lng=' + lng;
    $.ajax({
        type: "POST",
        url: "insert_issue.php",
        data: dataString,
        success: function() {
            cancelRegistration();
            issues.clearLayers();
            getIssues();
            $("#loading-mask").hide();
            $("#loading").hide();
            $('#insertSuccessModal').modal('show');
        }
    });
    return false;
}

// Update the lat/long values of the form after a marker dragend event; reopen the popup window
function markerDrag(e) {
    marker.openPopup();
    document.getElementById("lat").value = e.target._latlng.lat.toFixed(6);
    document.getElementById("lng").value = e.target._latlng.lng.toFixed(6);
}

// form data for issue including invisible lat & lng from clicking the map
function onMapClick(e) {
    var markerLocation = new L.LatLng(e.latlng.lat, e.latlng.lng);
    marker = new L.Marker(markerLocation, {draggable:true});

    marker.on('dragend', markerDrag);
    newIssue.clearLayers();
    newIssue.addLayer(marker);
    var form =  '<form enctype="multipart/form-data" class="form" id="inputform">'+
        '<label>Name:</label><i>&nbsp;&nbsp;marker title</i>'+
        '<input type="text" class="form-control" placeholder="Required" id="name" name="name" />'+
        '<label>Email:</label><i>&nbsp;&nbsp;never shared</i>'+
        '<input type="email" class="form-control" placeholder="Required" id="email" name="email" />'+
        '<label>Website:</label><i>&nbsp;&nbsp;Optional</i>'+
        '<input type="url" class="form-control" id="website" name="website" value="http://" />'+
        '<label>Remarks:</label><i>&nbsp;&nbsp;brief description</i>'+
        '<textarea class="form-control" rows="3" id="issue" name="issue" placeholder="Required"></textarea>'+
        '<input style="display: none;" type="text" id="lat" name="lat" value="'+e.latlng.lat.toFixed(6)+'" />'+
        '<input style="display: none;" type="text" id="lng" name="lng" value="'+e.latlng.lng.toFixed(6)+'" /><br><br>'+
        '<div class="form-group">'+
            '<button type="button" class="btn btn-default" onclick="cancelRegistration()">Cancel</button>&nbsp;&nbsp;'+
            '<button type="button" class="btn btn-primary" onclick="insertIssue()">Submit</button>'+
        '</div>'+
        '</form>';
    marker.bindPopup(form, {minWidth: "200"}).openPopup();
}

// Placeholder hack for IE
if (navigator.appName == "Microsoft Internet Explorer") {
    $("input").each( function () {
        if ($(this).val() == "" && $(this).attr("placeholder") != "") {
            $(this).val($(this).attr("placeholder"));
            $(this).focus(function () {
                if ($(this).val() == $(this).attr("placeholder")) $(this).val("");
            });
            $(this).blur(function () {
                if ($(this).val() == "") $(this).val($(this).attr("placeholder"));
            });
        }
    });
}