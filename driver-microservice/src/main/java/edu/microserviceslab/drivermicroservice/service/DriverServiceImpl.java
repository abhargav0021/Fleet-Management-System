package edu.microserviceslab.drivermicroservice.service;

import edu.microserviceslab.drivermicroservice.dto.CreateDriverRequest;
import edu.microserviceslab.drivermicroservice.entity.Driver;
import edu.microserviceslab.drivermicroservice.entity.DriverStatus;
import edu.microserviceslab.drivermicroservice.exception.ResourceNotFoundException;
import edu.microserviceslab.drivermicroservice.messaging.DriverEventPublisher;
import edu.microserviceslab.drivermicroservice.repo.DriverRepo;
import edu.microserviceslab.drivermicroservice.service.interfaces.DriverService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DriverServiceImpl implements DriverService {

    private final DriverRepo driverRepo;
    private final DriverEventPublisher driverEventPublisher;

    public DriverServiceImpl(DriverRepo driverRepo, DriverEventPublisher driverEventPublisher) {
        this.driverRepo = driverRepo;
        this.driverEventPublisher = driverEventPublisher;
    }

    @Override
    public List<Driver> findAll() {
        return driverRepo.findAll();
    }

    @Override
    public Driver findById(Long id) {
        return getDriver(id);
    }

    @Override
    public Driver create(CreateDriverRequest request) {
        Driver driver = new Driver();
        applyRequest(driver, request);
        driver.setStatus(request.getStatus() == null ? DriverStatus.AVAILABLE : request.getStatus());
        return driverRepo.save(driver);
    }

    @Override
    public Driver update(Long id, CreateDriverRequest request) {
        Driver driver = getDriver(id);
        DriverStatus previousStatus = driver.getStatus();
        applyRequest(driver, request);
        driver.setStatus(request.getStatus() == null ? driver.getStatus() : request.getStatus());
        Driver saved = driverRepo.save(driver);
        publishStatusChangedIfNeeded(saved.getId(), previousStatus, saved.getStatus());
        return saved;
    }

    @Override
    public void delete(Long id) {
        Driver driver = getDriver(id);
        driverRepo.delete(driver);
    }

    @Override
    public Driver assignVehicle(Long driverId, Long vehicleId) {
        Driver driver = getDriver(driverId);
        driver.setAssignedVehicleId(vehicleId);
        return driverRepo.save(driver);
    }

    @Override
    public Driver updateStatus(Long driverId, DriverStatus status) {
        Driver driver = getDriver(driverId);
        DriverStatus previousStatus = driver.getStatus();
        driver.setStatus(status);
        Driver saved = driverRepo.save(driver);
        publishStatusChangedIfNeeded(saved.getId(), previousStatus, saved.getStatus());
        return saved;
    }

    private Driver getDriver(Long id) {
        return driverRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id " + id));
    }

    private void applyRequest(Driver driver, CreateDriverRequest request) {
        driver.setFirstName(request.getFirstName());
        driver.setLastName(request.getLastName());
        driver.setEmail(request.getEmail());
        driver.setPhone(request.getPhone());
        driver.setLicenseNumber(request.getLicenseNumber());
    }

    private void publishStatusChangedIfNeeded(Long driverId, DriverStatus previousStatus, DriverStatus newStatus) {
        if (previousStatus != null && previousStatus != newStatus) {
            driverEventPublisher.publishStatusChanged(driverId, previousStatus, newStatus);
        }
    }
}
