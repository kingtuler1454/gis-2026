import 'ol/ol.css';
import './style.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { applyStyle } from 'ol-mapbox-style';

const centerLon = 49.3493;
const centerLat = 53.6653;

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: fromLonLat([centerLon, centerLat]),
    zoom: 16
  })
});

const vectorLayer = new VectorLayer({
  source: new VectorSource()
});

map.addLayer(vectorLayer);

fetch('/overture.geojson')
  .then(response => response.json())
  .then(data => {
    const features = new GeoJSON().readFeatures(data, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    
    vectorLayer.getSource().addFeatures(features);
    
    applyStyle(vectorLayer, 'src/mapbox-style.json');
    
    if (features.length > 0) {
      map.getView().fit(vectorLayer.getSource().getExtent(), { padding: [50, 50, 50, 50] });
    }
  });