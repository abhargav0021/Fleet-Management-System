package edu.microserviceslab.usagemicroservice.controller;

import edu.microserviceslab.usagemicroservice.dto.EndTripRequest;
import edu.microserviceslab.usagemicroservice.dto.LocationUpdateMessage;
import edu.microserviceslab.usagemicroservice.dto.LocationUpdateRequest;
import edu.microserviceslab.usagemicroservice.dto.StartTripRequest;
import edu.microserviceslab.usagemicroservice.entity.LocationUpdate;
import edu.microserviceslab.usagemicroservice.entity.Trip;
import edu.microserviceslab.usagemicroservice.service.interfaces.UsageService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class UsageController {

    private final UsageService usageService;

    public UsageController(UsageService usageService) {
        this.usageService = usageService;
    }

    @PostMapping("/locations")
    public ResponseEntity<LocationUpdateMessage> ingestLocation(@Valid @RequestBody LocationUpdateRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(usageService.ingestLocation(request));
    }

    @GetMapping("/locations/vehicle/{vehicleId}")
    public List<LocationUpdate> findLocationsByVehicle(
            @PathVariable Long vehicleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return usageService.findLocationsByVehicle(vehicleId, from, to);
    }

    @GetMapping("/trips")
    public List<Trip> findAllTrips() {
        return usageService.findAllTrips();
    }

    @PostMapping("/trips/start")
    public ResponseEntity<Trip> startTrip(@Valid @RequestBody StartTripRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usageService.startTrip(request));
    }

    @PutMapping("/trips/{id}/end")
    public Trip endTrip(@PathVariable Long id, @Valid @RequestBody EndTripRequest request) {
        return usageService.endTrip(id, request);
    }
}
