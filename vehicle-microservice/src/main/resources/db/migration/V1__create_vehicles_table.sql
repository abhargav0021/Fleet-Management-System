CREATE TABLE vehicles (
    id            BIGSERIAL PRIMARY KEY,
    license_plate VARCHAR(50)  NOT NULL UNIQUE,
    type          VARCHAR(50)  NOT NULL,
    make          VARCHAR(100) NOT NULL,
    model         VARCHAR(100) NOT NULL,
    year          INTEGER      NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_status ON vehicles (status);
CREATE INDEX idx_vehicles_license_plate ON vehicles (license_plate);
