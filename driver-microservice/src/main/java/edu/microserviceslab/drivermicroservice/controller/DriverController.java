package edu.microserviceslab.drivermicroservice.controller;

import edu.microserviceslab.drivermicroservice.dto.AssignVehicleRequest;
import edu.microserviceslab.drivermicroservice.dto.CreateDriverRequest;
import edu.microserviceslab.drivermicroservice.dto.UpdateDriverStatusRequest;
import edu.microserviceslab.drivermicroservice.entity.Driver;
import edu.microserviceslab.drivermicroservice.service.interfaces.DriverService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/drivers")
public class DriverController {

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    @PostMapping
    public ResponseEntity<Driver> create(@Valid @RequestBody CreateDriverRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(driverService.create(request));
    }

    @GetMapping
    public List<Driver> findAll() {
        return driverService.findAll();
    }

    @GetMapping("/{id}")
    public Driver findById(@PathVariable Long id) {
        return driverService.findById(id);
    }

    @PutMapping("/{id}")
    public Driver update(@PathVariable Long id, @Valid @RequestBody CreateDriverRequest request) {
        return driverService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        driverService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/assign-vehicle")
    public Driver assignVehicle(@PathVariable Long id, @RequestBody AssignVehicleRequest request) {
        return driverService.assignVehicle(id, request.getVehicleId());
    }

    @PatchMapping("/{id}/status")
    public Driver updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateDriverStatusRequest request) {
        return driverService.updateStatus(id, request.getStatus());
    }
}
