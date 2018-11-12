import 'ol/ol.css';
import {Map, View} from 'ol';
import {getCenter} from 'ol/extent';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Fill, Stroke, Style, Text} from 'ol/style';``
import GeoJSON from 'ol/format/GeoJSON';
import gemeentenData from './data/gemeenten_3857.pbf';
import {decode} from 'geobuf';
import Point from 'ol/geom/Point'
import Pbf from 'pbf';


var breaks_color = [
  [0, 20000,'#feebe2'],
  [20000 , 50000,'#fcc5c0'],
  [50000 , 100000,'#fa9fb5'],
  [100000, 200000,'#f768a1'],
  [100000, 500000,'#dd3497'],
  [500000, 1000000,'#ae017e'],
  [1000000, 2000000,'#7a0177']
];
var selectedFeature;

var theStyle = function(feature, resolution){
  var inw = feature.get('AANT_INW');

  var fillColor="";
  //Iterate through the class break array
  for(var i = 0; i < breaks_color.length; i++) {
      if (inw>=breaks_color[i][0] && inw<breaks_color[i][1]){
          fillColor=breaks_color[i][2]
      }
  }
  if (!fillColor) fillColor = 'darkgray';
  var strokeColor = 'black';
  var strokeWidth = 0.5;
  var zIndex = 1;
  var label;
  if (selectedFeature){
    if (selectedFeature.ol_uid === feature.ol_uid){
      strokeColor = 'white';
      strokeWidth = 2;
      zIndex = 100;
      label = new Text({
        text: feature.values_.GM_NAAM,
        backgroundFill: new Fill({
          color: 'white'
        })
      });
    }
  }
  var styleLabel = new Style({
    geometry: function(feature) {
      // expecting a MultiPolygon here
      var ext = feature.getGeometry().getExtent();
      var centerPoint = getCenter(ext);
      return new Point(centerPoint);
    },
    text: label,
    zIndex: 101
  });
  var style = new Style({
  fill: new Fill({
    color: fillColor
  }),
  stroke: new Stroke({
    color: strokeColor,
    width: strokeWidth
  }),
  zIndex: zIndex
});
  return [styleLabel, style];
}



function buildTable(feature){
  var body = "";
  for (var property in feature.values_) {
    if (feature.values_.hasOwnProperty(property)) {
        if (property === 'geometry') continue;
        var row = "<tr><td>"+ property +"</td><td>"+ feature.values_[property] +"</td></tr>";
        body += row;
    }
  }
  return '<table><thead><tr><th>Statistiek</th><th>Waarde</th></tr></thead><tbody>' + body + '</tbody></table>'
}

function reqListener () {
  var gemeenten = decode(new Pbf(this.response));
  var vectorSource = new VectorSource({
    features: (new GeoJSON()).readFeatures(gemeenten)
  });
  var vectorLayer = new VectorLayer({
    renderMode: 'vector',
    source: vectorSource,
    style: theStyle
  });

  const map = new Map({
    target: 'map',
    layers: [
      new TileLayer({
        source: new OSM()
      }),
      vectorLayer
    ],
    view: new View({
      center: [601712.286939,	6831635.839550],
      zoom: 9
    })
  });

  map.on('singleclick', function(evt) {
    map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
        //you can add a condition on layer to restrict the listener
      if (feature){
        selectedFeature = feature;      
        var table = buildTable(feature);
       document.getElementById("map-sidebar").innerHTML = table;
        //here you can add you code to display the coordinates or whatever you want to do
        } else {
          selectedFeature = null;
          document.getElementById("map-sidebar").innerHTML = "";
        }
        layer.changed();
    });
  });

}

var oReq = new XMLHttpRequest();
oReq.addEventListener("load", reqListener);
oReq.responseType = "arraybuffer";
oReq.open("GET", gemeentenData);
oReq.send();

