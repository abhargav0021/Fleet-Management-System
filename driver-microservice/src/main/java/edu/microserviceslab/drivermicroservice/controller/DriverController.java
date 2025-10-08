package edu.microserviceslab.drivermicroservice.controller;

import edu.microserviceslab.drivermicroservice.common.proxies.VehicleRestProxy;
import edu.microserviceslab.drivermicroservice.dto.DriverVehicleChangeRequest;
import edu.microserviceslab.drivermicroservice.entity.Driver;
import edu.microserviceslab.drivermicroservice.service.interfaces.DriverService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/driver")
public class DriverController {

    private DriverService driverService;

    private VehicleRestProxy vehicleRestProxy;

    public DriverController(DriverService driverService, VehicleRestProxy vehicleRestProxy) {
        this.driverService = driverService;
        this.vehicleRestProxy = vehicleRestProxy;
    }

    @ResponseBody
    @RequestMapping(path = "/add", method = RequestMethod.POST)
    public Driver addDriver(@RequestBody Driver driver) {
        if (driver.getPhoneNumber() == null || driver.getPhoneNumber().isEmpty()){
            throw new IllegalStateException("Driver Phone number is required");
        }
        return driverService.addDriver(driver);
    }

    @ResponseBody
    @RequestMapping(path = "/changeVehicle", method = RequestMethod.POST)
    public Driver changeVehicle(@RequestBody DriverVehicleChangeRequest changeRequest) {
        if (changeRequest == null) {
            throw new IllegalStateException("Please submit a vehicle change request.");
        }
        if (changeRequest.getDriverId() == null) {
            throw new IllegalStateException("The driver's ID number must be present in a vehicle change request.");
        }
        if (changeRequest.getVehicleId() == null) {
            throw new IllegalStateException("The vehicle's ID number must be present in a vehicle change request.");
        }
        if (StringUtils.isBlank(vehicleRestProxy.getVehicleLicensePlate(changeRequest.getVehicleId()))) {
            throw new IllegalStateException("The vehicle does not have a valid registration.");
        }

        return driverService.changeVehicle(changeRequest);
    }

    @ResponseBody
    @RequestMapping("/list")
    public List<Driver> listAllDrivers() {
        return driverService.getAllDrivers();
    }

    @ResponseBody
    @RequestMapping("/{driverId}")
    public Driver getDriverById(@PathVariable("driverId") Long driverId) {
        return driverService.getDriverById(driverId);
    }

    @ResponseBody
    @RequestMapping("/{driverId}/licensePlate")
    public String getDriverLicensePlate(@PathVariable("driverId") Long driverId) {
        Driver driver = driverService.getDriverById(driverId);

        String licensePlate = null;
        if (driver != null && driver.getVehicleId() != null) {
            licensePlate = vehicleRestProxy.getVehicleLicensePlate(driver.getVehicleId());
        }

        return licensePlate;
    }

    @ResponseBody
    @RequestMapping("/{driverId}/vehicleId")
    public Long getDriverForVehicle(@PathVariable("driverId") Long driverId) {
        Driver driver = driverService.getDriverById(driverId);

        return driver == null ? null : driver.getVehicleId();
    }
}
