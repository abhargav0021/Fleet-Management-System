package edu.microserviceslab.usagemicroservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

public class StartTripRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Driver ID is required")
    private Long driverId;

    @NotNull(message = "Start latitude is required")
    @DecimalMin(value = "-90.0", message = "Start latitude must be at least -90")
    @DecimalMax(value = "90.0", message = "Start latitude must be at most 90")
    private Double startLat;

    @NotNull(message = "Start longitude is required")
    @DecimalMin(value = "-180.0", message = "Start longitude must be at least -180")
    @DecimalMax(value = "180.0", message = "Start longitude must be at most 180")
    private Double startLon;

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public Double getStartLat() { return startLat; }
    public void setStartLat(Double startLat) { this.startLat = startLat; }

    public Double getStartLon() { return startLon; }
    public void setStartLon(Double startLon) { this.startLon = startLon; }
}
