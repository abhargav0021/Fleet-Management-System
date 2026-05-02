package edu.microserviceslab.vehiclemicroservice.service;

import edu.microserviceslab.vehiclemicroservice.dto.CreateVehicleRequest;
import edu.microserviceslab.vehiclemicroservice.entity.Vehicle;
import edu.microserviceslab.vehiclemicroservice.entity.VehicleStatus;
import edu.microserviceslab.vehiclemicroservice.exception.ResourceNotFoundException;
import edu.microserviceslab.vehiclemicroservice.repo.VehicleRepo;
import edu.microserviceslab.vehiclemicroservice.service.interfaces.VehicleService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepo vehicleRepo;

    public VehicleServiceImpl(VehicleRepo vehicleRepo) {
        this.vehicleRepo = vehicleRepo;
    }

    @Override
    public List<Vehicle> findAll() {
        return vehicleRepo.findAll();
    }

    @Override
    public Vehicle findById(Long id) {
        return getVehicle(id);
    }

    @Override
    public Vehicle create(CreateVehicleRequest request) {
        Vehicle vehicle = new Vehicle();
        applyRequest(vehicle, request);
        vehicle.setStatus(request.getStatus() == null ? VehicleStatus.ACTIVE : request.getStatus());
        return vehicleRepo.save(vehicle);
    }

    @Override
    public Vehicle update(Long id, CreateVehicleRequest request) {
        Vehicle vehicle = getVehicle(id);
        applyRequest(vehicle, request);
        vehicle.setStatus(request.getStatus() == null ? vehicle.getStatus() : request.getStatus());
        return vehicleRepo.save(vehicle);
    }

    @Override
    public void delete(Long id) {
        Vehicle vehicle = getVehicle(id);
        vehicleRepo.delete(vehicle);
    }

    @Override
    public Vehicle updateStatus(Long id, VehicleStatus status) {
        Vehicle vehicle = getVehicle(id);
        vehicle.setStatus(status);
        return vehicleRepo.save(vehicle);
    }

    private Vehicle getVehicle(Long id) {
        return vehicleRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id " + id));
    }

    private void applyRequest(Vehicle vehicle, CreateVehicleRequest request) {
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setType(request.getType());
        vehicle.setMake(request.getMake());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
    }
}
