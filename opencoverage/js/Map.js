/**
 * Map initialization code for Open Coverage.
 *
 * @licence GNU GPL v3+
 * @author Jeroen De Dauw < jeroendedauw@gmail.com >
 */
OpenLayers.Feature.prototype.popupClass = OpenLayers.Class(
	OpenLayers.Popup.FramedCloud,
	{
		'autoSize': true,
		'minSize': new OpenLayers.Size( 200, 100 )
	}
);

(function($) { $( document ).ready( function() {
	
	// Define the projections here so they can be acessed by all the functions.
	var projection = new OpenLayers.Projection("EPSG:900913");
	var displayProjection = new OpenLayers.Projection("EPSG:4326");
	
	// Create the OpenLayers map object.
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
	
	// Add the OpenStreetMap layers.
	map.addLayers([
		new OpenLayers.Layer.OSM.Mapnik("OSM Mapnik"),
		new OpenLayers.Layer.OSM.Osmarender("OSM arender"),
		new OpenLayers.Layer.OSM.CycleMap("OSM Cycle Map")
		//,new OpenLayers.Layer.WMS("OpenLayers WMS", "http://labs.metacarta.com/wms/vmap0", {layers: 'basic'}),
	]);
	
	// Add a new layer switcher control. Not doing this will result in the layer order being reversed.
	map.addControl(new OpenLayers.Control.LayerSwitcher());

	// Set the map centre and zoom to hardcoded values for the city of Gent.
	var gentCentreLonLat = new OpenLayers.LonLat(3.72, 51.05665);
	gentCentreLonLat.transform( displayProjection, projection );
	map.setCenter( gentCentreLonLat, 13 );

	// Load the data (using local storage if possible) and visualize it on the map.
	if ( canUseLocalStorage() && localStorage.getItem( 'data' ) ) {
		var data = JSON.parse( localStorage.getItem( 'data' ) );
		putDataOnMap( data );
		checkDataValidity( data );
	}
	else {
		obtainDataFromServer( putDataOnMap );
	}
	
	if ( canUseGeolocation() ) {
		var markerLayer = new OpenLayers.Layer.Markers( 'Your location' );
		markerLayer.id= 'markerLayer';
		map.addLayer( markerLayer );		

		function getMarkerForPosition( position ) {
			console.log( position.coords.longitude + ", " + position.coords.latitude );
			var location = new OpenLayers.LonLat( position.coords.longitude, position.coords.latitude );
			location.transform( displayProjection, projection );			
			
			var marker = new OpenLayers.Marker( location );
			
			marker.events.register( 'mousedown', marker, function( evt ) {
				var popup = new OpenLayers.Feature( markerLayer, location ).createPopup( true ); 
				popup.setContentHTML( "<b>You are here</b><hr />Latitude: " + position.coords.latitude + "<br />Longitude: " + position.coords.longitude );
				markerLayer.map.addPopup( popup );
				OpenLayers.Event.stop( evt );
			} );
			
			return marker;
		}
		
		navigator.geolocation.getCurrentPosition( function( position ) {
			markerLayer.addMarker( getMarkerForPosition( position ) );
		}, function( error ){
			console.log( "Something went wrong: ", error );
		},
		{
			timeout: 5000,
			maximumAge: 15 * 60000,
			enableHighAccuracy: true
		} );
		
		var positionTimer = navigator.geolocation.watchPosition( function( position ) {
			markerLayer.clearMarkers();
			markerLayer.addMarker( getMarkerForPosition( position ) );
		} );
	}
	
	/**
	 * Checks with the server if the local data is still valid.
	 * If this is not the case, new data wil be requested.
	 * 
	 * @param {object} data
	 */
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
	
	/**
	 * Obtains the data from the server and passes it to the callback function.
	 * When local storage is available, it'll also be stored.  
	 * 
	 * @param callback
	 */
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
		}, 3000); // Simulate a delay for testing purpouses. TODO 
	}
	
	/**
	 * Visualizes the data on the map.
	 * 
	 * @param {object} data
	 */
	function putDataOnMap( data ) {
		var first = true;
		
		for ( operator in data ) {
			addHeatmapLayer( operator, first, data[operator].signal );
			addMastLayer( operator,data[operator].masts );
			
			if ( first ) {
				first  = false;
			}
		}
	}
	
	/**
	 * Adds a heatmap layer to the map.
	 * 
	 * @param {string} name
	 * @param {boolean} first When true, the overlay will be enabled on load, and the map will re-pan to it's centre. 
	 * @param {array} coordinates
	 */
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
			// Call the moveTo method with the current bounds to force an initial draw of the heatmap.
			heatMapOverlay.moveTo( heatMapOverlay.getExtent(), false, false );
			
			// Pan to the centre of the heat-map.
			map.panTo(heatMapOverlay.getDataExtent().getCenterLonLat());
			// To also re-zoom: map.zoomToExtent(heatMapOverlay.getDataExtent());			
		}
	}
	
	/**
	 * Adds a layey with masts.
	 * 
	 * @param {string} name
	 * @param {array} masts
	 */
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
	
	/**
	 * Determines and returns wheter local storage is supported.
	 * 
	 * @return boolean
	 */
	function canUseLocalStorage() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			return false;
		}
	}
	
	/**
	 * @return boolean
	 */
	function canUseGeolocation() {
		return typeof navigator != 'undefined' && navigator.geolocation;
	}
	
} ); })(jQuery);
