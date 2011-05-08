(function($) { $( document ).ready( function() {
	
	var projection = new OpenLayers.Projection("EPSG:900913");
	var displayProjection = new OpenLayers.Projection("EPSG:4326");
	
	var map = new OpenLayers.Map('map', {
	    controls: [
	        new OpenLayers.Control.Navigation(),
	        new OpenLayers.Control.PanZoomBar(),
	        new OpenLayers.Control.LayerSwitcher({'ascending':false}),
	        new OpenLayers.Control.MousePosition(),
	    ],
	    projection: projection,
	    displayProjection: displayProjection,
	});

	
	map.addLayers([
		new OpenLayers.Layer.OSM.Mapnik("OSM Mapnik"),
		new OpenLayers.Layer.OSM.Osmarender("OSM arender"),
		new OpenLayers.Layer.OSM.CycleMap("OSM Cycle Map")
		//new OpenLayers.Layer.WMS("OpenLayers WMS", "http://labs.metacarta.com/wms/vmap0", {layers: 'basic'}),
	]);
	
	map.addControl(new OpenLayers.Control.LayerSwitcher());

	var gentCentreLonLat = new OpenLayers.LonLat(3.72, 51.05665);
	gentCentreLonLat.transform( displayProjection, projection );
	map.setCenter( gentCentreLonLat, 13 );

	if ( canUseLocalStorage() && localStorage.getItem( 'data' ) ) {
		var data = JSON.parse( localStorage.getItem( 'data' ) );
		putDataOnMap( data );
		checkDataValidity( data );
	}
	else {
		obtainDataFromServer( putDataOnMap );
	}
	
	function checkDataValidity( data ) {
		$.getJSON(
			'js/Data.js', // TODO: just get hash
			{},
			function( response ) {
				if ( /* response.hash == somehash */ true ) {
					// TODO: some actual redraw
					obtainDataFromServer( function() { /*alert( 'data refreshed' );*/ } );
				}
			}
		);			
	}
	
	function obtainDataFromServer( callback ) {
		setTimeout(function() {
			$.getJSON(
				'js/Data.js',
				{},
				function( data ) {
					if ( canUseLocalStorage() ) {
						localStorage.setItem( 'data', JSON.stringify( data ) )
					}
					callback( data );
				}
			);
		}, 3000);
	}
	
	function putDataOnMap( data ) {
		var first = true;
		
		for ( operator in data ) {
			addHeatmapLayer( operator, first, data[operator].signal );
			addMastLayer( operator,data[operator].masts );
			
			if ( first ) {
				first  = false;
			}
		}
		
		var coordinates = data.coordinates;		
	}
	
	function addHeatmapLayer( name, first, coordinates ) {
		var heatMapOverlay = new Heatmap.Layer(name, {visibility: first});
		
		heatMapOverlay.defaultIntensity = 0.1;
		heatMapOverlay.setOpacity(0.33);
		
		map.addLayers([ heatMapOverlay ]);
		
		for (var latlng in coordinates ) {
			var coord = coordinates[latlng];
			var lonLat = new OpenLayers.LonLat(coord.lon, coord.lat);
			lonLat.transform( displayProjection, projection );
			heatMapOverlay.addSource( new Heatmap.Source( lonLat, null, coord.value ) );
		}
		
		if ( first ) {
			map.panTo(heatMapOverlay.getDataExtent().getCenterLonLat());
			// To also re-zoom: map.zoomToExtent(heatMapOverlay.getDataExtent());			
		}
	}
	
	function addMastLayer( name, masts ) {
		var styleMap = new OpenLayers.StyleMap({
            "default": new OpenLayers.Style({
                pointRadius: "${type}", // sized according to type attribute
                fillColor: "#ffcc66",
                strokeColor: "#ff9933",
                strokeWidth: 2,
                graphicZIndex: 1
            }),
            "select": new OpenLayers.Style({
                fillColor: "#66ccff",
                strokeColor: "#3399ff",
                graphicZIndex: 2
            })
        });
		
        var mastLater = new OpenLayers.Layer.Vector(name + " masts", {
            styleMap: styleMap,
            rendererOptions: {zIndexing: true},
        	visibility: false
        });
        
        var mastFeatures = [];
        
        for (i in masts) {
			var lonLat = new OpenLayers.LonLat(masts[i].lon, masts[i].lat);
			lonLat.transform( displayProjection, projection );
			
        	mastFeatures.push( new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Point(
                		lonLat.lon, lonLat.lat
                ), {
                    type: 5 + parseInt(5 * Math.random())
                }
            ) );
        }
        
        mastLater.addFeatures( mastFeatures );
		
		map.addLayers([ mastLater ]);
	}
	
	function canUseLocalStorage() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			return false;
		}
	}	
	
} ); })(jQuery);
