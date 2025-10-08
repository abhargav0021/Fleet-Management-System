package edu.microserviceslab.usagemicroservice.entity;

public class UsageResponse {
    private Long id;
    private String createdDate;
    private double speed;
    private double fuelLevel;
    private int rotationsPerMinute;
    private double latitude;
    private double longitude;
    private Long driverId;
    private String driverFullname;
    private Long vehicleId;
    private String vehicleLicensePlate;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(String createdDate) {
        this.createdDate = createdDate;
    }

    public double getSpeed() {
        return speed;
    }

    public void setSpeed(double speed) {
        this.speed = speed;
    }

    public double getFuelLevel() {
        return fuelLevel;
    }

    public void setFuelLevel(double fuelLevel) {
        this.fuelLevel = fuelLevel;
    }

    public int getRotationsPerMinute() {
        return rotationsPerMinute;
    }

    public void setRotationsPerMinute(int rotationsPerMinute) {
        this.rotationsPerMinute = rotationsPerMinute;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public String getDriverFullname() {
        return driverFullname;
    }

    public void setDriverFullname(String driverFullname) {
        this.driverFullname = driverFullname;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehicleLicensePlate() {
        return vehicleLicensePlate;
    }

    public void setVehicleLicensePlate(String vehicleLicensePlate) {
        this.vehicleLicensePlate = vehicleLicensePlate;
    }
}
