$().ready(function() {
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

	
	var heatMapOverlay = new Heatmap.Layer("Heatmap");
	
	for (var latlng in coordinates) {
		var lonLat = new OpenLayers.LonLat(coordinates[latlng][1], coordinates[latlng][0]);
		lonLat.transform( displayProjection, projection );
		heatMapOverlay.addSource( new Heatmap.Source( lonLat ) );
	}
	
	heatMapOverlay.defaultIntensity = 0.1;
	heatMapOverlay.setOpacity(0.33);
	
	map.addLayers([
		new OpenLayers.Layer.OSM.Mapnik("OSM Mapnik"),
		new OpenLayers.Layer.OSM.Osmarender("OSM arender"),
		new OpenLayers.Layer.OSM.CycleMap("OSM Cycle Map"),
		//new OpenLayers.Layer.WMS("OpenLayers WMS", "http://labs.metacarta.com/wms/vmap0", {layers: 'basic'}),
		heatMapOverlay
	]);
	
	map.addControl(new OpenLayers.Control.LayerSwitcher());
	map.zoomToExtent(heatMapOverlay.getDataExtent());
});
