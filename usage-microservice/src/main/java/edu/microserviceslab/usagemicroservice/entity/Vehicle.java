package edu.microserviceslab.usagemicroservice.entity;

public class Vehicle {
    private Long id;
    private String licensePlate;

    public Vehicle(Long id, String licensePlate) {
        this.id = id;
        this.licensePlate = licensePlate;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }
}