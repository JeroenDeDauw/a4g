/*
 * Copyright (c) 2010 Bjoern Hoehrmann <http://bjoern.hoehrmann.de/>.
 * This module is licensed under the same terms as OpenLayers itself.
 */

Heatmap = {};

/**
 * Class: Heatmap.Source
 */
Heatmap.Source = OpenLayers.Class({

  /**
   * APIProperty: lonlat
   * {OpenLayers.LonLat} location of the heat source
   */
  lonlat: null,

  /**
   * APIProperty: radius
   * {Number} Heat source radius
   */
  radius: null,

  /**
   * APIProperty: intensity
   * {Number} Heat source intensity
   */
  intensity: null,

  /**
   * Constructor: Heatmap.Source
   * Create a heat source.
   *
   * Parameters:
   * lonlat - {OpenLayers.LonLat} Coordinates of the heat source
   * radius - {Number} Optional radius
   * intensity - {Number} Optional intensity
   */
  initialize: function(lonlat, radius, dbm) {
    this.lonlat = lonlat;
    this.dbm = dbm;
  },

  CLASS_NAME: 'Heatmap.Source'
});

/**
 * Class: Heatmap.Layer
 *
 * Inherits from:
 *  - <OpenLayers.Layer>
 */
Heatmap.Layer = OpenLayers.Class(OpenLayers.Layer, {

  /**
   * APIProperty: isBaseLayer
   * {Boolean} Heatmap layer is never a base layer.
   */
  isBaseLayer: false,

  /**
   * Property: points
   * {Array(<Heatmap.Source>)} internal coordinate list
   */
  points: null,

  /**
   * Property: cache
   * {Object} Hashtable with CanvasGradient objects
   */
  cache: null,

  /**
   * Property: gradient
   * {Array(Number)} RGBA gradient map used to colorize the intensity map.
   */
  gradient: null,

  /**
   * Property: canvas
   * {DOMElement} Canvas element.
   */
  canvas: null,

  /**
   * APIProperty: defaultRadius
   * {Number} Heat source default radius
   */
  defaultRadius: null,

  /**
   * APIProperty: defaultIntensity
   * {Number} Heat source default intensity
   */
  defaultIntensity: null,

  /**
   * Constructor: Heatmap.Layer
   * Create a heatmap layer.
   *
   * Parameters:
   * name - {String} Name of the Layer
   * options - {Object} Hashtable of extra options to tag onto the layer
   */
  initialize: function(name, options) {
    OpenLayers.Layer.prototype.initialize.apply(this, arguments);
    this.points = [];
    this.cache = {};
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.defaultRadius = 20;
    this.defaultIntensity = 0.2;

    // For some reason OpenLayers.Layer.setOpacity assumes there is
    // an additional div between the layer's div and its contents.
    var sub = document.createElement('div');
    sub.appendChild(this.canvas);
    this.div.appendChild(sub);
  },

  /**
   * APIMethod: addSource
   * Adds a heat source to the layer.
   *
   * Parameters:
   * source - {<Heatmap.Source>}
   */
  addSource: function(source) {
    this.points.push(source);
  },

  /**
   * APIMethod: removeSource
   * Removes a heat source from the layer.
   *
   * Parameters:
   * source - {<Heatmap.Source>}
   */
  removeSource: function(source) {
    if (this.points && this.points.length) {
      OpenLayers.Util.removeItem(this.points, source);
    }
  },

  /**
   * Method: moveTo
   *
   * Parameters:
   * bounds - {<OpenLayers.Bounds>}
   * zoomChanged - {Boolean}
   * dragging - {Boolean}
   */
  moveTo: function(bounds, zoomChanged, dragging) {
    OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

    // The code is too slow to update the rendering during dragging.
    if (dragging)
      return;

    // Pick some point on the map and use it to determine the offset
    // between the map's 0,0 coordinate and the layer's 0,0 position.
    var someLoc = new OpenLayers.LonLat(0,0);
    var offsetX = this.map.getViewPortPxFromLonLat(someLoc).x -
                  this.map.getLayerPxFromLonLat(someLoc).x;
    var offsetY = this.map.getViewPortPxFromLonLat(someLoc).y -
                  this.map.getLayerPxFromLonLat(someLoc).y;

    this.canvas.width = this.map.getSize().w;
    this.canvas.height = this.map.getSize().h;

    var ctx = this.canvas.getContext('2d');

    ctx.save(); // Workaround for a bug in Google Chrome
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    for (var i in this.points) {
      var src = this.points[i];
      var pos = this.map.getLayerPxFromLonLat(src.lonlat);
      var x = pos.x + offsetX;
      var y = pos.y + offsetY;

      red = 255 + src.dbm*2;
      blue = -src.dbm*2;
      ctx.fillStyle = 'rgba(' + red + ', 0, ' + blue + ', 1)';
      ctx.translate(x, y);
      ctx.fillRect(0, 0, 1, 1);
      ctx.translate(-x, -y);
    }

    var dat = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    var dim = this.canvas.width * this.canvas.height * 4;
    var pix = dat.data;

    ctx.putImageData(dat, 0, 0);

    // Unfortunately OpenLayers does not currently support layers that
    // remain in a fixed position with respect to the screen location
    // of the base layer, so this puts this layer manually back into
    // that position using one point's offset as determined earlier.
    this.canvas.style.left = (-offsetX) + 'px';
    this.canvas.style.top = (-offsetY) + 'px';
  },

  /**
   * APIMethod: getDataExtent
   * Calculates the max extent which includes all of the heat sources.
   *
   * Returns:
   * {<OpenLayers.Bounds>}
   */
  getDataExtent: function () {
    var maxExtent = null;

    if (this.points && (this.points.length > 0)) {
      var maxExtent = new OpenLayers.Bounds();
      for(var i = 0, len = this.points.length; i < len; ++i) {
        var point = this.points[i];
        maxExtent.extend(point.lonlat);
      }
    }

    return maxExtent;
  },

  CLASS_NAME: 'Heatmap.Layer'

});

