CREATE TABLE drivers (
    id                  BIGSERIAL PRIMARY KEY,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    phone               VARCHAR(30),
    license_number      VARCHAR(50)  NOT NULL UNIQUE,
    status              VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE',
    assigned_vehicle_id BIGINT,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_status ON drivers (status);
CREATE INDEX idx_drivers_email ON drivers (email);
