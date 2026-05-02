CREATE TABLE location_updates (
    id         BIGSERIAL        PRIMARY KEY,
    vehicle_id BIGINT           NOT NULL,
    driver_id  BIGINT           NOT NULL,
    latitude   DOUBLE PRECISION NOT NULL,
    longitude  DOUBLE PRECISION NOT NULL,
    speed      DOUBLE PRECISION,
    heading    DOUBLE PRECISION,
    event_time TIMESTAMP        NOT NULL,
    trip_id    BIGINT
);

CREATE INDEX idx_location_updates_vehicle_id ON location_updates (vehicle_id);
CREATE INDEX idx_location_updates_event_time ON location_updates (event_time);
CREATE INDEX idx_location_updates_trip_id ON location_updates (trip_id);
