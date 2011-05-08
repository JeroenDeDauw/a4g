var map;
 
function init() {
	map = new OpenLayers.Map('map', {
	    controls: [
	        new OpenLayers.Control.Navigation(),
	        new OpenLayers.Control.PanZoomBar(),
	        new OpenLayers.Control.LayerSwitcher({'ascending':false}),
	        new OpenLayers.Control.MousePosition(),
	    ]
	});
	
	var heat = new Heatmap.Layer("Heatmap");
	
	for (var latlng in coordinates) {
	  var point = new Heatmap.Source(new OpenLayers.LonLat(coordinates[latlng][1], coordinates[latlng][0]));
	  heat.addSource(point);
	}
	
	heat.defaultIntensity = 0.1;
	heat.setOpacity(0.33);
	
	var shaded = new OpenLayers.Layer.VirtualEarth("VirtualEarth Shaded", {
	  type: VEMapStyle.Shaded,
	  animationEnabled: false
	});
	
	var wms = new OpenLayers.Layer.WMS("OpenLayers WMS", "http://labs.metacarta.com/wms/vmap0", {layers: 'basic'});
	 
	map.addLayers([shaded, wms, heat]);
	map.zoomToExtent(heat.getDataExtent());
}