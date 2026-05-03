package edu.microserviceslab.drivermicroservice.dto;

import java.time.LocalDateTime;

public class VehicleAssignedEvent {
    private Long driverId;
    private Long vehicleId;
    private LocalDateTime assignedAt;

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
}
