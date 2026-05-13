INSTALL spatial;
LOAD spatial;

INSTALL httpfs;
LOAD httpfs;

SET s3_region = 'us-west-2';
SET http_timeout = 300000;
SET http_retries = 5;

CREATE OR REPLACE TABLE user_data AS
SELECT
    geom,
    id,
    building
FROM ST_Read('C:\Users\smorozov\Desktop\gis\map.geojson')
WHERE ST_GeometryType(geom) IN ('POLYGON', 'MULTIPOLYGON');

CREATE OR REPLACE TABLE bbox_data AS
SELECT
    ST_XMin(ST_Extent_Agg(geom)) AS xmin,
    ST_XMax(ST_Extent_Agg(geom)) AS xmax,
    ST_YMin(ST_Extent_Agg(geom)) AS ymin,
    ST_YMax(ST_Extent_Agg(geom)) AS ymax
FROM user_data;

CREATE OR REPLACE TABLE overture_buildings AS
SELECT
    id,
    geometry                AS geom,
    sources,
    height,
    num_floors,
    class,
    names."primary"         AS name
FROM read_parquet(
    's3://overturemaps-us-west-2/release/2026-04-15.0/theme=buildings/type=building/*.zstd.parquet'
)
WHERE
    bbox.xmin <= 49.3590027
    AND bbox.xmax >= 49.3417518
    AND bbox.ymin <= 53.6767511
    AND bbox.ymax >= 53.6632634;

ALTER TABLE overture_buildings
ADD COLUMN source_type VARCHAR;

UPDATE overture_buildings o
SET source_type = 'my'
FROM user_data u
WHERE try(
    ST_Intersects(
        ST_SetCRS(o.geom, 'EPSG:4326'),
        u.geom
    )
) = true;

UPDATE overture_buildings
SET source_type =
    CASE
        WHEN CAST(sources AS VARCHAR) ILIKE '%openstreetmap%' THEN 'osm'
        WHEN CAST(sources AS VARCHAR) ILIKE '%microsoft%'
          OR CAST(sources AS VARCHAR) ILIKE '%google%'
          OR CAST(sources AS VARCHAR) ILIKE '%ml%' THEN 'ml'
        ELSE 'ml'
    END
WHERE source_type IS NULL;

SELECT
    source_type,
    COUNT(*) AS total
FROM overture_buildings
GROUP BY source_type
ORDER BY total DESC;

SET geometry_always_xy = true;

COPY (
    SELECT
        geom AS geometry,
        id,
        source_type,
        height,
        num_floors,
        class,
        name
    FROM overture_buildings
    WHERE geom IS NOT NULL
)
TO 'C:\Users\smorozov\Desktop\gis\client\map-client\public\overture.geojson'
WITH (FORMAT GDAL, DRIVER 'GeoJSON');