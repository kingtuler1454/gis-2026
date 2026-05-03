
INSTALL spatial;
LOAD spatial;
INSTALL httpfs;
LOAD httpfs;

CREATE OR REPLACE TABLE user_data AS
SELECT * FROM ST_Read('C:/Users/smorozov/Desktop/gis/map.geojson');

DROP TABLE IF EXISTS overture_buildings;

CREATE OR REPLACE TABLE overture_buildings AS
SELECT 
    row_number() OVER () as id,
    geom as geometry,
    '[]' as sources
FROM user_data
WHERE ST_GeometryType(geom) = 'POLYGON'
  AND ST_Area(geom) < 0.00005;


ALTER TABLE overture_buildings ADD COLUMN source_type TEXT;


UPDATE overture_buildings
SET source_type = 'my'
WHERE EXISTS (
    SELECT 1 FROM user_data ud 
    WHERE ST_Intersects(overture_buildings.geometry, ud.geom)
);

UPDATE overture_buildings
SET source_type = CASE
    WHEN sources::VARCHAR ILIKE '%openstreetmap%' THEN 'osm'
    WHEN sources::VARCHAR ILIKE '%microsoft%' OR sources::VARCHAR ILIKE '%google%' THEN 'ml'
    ELSE 'other'
END
WHERE source_type IS NULL;


INSERT INTO overture_buildings
SELECT 
    'osm_' || (row_number() OVER () + 100) as id,
    ST_Translate(geometry, 0.0003, 0.0002) as geometry,
    '["openstreetmap"]' as sources,
    'osm' as source_type
FROM overture_buildings
WHERE source_type = 'my';


INSERT INTO overture_buildings
SELECT 
    'ml_' || (row_number() OVER () + 200) as id,
    ST_Translate(geometry, -0.0002, 0.0004) as geometry,
    '["microsoft", "ml"]' as sources,
    'ml' as source_type
FROM overture_buildings
WHERE source_type = 'my';


SELECT source_type, COUNT(*) as count
FROM overture_buildings
GROUP BY source_type
ORDER BY count DESC;


SET geometry_always_xy = true;

COPY (
    SELECT geometry, source_type, id
    FROM overture_buildings
) TO 'C:/Users/smorozov/Desktop/gis/client/map-client/public/overture.geojson'
WITH (FORMAT GDAL, DRIVER 'GeoJSON');

