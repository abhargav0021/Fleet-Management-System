package edu.microserviceslab.usagemicroservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.PositiveOrZero;

public class EndTripRequest {

    @NotNull(message = "End latitude is required")
    @DecimalMin(value = "-90.0", message = "End latitude must be at least -90")
    @DecimalMax(value = "90.0", message = "End latitude must be at most 90")
    private Double endLat;

    @NotNull(message = "End longitude is required")
    @DecimalMin(value = "-180.0", message = "End longitude must be at least -180")
    @DecimalMax(value = "180.0", message = "End longitude must be at most 180")
    private Double endLon;

    @PositiveOrZero(message = "Distance must be zero or greater")
    private Double distanceKm;

    public Double getEndLat() { return endLat; }
    public void setEndLat(Double endLat) { this.endLat = endLat; }

    public Double getEndLon() { return endLon; }
    public void setEndLon(Double endLon) { this.endLon = endLon; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }
}
