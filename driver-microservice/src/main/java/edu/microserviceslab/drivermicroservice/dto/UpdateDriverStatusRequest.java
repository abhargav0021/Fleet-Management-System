package edu.microserviceslab.drivermicroservice.dto;

import edu.microserviceslab.drivermicroservice.entity.DriverStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateDriverStatusRequest {

    @NotNull(message = "Status is required")
    private DriverStatus status;

    public DriverStatus getStatus() { return status; }
    public void setStatus(DriverStatus status) { this.status = status; }
}
