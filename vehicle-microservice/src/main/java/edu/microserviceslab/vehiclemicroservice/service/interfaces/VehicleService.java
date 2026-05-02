package edu.microserviceslab.vehiclemicroservice.service.interfaces;

import edu.microserviceslab.vehiclemicroservice.dto.CreateVehicleRequest;
import edu.microserviceslab.vehiclemicroservice.entity.Vehicle;
import edu.microserviceslab.vehiclemicroservice.entity.VehicleStatus;

import java.util.List;

public interface VehicleService {
    List<Vehicle> findAll();
    Vehicle findById(Long id);
    Vehicle create(CreateVehicleRequest request);
    Vehicle update(Long id, CreateVehicleRequest request);
    void delete(Long id);
    Vehicle updateStatus(Long id, VehicleStatus status);
}
