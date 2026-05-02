package edu.microserviceslab.vehiclemicroservice.dto;

import edu.microserviceslab.vehiclemicroservice.entity.VehicleStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateVehicleStatusRequest {

    @NotNull(message = "Status is required")
    private VehicleStatus status;

    public VehicleStatus getStatus() { return status; }
    public void setStatus(VehicleStatus status) { this.status = status; }
}
