package edu.microserviceslab.drivermicroservice.service;

import edu.microserviceslab.drivermicroservice.dto.CreateDriverRequest;
import edu.microserviceslab.drivermicroservice.entity.Driver;
import edu.microserviceslab.drivermicroservice.entity.DriverStatus;
import edu.microserviceslab.drivermicroservice.exception.ResourceNotFoundException;
import edu.microserviceslab.drivermicroservice.repo.DriverRepo;
import edu.microserviceslab.drivermicroservice.service.interfaces.DriverService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DriverServiceImpl implements DriverService {

    private final DriverRepo driverRepo;

    public DriverServiceImpl(DriverRepo driverRepo) {
        this.driverRepo = driverRepo;
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
        applyRequest(driver, request);
        driver.setStatus(request.getStatus() == null ? driver.getStatus() : request.getStatus());
        return driverRepo.save(driver);
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
}
