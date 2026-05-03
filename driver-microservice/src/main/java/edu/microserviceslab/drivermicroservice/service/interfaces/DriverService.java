package edu.microserviceslab.drivermicroservice.service.interfaces;

import edu.microserviceslab.drivermicroservice.dto.CreateDriverRequest;
import edu.microserviceslab.drivermicroservice.entity.Driver;
import edu.microserviceslab.drivermicroservice.entity.DriverStatus;

import java.util.List;

public interface DriverService {
    List<Driver> findAll();
    Driver findById(Long id);
    Driver create(CreateDriverRequest request);
    Driver update(Long id, CreateDriverRequest request);
    void delete(Long id);
    Driver assignVehicle(Long driverId, Long vehicleId);
    Driver updateStatus(Long driverId, DriverStatus status);
}
