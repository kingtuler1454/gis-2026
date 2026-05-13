import 'ol/ol.css';
import './style.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
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



const buildingsLayer = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8080/geoserver/gis/wms',
    params: { LAYERS: 'gis:buildings', TILED: true },
    ratio: 1,
    serverType: 'geoserver'
  })
});

const roadsLayer = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8080/geoserver/gis/wms',
    params: { LAYERS: 'gis:roads', TILED: true },
    ratio: 1,
    serverType: 'geoserver'
  })
});

const poiLayer = new ImageLayer({
  source: new ImageWMS({
    url: 'http://localhost:8080/geoserver/gis/wms',
    params: { LAYERS: 'gis:poi', TILED: true },
    ratio: 1,
    serverType: 'geoserver'
  })
});

map.addLayer(buildingsLayer);
map.addLayer(roadsLayer);
map.addLayer(poiLayer);


const overtureLayer = new VectorLayer({
  source: new VectorSource()
});

map.addLayer(overtureLayer);

fetch('/overture.geojson')
  .then(response => response.json())
  .then(data => {
    const features = new GeoJSON().readFeatures(data, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    });
    
    overtureLayer.getSource().addFeatures(features);
    
    applyStyle(overtureLayer, 'src/mapbox-style.json');
    
  
    
    if (features.length > 0) {
      map.getView().fit(overtureLayer.getSource().getExtent(), { padding: [50, 50, 50, 50] });
    }
  })
  .catch(error => console.error('Ошибка загрузки overture.geojson:', error));