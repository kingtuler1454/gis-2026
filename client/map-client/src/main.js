import 'ol/ol.css';
import './style.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import OSM from 'ol/source/OSM';
import { Style, Fill, Stroke } from 'ol/style';
import { fromLonLat } from 'ol/proj';

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

fetch('/overture.geojson')
  .then(response => response.json())
  .then(data => {

    const features = new GeoJSON().readFeatures(data, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    
   
    const vectorSource = new VectorSource({ features });
    
    const style = (feature) => {
      const sourceType = feature.get('source_type');
      let color, borderColor;
      
      if (sourceType === 'my') {
        color = 'rgba(76, 175, 80, 0.8)';   // Зеленый
        borderColor = '#2e7d32';
      } else if (sourceType === 'osm') {
        color = 'rgba(33, 150, 243, 0.8)';  // Синий
        borderColor = '#1565c0';
      } else if (sourceType === 'ml') {
        color = 'rgba(255, 152, 0, 0.8)';   // Оранжевый
        borderColor = '#e65100';
      } 
      
      return new Style({
        fill: new Fill({ color: color }),
        stroke: new Stroke({ color: borderColor, width: 2 })
      });
    };
    
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: style
    });
    
    map.addLayer(vectorLayer);
    
    if (features.length > 0) {
      map.getView().fit(vectorSource.getExtent(), { padding: [50, 50, 50, 50] });
    }
  })
 