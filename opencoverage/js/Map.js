 
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
	    displayProjection: displayProjection
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
	
	setTimeout(function() {
	$.getJSON(
		'js/Data.js',
		{
			
		},
		function( data ) {
			var first = true;
			
			for ( operator in data ) {
				addHeatmapLayer( operator, first, data[operator].signal );
				
				if ( first ) {
					first  = false;
				}
			}
			
			var coordinates = data.coordinates;
		}
	); }, 1);
	
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
	
} ); })(jQuery);