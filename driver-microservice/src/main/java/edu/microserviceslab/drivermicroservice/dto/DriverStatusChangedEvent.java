package edu.microserviceslab.drivermicroservice.dto;

import edu.microserviceslab.drivermicroservice.entity.DriverStatus;

import java.time.LocalDateTime;

public class DriverStatusChangedEvent {
    private Long driverId;
    private DriverStatus previousStatus;
    private DriverStatus newStatus;
    private LocalDateTime changedAt;

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public DriverStatus getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(DriverStatus previousStatus) { this.previousStatus = previousStatus; }

    public DriverStatus getNewStatus() { return newStatus; }
    public void setNewStatus(DriverStatus newStatus) { this.newStatus = newStatus; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
}
