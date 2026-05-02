CREATE TABLE trips (
    id           BIGSERIAL        PRIMARY KEY,
    vehicle_id   BIGINT           NOT NULL,
    driver_id    BIGINT           NOT NULL,
    start_time   TIMESTAMP        NOT NULL,
    end_time     TIMESTAMP,
    start_lat    DOUBLE PRECISION NOT NULL,
    start_lon    DOUBLE PRECISION NOT NULL,
    end_lat      DOUBLE PRECISION,
    end_lon      DOUBLE PRECISION,
    status       VARCHAR(20)      NOT NULL DEFAULT 'IN_PROGRESS',
    distance_km  DOUBLE PRECISION
);

CREATE INDEX idx_trips_vehicle_id ON trips (vehicle_id);
CREATE INDEX idx_trips_driver_id ON trips (driver_id);
CREATE INDEX idx_trips_status ON trips (status);

ALTER TABLE location_updates
    ADD CONSTRAINT fk_location_updates_trip
    FOREIGN KEY (trip_id) REFERENCES trips (id);
