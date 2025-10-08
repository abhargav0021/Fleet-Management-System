package edu.microserviceslab.vehiclemicroservice.controller;

import edu.microserviceslab.vehiclemicroservice.VehicleApplication;
import edu.microserviceslab.vehiclemicroservice.entity.Vehicle;
import edu.microserviceslab.vehiclemicroservice.service.VehicleServiceImpl;
import edu.microserviceslab.vehiclemicroservice.service.interfaces.VehicleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehicle")
public class VehicleController {

    private VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @ResponseBody
    @RequestMapping("/list")
    public List<Vehicle> listAllVehicles() {
        return vehicleService.getAllVehicles();
    }

    @ResponseBody
    @RequestMapping(path="/add", method=RequestMethod.POST)
    public Vehicle addVehicle(@RequestBody Vehicle vehicle) {
        return VehicleServiceImpl.addVehicleRegistration(vehicle);
    }


    @ResponseBody
    @RequestMapping("/licensePlate/{vehicleId}")
    public String getVehicleLicensePlate(@PathVariable("vehicleId") Long vehicleId) {
        return vehicleService.getVehicleLicensePlate(vehicleId);
    }
}
