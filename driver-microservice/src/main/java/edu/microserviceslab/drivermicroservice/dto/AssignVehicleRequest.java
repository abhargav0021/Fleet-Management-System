package edu.microserviceslab.drivermicroservice.dto;

public class AssignVehicleRequest {
    // Null clears the assignment
    private Long vehicleId;

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
}
